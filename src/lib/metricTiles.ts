import type { Lesson, Tone } from '@/content/types';

export interface Tile {
  key: string;
  label: string;
  value?: string;
  /** The value before this step, when this step changed it. */
  before?: string;
  tone: Tone;
  fresh: boolean;
}

/**
 * The metric tiles at a step. A tile keeps its last value until a later step changes it.
 * `settled` is whether this step's animation has ended, which is when its numbers change.
 */
export function metricTiles(lesson: Pick<Lesson, 'metrics' | 'steps'>, index: number, settled: boolean): Tile[] {
  const upTo = Math.min(settled ? index : index - 1, lesson.steps.length - 1);
  return (lesson.metrics ?? []).map(([key, label]) => {
    const tile: Tile = { key, label, tone: 'neutral', fresh: false };
    for (let i = 0; i <= upTo; i++) {
      const metric = lesson.steps[i].metrics?.[key];
      tile.fresh = false;
      if (metric === undefined) continue;
      tile.before = tile.value;
      [tile.value, tile.tone] = Array.isArray(metric) ? metric : [metric, 'neutral'];
      tile.fresh = i === index && tile.before !== tile.value;
    }
    return tile;
  });
}
