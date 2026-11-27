'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import type { NodeKind, Scene, SceneNode, Tone } from '@/content/types';
import { ARRIVE, type Timeline } from '@/lib/useTimeline';
import { BADGE, ICONS, SHAPE } from './art';
import { at, extent, laneKey, layout, pillWidth, VH, VW, type Curve } from './layout';

/** A rounded label with text, centred on (x, y). */
function Pill({ x, y, text, className }: { x: number; y: number; text: string; className: string }) {
  const w = pillWidth(text);
  return (
    <g className={`pill ${className}`}>
      <rect x={x - w / 2} y={y - 14} width={w} height={28} rx={9} />
      <text x={x} y={y + 0.5}>
        {text}
      </text>
    </g>
  );
}

function Block({ kind }: { kind: NodeKind }) {
  const shape = SHAPE[kind];
  if (shape === 'cylinder') {
    return (
      <>
        <path className="blk-side" d="M-46 -30v56a46 19 0 0 0 92 0v-56z" />
        <path className="blk-shade" d="M0 -11v56a46 19 0 0 0 46 -19v-56z" />
        <path className="blk-line" d="M-46 -30v56a46 19 0 0 0 92 0v-56" />
        <ellipse className="blk-top" cx="0" cy="-30" rx="46" ry="19" />
        <g className="blk-icon" transform="translate(-16 1) scale(1.33)">
          {ICONS[kind]}
        </g>
      </>
    );
  }
  // An isometric box: a rhombus on top and two faces in front. `d` is its height.
  const d = shape === 'slab' ? 16 : 60;
  const top = -30 - d / 2;
  const P = {
    T: `0 ${top - 28}`,
    R: `56 ${top}`,
    M: `0 ${top + 28}`,
    L: `-56 ${top}`,
    BL: `-56 ${top + d}`,
    B: `0 ${top + 28 + d}`,
    BR: `56 ${top + d}`,
  };
  return (
    <>
      <path className="blk-side" d={`M${P.L}L${P.M}L${P.R}L${P.BR}L${P.B}L${P.BL}z`} />
      <path className="blk-shade" d={`M${P.M}L${P.R}L${P.BR}L${P.B}z`} />
      <path className="blk-top" d={`M${P.T}L${P.R}L${P.M}L${P.L}z`} />
      <path className="blk-line" d={`M${P.T}L${P.R}L${P.BR}L${P.B}L${P.BL}L${P.L}z`} />
      {shape === 'slab' ? (
        <g className="blk-icon" transform={`translate(-14 ${top - 14}) scale(1.17)`}>
          {ICONS[kind]}
        </g>
      ) : (
        // Printed on the left face, in perspective.
        <g className="blk-icon" transform="translate(-28 -16) skewY(26.565) scale(1.55) translate(-12 -12)">
          {ICONS[kind]}
        </g>
      )}
    </>
  );
}

/** What a block does in the moment a packet lands on it: sparks, a scan ring, or a lifted lid. */
function Reaction({ kind }: { kind: NodeKind }) {
  if (kind === 'model' || kind === 'agent') {
    return (
      <g className="sparks">
        {[-30, -12, 8, 28].map((x, i) => (
          <path
            key={x}
            style={{ animationDelay: `${i * 70}ms` }}
            d={`M${x} -70l2.400 6 6 2.400-6 2.400-2.400 6-2.400-6-6-2.400 6-2.400z`}
          />
        ))}
      </g>
    );
  }
  if (SHAPE[kind] === 'cylinder') return <ellipse className="scan" cx="0" cy="-30" rx="46" ry="19" />;
  if (SHAPE[kind] === 'slab') return <path className="lid" d="M0 -66L56 -38L0 -10L-56 -38z" />;
  return <path className={kind === 'guard' || kind === 'judge' ? 'scan' : 'lid'} d="M0 -88L56 -60L0 -32L-56 -60z" />;
}

/** Where the floor is under each solid, below its centre. */
const GROUND = { cube: 32, cylinder: 28, slab: -18 };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

interface PacketProps {
  curve: Curve;
  index: number;
  reach: number;
  tone: Tone;
  payload?: string;
  timeline: Timeline;
}

/** A comet carrying its payload. Moved by the clock directly, without React renders. */
function Packet({ curve, index, reach, tone, payload, timeline }: PacketProps) {
  const head = useRef<SVGGElement>(null);
  const tail = useRef<SVGPathElement>(null);
  const { subscribe } = timeline;

  useLayoutEffect(
    () =>
      subscribe((time) => {
        const u = Math.min(1, Math.max(0, (time - index) / ARRIVE));
        const t = ease(u) * reach;
        const { x, y } = curve.point(t);
        head.current?.setAttribute('transform', `translate(${x} ${y})`);
        const length = Math.min(t, 0.34 * Math.sin(u * Math.PI) + 0.02);
        tail.current?.setAttribute('stroke-dasharray', `${length} 2`);
        tail.current?.setAttribute('stroke-dashoffset', `${length - t}`);
      }),
    [subscribe, curve, index, reach],
  );

  return (
    <g className={`packet tone-${tone}`}>
      <path ref={tail} className="packet-tail" d={curve.d} pathLength={1} />
      <g ref={head}>
        <circle className="packet-halo" r="18" />
        <circle className="packet-dot" r="7.5" />
        <circle className="packet-core" r="3" />
        {payload && <Pill x={0} y={-32} text={payload} className="pill-payload" />}
      </g>
    </g>
  );
}

interface StageProps {
  nodes: SceneNode[];
  scene: Scene;
  timeline: Timeline;
  /** Show the finished picture, whatever the clock says. */
  still?: boolean;
  label: string;
}

export function Stage({ nodes, scene, timeline, still = false, label }: StageProps) {
  const L = useMemo(() => layout(nodes, scene), [nodes, scene]);
  const { flows } = L;
  const cursor = still ? flows.length * 2 : timeline.cursor;
  const tick = Math.floor(cursor / 2);
  const landed = cursor % 2 === 1;
  const active = tick < flows.length ? flows[tick] : undefined;
  const activeLane = active && laneKey(active[0], active[1]);

  // On a narrow screen the diagram scrolls sideways: keep the packet in flight in view.
  const svg = useRef<SVGSVGElement>(null);
  const [from, to] = active ?? [];
  useLayoutEffect(() => {
    const box = svg.current?.parentElement;
    if (!box || !from || !to || box.scrollWidth <= box.clientWidth + 1) return;
    const node = (id: string) => nodes.find((nd) => nd.id === id);
    const a = node(from);
    const b = node(to);
    if (!a || !b) return;
    const mid = L.toView((at(a).x + at(b).x) / 2) / VW;
    const left = mid * box.scrollWidth - box.clientWidth / 2;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ left, behavior: calm ? 'auto' : 'smooth' });
  }, [from, to, nodes, L]);

  // A lane takes the colour of its latest packet; its chip rests beside it until the lane is reused.
  const laneTone = new Map<string, Tone>();
  flows.forEach(([a, b, tone = 'neutral', , end], i) => {
    if (cursor >= i * 2 + 1 && end !== 'block') laneTone.set(laneKey(a, b), tone);
  });
  const settled = (i: number) => {
    if (cursor < i * 2 + 1) return false;
    const key = laneKey(flows[i][0], flows[i][1]);
    for (let j = i + 1; j < flows.length && j * 2 <= cursor; j++) {
      if (laneKey(flows[j][0], flows[j][1]) === key) return false;
    }
    return true;
  };

  return (
    <svg ref={svg} className="stage-svg" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label}>
      <g className="world" style={{ transform: L.camera }}>
        <g>
          {L.plain.map(([a, b]) => (
            <path key={`${a}-${b}`} className="edge" d={L.curves.get(laneKey(a, b))!.d} />
          ))}
          {[...new Set(flows.map(([a, b]) => laneKey(a, b)))].map((key) => {
            const c = L.curves.get(key)!;
            const tone = laneTone.get(key);
            const bx = c.end.x - c.dir.x * 11;
            const by = c.end.y - c.dir.y * 11;
            const px = -c.dir.y * 6;
            const py = c.dir.x * 6;
            const cls = `lane${tone ? ` is-used tone-${tone}` : ''}${key === activeLane ? ' is-active' : ''}`;
            return (
              <g key={key} className={cls}>
                <path className="lane-line" d={c.d} />
                <polygon className="lane-arrow" points={`${c.end.x},${c.end.y} ${bx + px},${by + py} ${bx - px},${by - py}`} />
              </g>
            );
          })}
        </g>

        <g>
          {nodes.map((node) => {
            const { x, y } = at(node);
            const on = L.visible.has(node.id);
            const revealed = cursor >= L.revealAt.get(node.id)!;
            const raw = scene.state?.[node.id];
            // "Look here" and "not in use" hold from the start; outcomes wait for their cause.
            const state = raw === 'hot' || raw === 'off' || revealed ? raw : undefined;
            const badge = state ? BADGE[state] : undefined;
            const c = L.chips.get(node.id)!;
            const sending = active?.[0] === node.id && !landed;
            const receiving = active?.[1] === node.id && landed && active[4] !== 'block';
            const involved = active?.[0] === node.id || active?.[1] === node.id;
            const cls = [
              'node',
              `kind-${node.kind}`,
              state && `is-${state}`,
              !on && 'is-hidden',
              sending && 'is-sending',
              receiving && `is-receiving tone-${active?.[2] ?? 'neutral'}`,
              active && !involved && 'is-quiet',
            ];
            return (
              <g key={node.id} className={cls.filter(Boolean).join(' ')} aria-hidden={!on}>
                <g transform={`translate(${x} ${y})`}>
                  <g transform={`translate(0 ${GROUND[SHAPE[node.kind]]})`}>
                    <path className="node-base" d="M0 -45L90 0L0 45L-90 0z" />
                    <path className="node-shadow" d="M0 -36L72 0L0 36L-72 0z" />
                    {receiving && <path className="ripple" d="M0 -45L90 0L0 45L-90 0z" />}
                  </g>
                  <g className="node-body">
                    <Block kind={node.kind} />
                    {receiving && <Reaction kind={node.kind} />}
                  </g>
                  {badge && (
                    <g transform={`translate(50 ${extent(node.kind).top + 14})`}>
                      <g className="node-badge">
                        <circle r="12" />
                        <path d={badge} />
                      </g>
                    </g>
                  )}
                </g>
                <Pill x={c.name.x} y={c.name.y} text={node.label} className="pill-name" />
                {c.note && revealed && (
                  <Pill
                    key={c.note.text}
                    x={c.note.x}
                    y={c.note.y}
                    text={c.note.text}
                    className={`pill-note tone-${c.note.tone}`}
                  />
                )}
                {c.meter && (
                  <g className="meter" transform={`translate(${c.meter.x} ${c.meter.y})`}>
                    <rect className="meter-box" x={-c.meter.w / 2} y={-14} width={c.meter.w} height={28} rx={9} />
                    <rect className="meter-track" x={-c.meter.w / 2 + 12} y={-4} width={50} height={8} rx={4} />
                    <rect
                      className={`meter-fill${revealed && c.meter.value >= 85 ? ' is-full' : ''}`}
                      x={-c.meter.w / 2 + 12}
                      y={-4}
                      width={revealed ? Math.max(3, Math.min(100, c.meter.value) / 2) : 3}
                      height={8}
                      rx={4}
                    />
                    <text x={-c.meter.w / 2 + 72} y={0.5} opacity={revealed ? 1 : 0}>
                      {c.meter.text}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        <g>
          {L.plain.map(([, , text], i) => {
            const p = L.linkChips[i];
            return text && p ? <Pill key={`l${i}`} x={p.x} y={p.y} text={text} className="pill-link is-on" /> : null;
          })}
          {flows.map(([, , tone = 'neutral', text], i) => {
            const p = L.flowChips[i];
            const stop = L.stops[i];
            const hit = cursor >= i * 2 + 1;
            return (
              <g key={`f${i}`}>
                {text && p && (
                  <Pill x={p.x} y={p.y} text={text} className={`pill-link tone-${tone}${settled(i) ? ' is-on' : ''}`} />
                )}
                {stop && hit && (
                  <g transform={`translate(${stop.x} ${stop.y})`}>
                    {!still && i === tick &&
                      [0, 60, 120, 180, 240, 300].map((deg) => (
                        <g key={deg} transform={`rotate(${deg})`}>
                          <circle className="burst" r="3.5" />
                        </g>
                      ))}
                    <g className="stop">
                      <circle r="13" />
                      <path d="M-5 -5l10 10M5 -5l-10 10" />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {active && activeLane && !landed && (
          <Packet
            key={tick}
            curve={L.curves.get(activeLane)!}
            index={tick}
            reach={L.stops[tick]?.t ?? 1}
            tone={active[2] ?? 'neutral'}
            payload={active[3]}
            timeline={timeline}
          />
        )}
      </g>
    </svg>
  );
}
