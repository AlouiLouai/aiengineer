import { describe, expect, it } from 'vitest';
import { layout, pillWidth } from '@/components/stage/layout';
import { LAB_IDS } from '@/components/labs';
import { areas, lessonId, lessons } from '@/content';
import { LABS } from '@/content/labs';
import { questionsFor, quizLessonIds } from '@/content/quiz';

describe('course map', () => {
  it('has 7 areas of 20 concepts and a lesson behind every link', () => {
    expect(areas).toHaveLength(7);
    for (const area of areas) expect(area.concepts, area.id).toHaveLength(20);
    expect(new Set(lessons.map(lessonId)).size).toBe(lessons.length);
  });

  it('has exactly one lab per area, each with a component', () => {
    const ids = new Set(lessons.map(lessonId));
    for (const id of Object.keys(LABS)) expect(ids).toContain(id);
    expect(Object.keys(LABS).map((id) => id.split('/')[0])).toEqual(areas.map((a) => a.id));
    expect([...LAB_IDS].sort()).toEqual(Object.keys(LABS).sort());
  });
});

describe.each(lessons.map((l) => [lessonId(l), l] as const))('%s', (id, lesson) => {
  const nodes = lesson.nodes ?? [];
  const known = new Set(nodes.map((node) => node.id));
  const metrics = new Set((lesson.metrics ?? []).map(([key]) => key));

  it('tells a story from problem to recap', () => {
    expect(lesson.steps.length).toBeGreaterThanOrEqual(6);
    expect(lesson.steps.length).toBeLessThanOrEqual(10);
    expect(lesson.steps[0].kind).toBe('problem');
    expect(lesson.steps.at(-1)!.kind).toBe('recap');
  });

  it('only refers to blocks and metrics that exist', () => {
    for (const step of lesson.steps) {
      expect(step.scene || step.tokens || step.bars, step.title).toBeTruthy();
      for (const key of Object.keys(step.metrics ?? {})) expect(metrics).toContain(key);
      const s = step.scene;
      if (!s) continue;
      const used = [
        ...(s.show ?? []),
        ...(s.links ?? []).flatMap(([a, b]) => [a, b]),
        ...(s.flows ?? []).flatMap(([a, b]) => [a, b]),
        ...Object.keys(s.state ?? {}),
        ...Object.keys(s.note ?? {}),
        ...Object.keys(s.meter ?? {}),
      ];
      for (const block of used) expect(known, step.title).toContain(block);
      for (const [from, to] of s.flows ?? []) expect(from).not.toBe(to);
    }
  });

  it('keeps labels short and blocks apart', () => {
    for (const node of nodes) expect(node.label.length, node.label).toBeLessThanOrEqual(16);
    for (const a of nodes)
      for (const b of nodes)
        if (a.id < b.id) {
          const overlap = Math.abs(a.col - b.col) * 200 < 150 && Math.abs(a.row - b.row) * 236 < 200;
          expect(overlap, `${a.id} and ${b.id}`).toBe(false);
        }
    for (const step of lesson.steps) {
      expect(step.short.length, step.short).toBeLessThanOrEqual(14);
      for (const [, , , payload] of step.scene?.flows ?? []) expect((payload ?? '').length).toBeLessThanOrEqual(30);
    }
  });

  it('places chips so that resting labels of different lanes do not overlap', () => {
    for (const step of lesson.steps) {
      if (!step.scene) continue;
      const L = layout(nodes, step.scene);
      // The last packet on each lane is the one whose chip stays.
      const resting = new Map<string, { x: number; y: number; w: number }>();
      L.flows.forEach(([a, b, , text], i) => {
        const chip = L.flowChips[i];
        if (text && chip) resting.set(`${a}>${b}`, { ...chip, w: pillWidth(text) });
      });
      const all = [...resting.values()];
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) {
          const hit = Math.abs(all[i].x - all[j].x) < (all[i].w + all[j].w) / 2 - 4 && Math.abs(all[i].y - all[j].y) < 24;
          expect(hit, `${step.title}: chips ${i} and ${j}`).toBe(false);
        }
    }
  });

  it('has two quiz questions with three different options', () => {
    const questions = questionsFor(id);
    expect(questions).toHaveLength(2);
    for (const q of questions) {
      expect(new Set(q.options).size).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.why.length).toBeGreaterThan(30);
    }
  });
});

describe('quiz bank', () => {
  const all = quizLessonIds.flatMap(questionsFor);

  it('does not give the answer away by length', () => {
    const longest = all.filter((q) => q.options.every((o, i) => i === q.answer || o.length < q.options[q.answer].length));
    expect(longest.length / all.length).toBeLessThan(0.45);
  });

  it('spreads the right answer over all positions', () => {
    for (const position of [0, 1, 2]) {
      const share = all.filter((q) => q.answer === position).length / all.length;
      expect(share).toBeGreaterThan(0.2);
      expect(share).toBeLessThan(0.5);
    }
  });
});
