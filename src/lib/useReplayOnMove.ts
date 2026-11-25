'use client';

import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import type { Timeline } from './useTimeline';

/** How long a finished picture rests before a movement may restart it. */
const REST = 900;

/**
 * Plays a finished animation again when the mouse moves over it, or when it is tapped.
 * Spread the result on the element that holds the stage.
 */
export function useReplayOnMove({ finished, beats, seek }: Timeline, onReplay?: () => void, enabled = true) {
  const restedAt = useRef(Infinity);
  useEffect(() => {
    restedAt.current = finished ? performance.now() + REST : Infinity;
  }, [finished]);

  const again = useCallback(() => {
    if (!enabled || beats === 0 || performance.now() < restedAt.current) return;
    restedAt.current = Infinity;
    onReplay?.();
    seek(0);
  }, [enabled, beats, onReplay, seek]);

  return {
    onPointerMove: (e: PointerEvent) => {
      if (e.pointerType !== 'touch') again();
    },
    onClick: again,
  };
}
