'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Quiz } from '@/components/practice/Quiz';
import { ReplayHint } from '@/components/stage/ReplayHint';
import { Stage } from '@/components/stage/Stage';
import { Inline } from '@/components/ui/Inline';
import type { LabInfo } from '@/content/labs';
import type { Question } from '@/content/quiz';
import type { Lesson, StepKind } from '@/content/types';
import { metricTiles } from '@/lib/metricTiles';
import { markDone, rememberLesson } from '@/lib/progress';
import { readingTime } from '@/lib/readingTime';
import { useReplayOnMove } from '@/lib/useReplayOnMove';
import { useTimeline } from '@/lib/useTimeline';
import { Bars, Tokens } from './Boards';
import { StageControls } from './StageControls';
import { StepRail, type Stop } from './StepRail';
import { StepText, Takeaways } from './StepText';

const Lab = dynamic(() => import('@/components/labs'), { loading: () => <p className="muted lab-loading">Loading the lab…</p> });

interface Props {
  lesson: Lesson;
  area: { id: string; number: string; title: string };
  position: number;
  count: number;
  next?: { href: string; title: string };
  questions: Question[];
  lab?: LabInfo;
}

const KIND_LABEL: Record<StepKind, string> = {
  problem: 'Problem',
  idea: 'Idea',
  technique: 'Technique',
  pitfall: 'Pitfall',
  tradeoff: 'Trade-off',
  recap: 'Recap',
};

export function LessonPlayer({ lesson, area, position, count, next, questions, lab }: Props) {
  const id = `${lesson.area}/${lesson.slug}`;
  const steps = lesson.steps;
  // After the steps come the lab (if the lesson has one) and the quiz.
  const hasLab = Boolean(lab);
  const hasQuiz = questions.length > 0;
  const stops = useMemo<Stop[]>(
    () => [
      ...steps.map((s) => ({ kind: 'step' as const, label: s.short })),
      ...(hasLab ? [{ kind: 'lab' as const, label: 'Lab' }] : []),
      ...(hasQuiz ? [{ kind: 'quiz' as const, label: 'Quiz' }] : []),
    ],
    [steps, hasLab, hasQuiz],
  );
  const last = stops.length - 1;

  const [index, setIndex] = useState(0);
  const [replays, setReplays] = useState(0);
  // The step whose animation has been seen to the end and is now playing again.
  const [seen, setSeen] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [auto, setAuto] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const view = stops[index].kind;
  const step = steps[Math.min(index, steps.length - 1)];
  const isRecap = index === steps.length - 1;

  const go = useCallback(
    (to: number) => {
      const target = Math.max(0, Math.min(last, to));
      setIndex(target);
      setSeen(-1);
      setPlaying(true);
      try {
        const kind = stops[target].kind;
        const url = target === 0 ? window.location.pathname : `#${kind === 'step' ? target + 1 : kind}`;
        window.history.replaceState(window.history.state, '', url);
      } catch {
        /* the link just does not point at the step */
      }
    },
    [stops, last],
  );
  const replay = useCallback(() => {
    setReplays((r) => r + 1);
    setPlaying(true);
  }, []);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => rememberLesson(id), [id]);
  useEffect(() => {
    if (isRecap) markDone(id);
  }, [isRecap, id]);

  // A link such as #4, #lab or #quiz opens that part of the lesson.
  useEffect(() => {
    const open = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const at = /^\d+$/.test(hash) ? Number(hash) - 1 : stops.findIndex((s) => s.kind === hash && hash !== 'step');
      if (at >= 0 && at <= last) setIndex(at);
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, [stops, last]);

  // A step without its own picture keeps the last scene on stage as a still.
  let sceneIndex = Math.min(index, steps.length - 1);
  while (sceneIndex > 0 && !steps[sceneIndex].scene) sceneIndex--;
  const scene = steps[sceneIndex].scene;
  const still = sceneIndex !== index;
  const hasBoard = Boolean(step.tokens || step.bars);
  const showScene = Boolean(lesson.nodes && scene && (step.scene || !hasBoard));
  const flows = view === 'step' && !still ? (scene?.flows ?? []) : [];

  const runKey = `${index}.${replays}`;
  const timeline = useTimeline({ beats: flows.length, runKey, playing, speed });
  const again = useCallback(() => {
    setSeen(index);
    setPlaying(true);
  }, [index]);
  const replayOnMove = useReplayOnMove(timeline, again, !auto);

  // ← → step, Space play or pause, R replay, A auto, F full screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector('dialog[open]')) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowright') go(index + 1);
      else if (key === 'arrowleft') go(index - 1);
      else if (key === 'f') fullscreen();
      else if (view !== 'step') return;
      else if (key === 'r') replay();
      else if (key === 'a') setAuto((a) => !a);
      else if (key === ' ' && !(el && /^(BUTTON|A|SUMMARY)$/.test(el.tagName))) {
        e.preventDefault();
        if (timeline.finished && flows.length) replay();
        else setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, view, replay, fullscreen, timeline.finished, flows.length]);

  // Auto: once the animation is over, leave time to finish reading, then move on.
  const hold = Math.max(1800, readingTime(step) - flows.length * 1500) / speed;
  const holding = auto && playing && view === 'step' && timeline.finished;
  useEffect(() => {
    if (!holding) return;
    const timer = window.setTimeout(() => go(index + 1), hold);
    return () => window.clearTimeout(timer);
  }, [holding, hold, go, index]);

  // The numbers change when the story ends. Seeing it again does not take them back.
  const tiles = metricTiles(lesson, index, timeline.finished || index === 0 || seen === index);

  // Goals tick off as the reader moves through the lesson.
  const goalsDone = Math.floor((Math.min(index + 1, steps.length) / steps.length) * lesson.goals.length + 1e-9);
  const nextStop = stops[index + 1];

  return (
    <div className="lesson" data-area={area.id} ref={root}>
      <section className="sheet">
        <header className="sheet-head">
          <div className="sheet-head-main">
            <p className="crumb">
              <Link href={`/${area.id}`}>{area.title}</Link>
              <span aria-hidden="true"> / </span>
              Lesson {position} of {count}
            </p>
            <h1>{lesson.title}</h1>
            <p className="sheet-sub">{lesson.summary}</p>
          </div>
          <div className="tags">
            <span className="tag">{lesson.minutes} min</span>
            <span className="tag">{lesson.level}</span>
          </div>
        </header>

        <StepRail stops={stops} index={index} onGo={go} />

        {view === 'step' && (
          <div className="stage">
            <dl className="chips">
              {tiles.map((t) => (
                <div key={t.key} className={`chip tone-${t.tone}${t.fresh ? ' is-fresh' : ''}`}>
                  <dt>{t.label}</dt>
                  <dd key={t.value}>
                    {t.fresh && t.before && t.before !== '—' && <s>{t.before}</s>}
                    <span>{t.value ?? '—'}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="stage-body">
              {showScene && scene && lesson.nodes && (
                <div className="stage-scroll" {...replayOnMove}>
                  <Stage nodes={lesson.nodes} scene={scene} timeline={timeline} still={still} label={`Diagram: ${step.title}`} />
                  <ReplayHint show={timeline.finished && flows.length > 0 && !auto} />
                </div>
              )}
              {hasBoard && (
                <div className={`boards${showScene ? '' : ' is-solo'}`} key={runKey}>
                  {step.tokens && <Tokens caption={step.tokens.caption} items={step.tokens.items} />}
                  {step.bars && <Bars caption={step.bars.caption} items={step.bars.items} />}
                </div>
              )}
            </div>

            <StageControls
              flows={flows}
              nodes={lesson.nodes ?? []}
              timeline={timeline}
              playing={playing}
              speed={speed}
              auto={auto}
              onPlay={() => setPlaying((p) => !p)}
              onReplay={replay}
              onSpeed={setSpeed}
              onAuto={() => setAuto((a) => !a)}
              onFullscreen={fullscreen}
            />
            <ul className="legend" aria-label="Colour legend">
              <li className="tone-neutral">request</li>
              <li className="tone-ok">response</li>
              <li className="tone-accent">data or context</li>
              <li className="tone-warn">costly or risky</li>
              <li className="tone-bad">failure or attack</li>
            </ul>
          </div>
        )}

        {view === 'lab' && lab && (
          <div className="stage lab-stage">
            <header className="lab-head">
              <h2>{lab.title}</h2>
              <p className="muted">{lab.blurb}</p>
            </header>
            <Lab id={id} />
          </div>
        )}

        {view === 'quiz' && (
          <div className="stage quiz-stage">
            <Quiz questions={questions} />
          </div>
        )}
      </section>

      <aside className="guide">
        <div className="card guide-card">
          {view === 'step' ? (
            <>
              <div className="guide-top">
                <span className="eyebrow">
                  Step {index + 1} of {steps.length}
                </span>
                <span className={`badge badge-${step.kind}`}>{KIND_LABEL[step.kind]}</span>
              </div>
              {/* The live region stays mounted; only its content changes, so it is announced. */}
              <div aria-live="polite">
                <StepText key={index} step={step} takeaways={isRecap ? lesson.takeaways : undefined} />
              </div>
            </>
          ) : (
            <article className="step" key={view}>
              <h2 className="step-title">{view === 'lab' ? 'Your turn' : 'Check yourself'}</h2>
              <p>
                {view === 'lab'
                  ? 'Predict what a control will do before you move it. Then move it. The difference between the two is what you are learning.'
                  : 'Answer from memory, without going back. Trying to recall is what makes a lesson stay with you.'}
              </p>
              {view === 'lab' && <Takeaways items={lesson.takeaways} />}
            </article>
          )}
          <div className="guide-nav">
            <button type="button" className="btn btn-outline" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous part">
              <ArrowLeft />
            </button>
            {nextStop ? (
              <button type="button" className="btn btn-primary btn-next" onClick={() => go(index + 1)}>
                {holding && <span className="btn-hold" key={runKey} style={{ animationDuration: `${hold}ms` }} />}
                <span>{nextStop.kind === 'quiz' ? 'Check yourself' : nextStop.kind === 'lab' ? 'Try the lab' : `Next: ${nextStop.label}`}</span>
                <ArrowRight />
              </button>
            ) : (
              <Link className="btn btn-primary btn-next" href={next?.href ?? '/'}>
                <span>{next?.title ?? 'Back to the course'}</span>
                <ArrowRight />
              </Link>
            )}
          </div>
          <p className="keys">
            <kbd>←</kbd> <kbd>→</kbd> step <kbd>Space</kbd> play <kbd>A</kbd> auto <kbd>F</kbd> full
          </p>
        </div>

        <div className="card goals">
          <p className="eyebrow">You’ll learn to</p>
          <ul>
            {lesson.goals.map((goal, i) => (
              <li key={goal} className={i < goalsDone ? 'is-done' : ''}>
                <span className="goal-box" aria-hidden="true">
                  {i < goalsDone && <Check />}
                </span>
                <span>
                  <Inline text={goal} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
