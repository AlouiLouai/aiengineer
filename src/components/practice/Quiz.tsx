'use client';

import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Question } from '@/content/quiz';
import { gradeCard } from '@/lib/progress';
import { Inline } from '@/components/ui/Inline';

/** Questions one at a time: answer, see why, go on. Every answer feeds the review schedule. */
export function Quiz({ questions }: { questions: Question[] }) {
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = questions[at];
  const heading = useRef<HTMLHeadingElement>(null);

  // The button that was pressed is gone, so move focus to the new question.
  useEffect(() => {
    if (at > 0) heading.current?.focus();
  }, [at]);

  if (!q) {
    const all = score === questions.length;
    return (
      <div className="quiz quiz-end" role="status">
        <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" />
          <circle className="ring-fill" cx="60" cy="60" r="50" pathLength={100} strokeDasharray={`${(score / questions.length) * 100} 100`} />
        </svg>
        <p className="quiz-score">
          {score} / {questions.length}
        </p>
        <p className="muted">
          {all
            ? 'All correct. These questions come back in Review, at growing intervals.'
            : 'The ones you missed are waiting in Review. Seeing them again is what makes them stick.'}
        </p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setAt(0);
            setScore(0);
            setPicked(null);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const right = i === q.answer;
    if (right) setScore((s) => s + 1);
    gradeCard(q.id, right);
  };

  return (
    <div className="quiz" key={q.id}>
      <p className="eyebrow">
        Question {at + 1} of {questions.length}
      </p>
      <h2 className="quiz-q" ref={heading} tabIndex={-1}>
        <Inline text={q.question} />
      </h2>
      <div className="quiz-options">
        {q.options.map((option, i) => {
          const shown = picked !== null;
          const cls = !shown ? '' : i === q.answer ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
          return (
            <button
              key={i}
              type="button"
              className={`quiz-option${cls}`}
              style={{ animationDelay: `${i * 70}ms` }}
              aria-disabled={shown}
              onClick={() => answer(i)}
            >
              <span className="quiz-letter" aria-hidden="true">
                {shown && i === q.answer ? <Check /> : shown && i === picked ? <X /> : 'ABC'[i]}
              </span>
              <span>
                <Inline text={option} />
              </span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <div className={`quiz-why ${picked === q.answer ? 'is-right' : 'is-wrong'}`}>
            <strong>{picked === q.answer ? 'Correct.' : 'Not quite.'}</strong> <Inline text={q.why} />
          </div>
        )}
      </div>
      {picked !== null && (
        <button
          type="button"
          className="btn btn-primary"
          autoFocus
          onClick={() => {
            setAt(at + 1);
            setPicked(null);
          }}
        >
          {at + 1 === questions.length ? 'See the result' : 'Next question'}
        </button>
      )}
    </div>
  );
}
