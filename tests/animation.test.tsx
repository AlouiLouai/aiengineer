import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { layout } from '@/components/stage/layout';
import { n } from '@/content/types';
import { metricTiles } from '@/lib/metricTiles';
import { useReplayOnMove } from '@/lib/useReplayOnMove';
import { useTimeline } from '@/lib/useTimeline';

let reduced = false;
beforeEach(() => {
  reduced = false;
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date', 'setTimeout', 'clearTimeout'] });
  window.matchMedia = ((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const run = (ms: number) => act(() => vi.advanceTimersByTime(ms));

function Player({ onReplay, enabled = true }: { onReplay?: () => void; enabled?: boolean }) {
  const timeline = useTimeline({ beats: 2, runKey: 'x', playing: true });
  const replay = useReplayOnMove(timeline, onReplay, enabled);
  return (
    <div data-testid="stage" {...replay}>
      {timeline.finished ? 'finished' : `cursor ${timeline.cursor}`}
    </div>
  );
}

describe('timeline', () => {
  it('departs, arrives, and then holds the finished picture', () => {
    const { getByTestId } = render(<Player />);
    expect(getByTestId('stage').textContent).toBe('cursor 0');
    run(1200);
    expect(getByTestId('stage').textContent).toBe('cursor 1');
    run(2500);
    expect(getByTestId('stage').textContent).toBe('finished');
    run(10_000);
    expect(getByTestId('stage').textContent).toBe('finished');
  });

  it('shows the finished picture at once when reduced motion is asked for', () => {
    reduced = true;
    const { result } = renderHook(() => useTimeline({ beats: 3, runKey: 'x', playing: true }));
    expect(result.current.finished).toBe(true);
  });

  it('seeks while paused', () => {
    const { result } = renderHook(() => useTimeline({ beats: 3, runKey: 'x', playing: false }));
    act(() => result.current.seek(2));
    expect(result.current.cursor).toBe(4);
  });
});

describe('replay on mouse movement', () => {
  const move = (el: HTMLElement) => fireEvent.pointerMove(el, { pointerType: 'mouse' });

  it('plays again after the picture has rested', () => {
    const onReplay = vi.fn();
    const { getByTestId } = render(<Player onReplay={onReplay} />);
    run(5000);
    run(1000);
    move(getByTestId('stage'));
    expect(onReplay).toHaveBeenCalledOnce();
    expect(getByTestId('stage').textContent).toBe('cursor 0');
    run(5000);
    run(1000);
    expect(getByTestId('stage').textContent).toBe('finished');
  });

  it('does not restart while playing, or the moment it ends', () => {
    const onReplay = vi.fn();
    const { getByTestId } = render(<Player onReplay={onReplay} />);
    run(1000);
    move(getByTestId('stage'));
    run(2200);
    move(getByTestId('stage'));
    expect(onReplay).not.toHaveBeenCalled();
  });

  it('can be switched off', () => {
    const onReplay = vi.fn();
    const { getByTestId } = render(<Player onReplay={onReplay} enabled={false} />);
    run(5000);
    move(getByTestId('stage'));
    expect(onReplay).not.toHaveBeenCalled();
  });
});

describe('cause before effect', () => {
  const nodes = [n('a', 'A', 'app', 0, 0), n('b', 'B', 'db', 2, 0), n('c', 'C', 'doc', 4, 0)];

  it('reveals a block when the last packet that feeds it lands', () => {
    const { revealAt } = layout(nodes, { flows: [['a', 'b', 'neutral', 'x'], ['b', 'c', 'ok', 'y']] });
    expect(revealAt.get('a')).toBe(0);
    expect(revealAt.get('b')).toBe(1);
    expect(revealAt.get('c')).toBe(3);
  });

  it('stops a blocked packet before its target', () => {
    const { stops } = layout(nodes, { flows: [['a', 'b', 'bad', 'x', 'block']] });
    expect(stops[0]!.t).toBeLessThan(1);
  });

  it('changes metrics only when the step has settled', () => {
    const step = { short: 's', kind: 'idea' as const, title: 't', body: [] };
    const lesson = {
      metrics: [['m', 'M']] as Array<[string, string]>,
      steps: [
        { ...step, metrics: { m: '1' } },
        { ...step, metrics: { m: ['2', 'ok'] as [string, 'ok'] } },
      ],
    };
    expect(metricTiles(lesson, 1, false)[0]).toMatchObject({ value: '1', fresh: false });
    expect(metricTiles(lesson, 1, true)[0]).toMatchObject({ value: '2', before: '1', tone: 'ok', fresh: true });
  });
});
