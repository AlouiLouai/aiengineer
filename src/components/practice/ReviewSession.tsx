'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Question } from '@/content/quiz';
import { useCards, useDueCount } from '@/lib/progress';
import { Quiz } from './Quiz';

export function ReviewSession({ questions }: { questions: Question[] }) {
  const cards = useCards();
  const due = useDueCount((id) => questions.some((q) => q.id.startsWith(`${id}#`)));
  // The session is fixed when it starts, so answering does not change the list underfoot.
  const [session, setSession] = useState<Question[] | null>(null);
  const known = questions.filter((q) => cards[q.id]);
  const met = known.length;
  const strong = known.filter((q) => cards[q.id].box >= 3).length;

  const start = () => {
    const now = Date.now();
    setSession(
      questions
        .filter((q) => cards[q.id] && cards[q.id].due <= now)
        .sort((a, b) => cards[a.id].due - cards[b.id].due)
        .slice(0, 12),
    );
  };

  if (session) {
    return (
      <div className="card quiz-stage">
        <Quiz questions={session} />
        <div className="review-more">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSession(null)}>
            End the session
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stats">
        {[
          ['Due now', due],
          ['Questions met', `${met} / ${questions.length}`],
          ['Well known', strong],
        ].map(([label, value]) => (
          <div key={label} className="card stat">
            <p className="eyebrow">{label}</p>
            <p className="stat-value">{value}</p>
          </div>
        ))}
      </div>
      <div className="card callout-card">
        {due > 0 ? (
          <>
            <p>{due === 1 ? 'One question is' : `${due} questions are`} ready. Sessions are at most 12 questions.</p>
            <button type="button" className="btn btn-primary" onClick={start}>
              Start review
            </button>
          </>
        ) : (
          <>
            <p>
              {met === 0
                ? 'Nothing to review yet. Answer the quiz at the end of a lesson, and its questions will appear here.'
                : 'Nothing is due. Come back later, or learn something new.'}
            </p>
            <Link className="btn btn-primary" href="/">
              Open the course
            </Link>
          </>
        )}
      </div>
    </>
  );
}
