'use client';

import { Maximize, Pause, Play, RotateCcw } from 'lucide-react';
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { FlowSpec, SceneNode } from '@/content/types';
import type { Timeline } from '@/lib/useTimeline';

const SPEEDS = [0.5, 1, 1.5, 2];

interface Props {
  flows: FlowSpec[];
  nodes: SceneNode[];
  timeline: Timeline;
  playing: boolean;
  speed: number;
  auto: boolean;
  onPlay: () => void;
  onReplay: () => void;
  onSpeed: (speed: number) => void;
  onAuto: () => void;
  onFullscreen: () => void;
}

/** The player bar: a subtitle saying what is moving now, and one seekable segment per packet. */
// iPhone Safari has no element full screen. Known only in the browser, so the server renders without it.
const noop = () => () => {};
const useCanFullscreen = () =>
  useSyncExternalStore(noop, () => Boolean(document.fullscreenEnabled), () => false);

export function StageControls({ flows, nodes, timeline, playing, speed, auto, onPlay, onReplay, onSpeed, onAuto, onFullscreen }: Props) {
  const canFullscreen = useCanFullscreen();
  const name = (id: string) => nodes.find((node) => node.id === id)?.label ?? id;
  const tick = Math.min(Math.floor(timeline.cursor / 2), Math.max(0, flows.length - 1));
  const flow = flows[tick];
  const blocked = flow?.[4] === 'block';
  const done = timeline.finished;

  return (
    <div className="player">
      {flow && (
        <p className={`subtitle tone-${flow[2] ?? 'neutral'}`}>
          <span className="subtitle-count">
            {tick + 1}/{flows.length}
          </span>
          <span className="subtitle-text" key={tick}>
            <b>{name(flow[0])}</b> <span aria-hidden="true">→</span> <b>{name(flow[1])}</b>
            {flow[3] && <span className="subtitle-payload">{flow[3]}</span>}
            {blocked && <span className="subtitle-blocked">blocked</span>}
          </span>
        </p>
      )}
      <div className="player-row">
        <button
          type="button"
          className="icon-btn is-primary"
          onClick={done ? onReplay : onPlay}
          aria-label={done ? 'Replay animation' : playing ? 'Pause animation' : 'Play animation'}
        >
          {done ? <RotateCcw /> : playing ? <Pause /> : <Play />}
        </button>
        <div className="scrub">
          {flows.map((f, i) => (
            <Segment
              key={i}
              index={i}
              tone={f[2] ?? 'neutral'}
              timeline={timeline}
              label={`${name(f[0])} to ${name(f[1])}${f[3] ? `: ${f[3]}` : ''}`}
            />
          ))}
          {flows.length === 0 && <span className="scrub-none">No packets in this step</span>}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm speed"
          aria-label={`Animation speed ${speed} times. Change speed`}
          onClick={() => onSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        >
          {speed}×
        </button>
        <button
          type="button"
          className={`btn btn-sm ${auto ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={auto}
          onClick={onAuto}
          title="Play the whole lesson hands-free (A)"
        >
          Auto
        </button>
        {canFullscreen && (
          <button type="button" className="icon-btn" onClick={onFullscreen} aria-label="Full screen" title="Full screen (F)">
            <Maximize />
          </button>
        )}
      </div>
    </div>
  );
}

function Segment({ index, tone, timeline, label }: { index: number; tone: string; timeline: Timeline; label: string }) {
  const fill = useRef<HTMLSpanElement>(null);
  const { subscribe } = timeline;
  useLayoutEffect(
    () =>
      subscribe((t) => {
        if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, Math.max(0, t - index))})`;
      }),
    [subscribe, index],
  );
  return (
    <button
      type="button"
      className={`scrub-seg tone-${tone}`}
      aria-label={`Go to ${label}`}
      title={label}
      onClick={() => timeline.seek(index)}
    >
      <span>
        <span ref={fill} />
      </span>
    </button>
  );
}
