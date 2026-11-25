import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gradeCard, markDone, useCards, useDone, useDueCount } from '@/lib/progress';

const DAY = 86_400_000;
const START = Date.UTC(2026, 0, 1);
const card = (id: string) => renderHook(() => useCards()).result.current[id];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ now: START });
});
afterEach(() => vi.useRealTimers());

describe('spaced review', () => {
  it('moves a right answer through growing intervals', () => {
    let now = START;
    for (const days of [1, 3, 7, 16, 35, 35]) {
      vi.setSystemTime(now);
      gradeCard('a#0', true);
      expect(card('a#0').due - now).toBe(days * DAY);
      now = card('a#0').due;
    }
  });

  it('does not reward answering again before the question is due', () => {
    gradeCard('a#0', true);
    const first = card('a#0');
    gradeCard('a#0', true);
    expect(card('a#0')).toEqual(first);
  });

  it('brings a missed question back at once', () => {
    gradeCard('a#0', true);
    gradeCard('a#0', false);
    expect(card('a#0')).toEqual({ box: 0, due: START });
  });

  it('counts only questions of lessons that exist', () => {
    gradeCard('a#0', false);
    gradeCard('gone#0', false);
    expect(renderHook(() => useDueCount((id) => id === 'a')).result.current).toBe(1);
  });
});

describe('finished lessons', () => {
  it('remembers each lesson once', () => {
    markDone('llm/tokenization');
    markDone('llm/tokenization');
    expect([...renderHook(() => useDone()).result.current]).toEqual(['llm/tokenization']);
  });

  it.each(['not json', '{"a":1}', 'null', '[1,2]'])('survives broken storage: %s', (raw) => {
    localStorage.setItem('aie:done', raw);
    localStorage.setItem('aie:cards', raw);
    expect(renderHook(() => useDone()).result.current.size).toBe(0);
    expect(Object.keys(renderHook(() => useCards()).result.current)).toHaveLength(0);
  });
});
