import type { Metadata } from 'next';
import { ReviewSession } from '@/components/practice/ReviewSession';
import { lessonId, lessons } from '@/content';
import { questionsFor } from '@/content/quiz';

export const metadata: Metadata = {
  title: 'Review',
  description: 'Spaced review of the questions you have already met.',
};

export default function ReviewPage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>
          Spaced <span className="c-primary">Review</span>
        </h1>
        <p className="page-sub">
          Questions come back after 1, 3, 7, 16 and 35 days. Miss one and it starts again. A few minutes here keeps a
          whole lesson.
        </p>
      </header>
      <ReviewSession questions={lessons.flatMap((l) => questionsFor(lessonId(l)))} />
    </div>
  );
}
