'use client';

import { useRef } from 'react';
import { ReplayHint } from '@/components/stage/ReplayHint';
import { Stage } from '@/components/stage/Stage';
import { n, type Scene } from '@/content/types';
import { useInView } from '@/lib/useInView';
import { useReplayOnMove } from '@/lib/useReplayOnMove';
import { useTimeline } from '@/lib/useTimeline';

const demoNodes = [
  n('user', 'User', 'user', 0, 1),
  n('guard', 'Guardrails', 'guard', 1.9, 1),
  n('kb', 'Vector index', 'db', 3.9, 0),
  n('model', 'Model', 'model', 3.9, 1.1),
  n('tool', 'Tools', 'tool', 1.9, 2.1),
];
const demoScene: Scene = {
  flows: [
    ['user', 'guard', 'neutral', 'question'],
    ['guard', 'kb', 'accent', 'search'],
    ['kb', 'model', 'accent', 'top chunks'],
    ['model', 'tool', 'neutral', 'tool call'],
    ['tool', 'model', 'ok', 'result'],
    ['model', 'guard', 'ok', 'draft'],
    ['guard', 'user', 'ok', 'answer'],
  ],
  state: { guard: 'ok', user: 'ok' },
};

/** The diagram on the dashboard: plays once, and again when the reader moves over it. */
export function HeroDemo() {
  const box = useRef<HTMLDivElement>(null);
  const playing = useInView(box);
  const timeline = useTimeline({ beats: demoScene.flows!.length, runKey: 'demo', playing, fps: 30 });
  const replay = useReplayOnMove(timeline);
  return (
    <div className="stage hero-demo" ref={box} {...replay}>
      <Stage nodes={demoNodes} scene={demoScene} timeline={timeline} label="A request travelling through an AI application" />
      <ReplayHint show={timeline.finished} />
    </div>
  );
}
