import type { NodeKind, Scene, SceneNode, Tone } from '@/content/types';
import { SHAPE } from './art';

/** The stage's viewBox. The camera zooms the world to fit inside it. */
export const VW = 1000;
export const VH = 600;
/** How far from a block's centre a connection starts and ends. */
const GAP = 68;
/** Approximate width of one character at the pill font size. */
const CH = 7.6;
/** How far the two directions of a busy connection bow apart. */
const BOW = 34;

export const at = (node: SceneNode) => ({ x: node.col * 200, y: node.row * 236 });
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const laneKey = (a: string, b: string) => `${a}>${b}`;

/** Top and bottom of a block relative to its centre, used to place its chips. */
export const extent = (kind: NodeKind) => {
  const shape = SHAPE[kind];
  if (shape === 'cylinder') return { top: -49, bottom: 45 };
  if (shape === 'slab') return { top: -66, bottom: 6 };
  return { top: -88, bottom: 58 };
};

/** [left, top, right, bottom] in world units. */
type Rect = [number, number, number, number];
export const pillWidth = (text: string) => text.length * CH + 24;
const pillRect = (x: number, y: number, w: number): Rect => [x - w / 2, y - 14, x + w / 2, y + 14];
const touches = (a: Rect, b: Rect) =>
  Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 2 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 2;

export interface Chips {
  name: { x: number; y: number };
  note?: { x: number; y: number; text: string; tone: Tone };
  meter?: { x: number; y: number; w: number; value: number; text: string };
}

export interface Curve {
  d: string;
  end: { x: number; y: number };
  /** Unit direction at the end, for the arrow head. */
  dir: { x: number; y: number };
  /** Unit normal, pointing to the side the curve bows to. */
  n: { x: number; y: number };
  point: (t: number) => { x: number; y: number };
}

/** Everything about a scene that does not depend on time. */
export function layout(nodes: SceneNode[], scene: Scene) {
  const flows = scene.flows ?? [];
  const links = scene.links ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const mentioned = new Set<string>([
    ...links.flatMap(([a, b]) => [a, b]),
    ...flows.flatMap(([a, b]) => [a, b]),
    ...Object.keys(scene.state ?? {}),
    ...Object.keys(scene.note ?? {}),
    ...Object.keys(scene.meter ?? {}),
  ]);
  const visible = new Set(scene.show ?? (mentioned.size ? [...mentioned] : nodes.map((node) => node.id)));

  // One lane per direction, plus plain links that no packet uses.
  const lanes = new Set(flows.map(([a, b]) => laneKey(a, b)));
  const pairs = new Set(flows.map(([a, b]) => pairKey(a, b)));
  const plain = links.filter(([a, b]) => !pairs.has(pairKey(a, b)));

  const curve = (from: string, to: string): Curve => {
    const p = at(byId.get(from)!);
    const q = at(byId.get(to)!);
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const ux = (q.x - p.x) / len;
    const uy = (q.y - p.y) / len;
    const n = { x: uy, y: -ux };
    const two = lanes.has(laneKey(from, to)) && lanes.has(laneKey(to, from));
    const side = two ? 7 : 0;
    const bow = two ? BOW : 0;
    const a = { x: p.x + ux * GAP + n.x * side, y: p.y + uy * GAP + n.y * side };
    const b = { x: q.x - ux * GAP + n.x * side, y: q.y - uy * GAP + n.y * side };
    const c = { x: (a.x + b.x) / 2 + n.x * bow, y: (a.y + b.y) / 2 + n.y * bow };
    const dl = Math.hypot(b.x - c.x, b.y - c.y) || 1;
    return {
      d: `M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`,
      end: b,
      dir: { x: (b.x - c.x) / dl, y: (b.y - c.y) / dl },
      n,
      point: (t) => {
        const s = 1 - t;
        return { x: s * s * a.x + 2 * s * t * c.x + t * t * b.x, y: s * s * a.y + 2 * s * t * c.y + t * t * b.y };
      },
    };
  };
  const curves = new Map<string, Curve>();
  for (const [a, b] of [...flows, ...links]) curves.set(laneKey(a, b), curve(a, b));

  // Pass 1: every block's own chips, and the space they take up.
  const obstacles: Rect[] = [];
  const chips = new Map<string, Chips>();
  const joined = [...flows, ...links];
  for (const node of nodes) {
    const { x, y } = at(node);
    const ext = extent(node.kind);
    // A block with a line going straight up keeps its chips to the right, clear of the line.
    const lineAbove = joined.some(([a, b]) => {
      const otherId = a === node.id ? b : b === node.id ? a : undefined;
      const other = otherId ? byId.get(otherId) : undefined;
      return other ? at(other).y < y - 60 && Math.abs(at(other).x - x) < 70 : false;
    });
    const slot = (w: number, level: number) =>
      lineAbove ? { x: x + 66 + w / 2, y: y + ext.top + 22 - level * 34 } : { x, y: y + ext.top - 22 - level * 34 };

    const name = { x, y: y + ext.bottom + 24 };
    const rawNote = scene.note?.[node.id];
    const [noteText, noteTone]: [string | undefined, Tone] = Array.isArray(rawNote) ? rawNote : [rawNote, 'neutral'];
    const note = noteText ? { ...slot(pillWidth(noteText), 0), text: noteText, tone: noteTone } : undefined;
    const rawMeter = scene.meter?.[node.id];
    let meter: Chips['meter'];
    if (rawMeter !== undefined) {
      const [value, text] = Array.isArray(rawMeter) ? rawMeter : [rawMeter, `${rawMeter}%`];
      const w = 64 + text.length * CH + 24;
      meter = { ...slot(w, note ? 1 : 0), w, value, text };
    }
    chips.set(node.id, { name, note, meter });
    if (!visible.has(node.id)) continue;
    obstacles.push([x - 54, y + ext.top + 6, x + 54, y + ext.bottom - 2]);
    obstacles.push(pillRect(name.x, name.y, pillWidth(node.label)));
    if (note) obstacles.push(pillRect(note.x, note.y, pillWidth(note.text)));
    if (meter) obstacles.push(pillRect(meter.x, meter.y, meter.w));
  }

  // Pass 2: put each lane's chip where it collides with the fewest things.
  const taken: Array<{ lane: string; rect: Rect }> = [];
  const placeChip = (from: string, to: string, text: string, blocked = false) => {
    const lane = laneKey(from, to);
    const c = curves.get(lane)!;
    const w = pillWidth(text);
    // Far enough from the line that the chip's box does not touch it.
    const clear = Math.abs(c.n.x) * (w / 2) + Math.abs(c.n.y) * 14 + 9;
    let best = { x: 0, y: 0, cost: Infinity };
    // A blocked packet's chip stays in the first half, leaving room for the cross.
    for (const t of blocked ? [0.3, 0.2, 0.42] : [0.5, 0.36, 0.64, 0.24, 0.76]) {
      for (const offset of [clear, -clear, 0]) {
        const on = c.point(t);
        const x = on.x + c.n.x * offset;
        const y = on.y + c.n.y * offset;
        const rect = pillRect(x, y, w);
        const cost =
          obstacles.filter((o) => touches(o, rect)).length * 10 +
          taken.filter((o) => o.lane !== lane && touches(o.rect, rect)).length * 10 +
          (offset === 0 ? 1.5 : 0) +
          Math.abs(t - (blocked ? 0.3 : 0.5)) * 4 +
          (offset < 0 ? 0.6 : 0);
        if (cost < best.cost) best = { x, y, cost };
      }
    }
    taken.push({ lane, rect: pillRect(best.x, best.y, w) });
    return best;
  };
  const linkChips = plain.map(([from, to, text]) => (text ? placeChip(from, to, text) : undefined));
  const flowChips = flows.map(([from, to, , text, end]) => (text ? placeChip(from, to, text, end === 'block') : undefined));

  // A blocked packet stops at the first free spot along the way.
  const stops = flows.map(([from, to, , , end]) => {
    if (end !== 'block') return undefined;
    const c = curves.get(laneKey(from, to))!;
    let fewest = Infinity;
    let spot = { ...c.point(0.8), t: 0.8 };
    for (const t of [0.8, 0.68, 0.56, 0.44, 0.32]) {
      const { x, y } = c.point(t);
      const rect: Rect = [x - 14, y - 14, x + 14, y + 14];
      const hits = [...obstacles, ...taken.map((o) => o.rect)].filter((o) => touches(o, rect)).length;
      if (hits < fewest) {
        fewest = hits;
        spot = { x, y, t };
      }
      if (hits === 0) break;
    }
    return spot;
  });

  // Cause before effect: a block's outcome shows once the last packet that feeds it has landed
  // (or, if it only sends, once it sends). In clock cursor units; 0 = from the start.
  const revealAt = new Map<string, number>();
  for (const node of nodes) {
    let lastIn = -1;
    let firstOut = -1;
    flows.forEach(([from, to], i) => {
      if (to === node.id) lastIn = i;
      if (from === node.id && firstOut < 0) firstOut = i;
    });
    revealAt.set(node.id, lastIn >= 0 ? lastIn * 2 + 1 : Math.max(0, firstOut) * 2);
  }

  // The camera: zoom and centre the world on everything that is on stage.
  const shown = nodes.filter((node) => visible.has(node.id));
  const extents: Rect[] = [
    ...(shown.length ? shown : nodes).map((node): Rect => {
      const { x, y } = at(node);
      return [x - 90, y + extent(node.kind).top - 4, x + 90, y + 104];
    }),
    ...obstacles,
    ...taken.map((o) => o.rect),
  ];
  const x0 = Math.min(...extents.map((r) => r[0])) - 24;
  const y0 = Math.min(...extents.map((r) => r[1])) - 26;
  const x1 = Math.max(...extents.map((r) => r[2])) + 24;
  const y1 = Math.max(...extents.map((r) => r[3])) + 16;
  const zoom = Math.min(VW / (x1 - x0), VH / (y1 - y0), 1.45);
  const camera = `translate(${VW / 2 - ((x0 + x1) / 2) * zoom}px, ${VH / 2 - ((y0 + y1) / 2) * zoom}px) scale(${zoom})`;

  return { flows, plain, visible, curves, chips, linkChips, flowChips, stops, revealAt, camera };
}
