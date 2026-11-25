'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

/** Milliseconds one packet takes at 1× speed: travel, then a short dwell on arrival. */
const BEAT = 1500;
/** The share of a beat spent travelling. The rest is the target reacting. */
export const ARRIVE = 0.64;

function subscribeMotion(fn: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
}
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export interface Timeline {
  /** 2·i while packet i travels, 2·i + 1 once it has arrived, 2·beats at the end. */
  cursor: number;
  beats: number;
  finished: boolean;
  /** Jump to a beat (fractions allowed). */
  seek: (beat: number) => void;
  /** Called with the current time, in beats, on every animation frame. Returns an unsubscribe. */
  subscribe: (fn: (t: number) => void) => () => void;
}

const cursorAt = (t: number, beats: number) => {
  if (t >= beats) return beats * 2;
  const i = Math.floor(t);
  return i * 2 + (t - i >= ARRIVE ? 1 : 0);
};

interface Options {
  beats: number;
  /** Changes whenever the clock should start again from zero. */
  runKey: string | number;
  playing: boolean;
  speed?: number;
  /** Frames per second to draw. Default: every frame the screen shows. */
  fps?: number;
}

/**
 * The clock behind a scene. Frames go straight to subscribers (no React render), and React
 * only re-renders when a packet departs or arrives.
 */
export function useTimeline({ beats, runKey, playing, speed = 1, fps }: Options): Timeline {
  const reduced = useReducedMotion();
  const time = useRef(0);
  const lastKey = useRef(runKey);
  const subs = useRef(new Set<(t: number) => void>());
  const [clock, setClock] = useState({ key: runKey, cursor: 0 });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (lastKey.current !== runKey) {
      lastKey.current = runKey;
      time.current = 0;
    }
    if (reduced) time.current = beats;
    let shown = -1;
    const emit = () => {
      const cursor = cursorAt(time.current, beats);
      if (cursor !== shown) {
        shown = cursor;
        setClock({ key: runKey, cursor });
      }
      subs.current.forEach((fn) => fn(Math.min(time.current, beats)));
    };
    emit();
    if (!playing || reduced || beats === 0) return;

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      if (last && fps && now - last < 1000 / fps - 4) {
        raf = requestAnimationFrame(frame);
        return;
      }
      // Clamp the step so a background tab does not skip the whole story on return.
      if (last) time.current += (Math.min(now - last, 64) / BEAT) * speed;
      last = now;
      if (time.current >= beats) {
        time.current = beats;
        emit();
        return;
      }
      emit();
      raf = requestAnimationFrame(frame);
    };
    if (time.current < beats) raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [beats, runKey, playing, speed, fps, reduced, nonce]);

  const seek = useCallback((beat: number) => {
    time.current = Math.max(0, beat);
    setNonce((x) => x + 1);
  }, []);
  const subscribe = useCallback((fn: (t: number) => void) => {
    subs.current.add(fn);
    fn(time.current);
    return () => {
      subs.current.delete(fn);
    };
  }, []);

  const cursor = reduced ? beats * 2 : clock.key === runKey ? Math.min(clock.cursor, beats * 2) : 0;
  return useMemo(
    () => ({ cursor, beats, finished: cursor >= beats * 2, seek, subscribe }),
    [cursor, beats, seek, subscribe],
  );
}
