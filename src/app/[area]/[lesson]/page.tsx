import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { LABS } from '@/content/labs';
import { questionsFor } from '@/content/quiz';
import { getArea, getLesson, lessonHref, lessonId, lessons, lessonsIn, neighbours } from '@/content';

type Params = Promise<{ area: string; lesson: string }>;

export function generateStaticParams() {
  return lessons.map((l) => ({ area: l.area, lesson: l.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { area, lesson: slug } = await params;
  const lesson = getLesson(area, slug);
  if (!lesson) return {};
  return { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({ params }: { params: Params }) {
  const { area: areaId, lesson: slug } = await params;
  const area = getArea(areaId);
  const lesson = getLesson(areaId, slug);
  if (!area || !lesson) notFound();

  const { next } = neighbours(lesson);
  const inArea = lessonsIn(area.id);

  return (
    <LessonPlayer
      key={lessonId(lesson)}
      lesson={lesson}
      area={{ id: area.id, number: area.number, title: area.title }}
      position={inArea.indexOf(lesson) + 1}
      count={inArea.length}
      next={next ? { href: lessonHref(next), title: next.title } : undefined}
      questions={questionsFor(lessonId(lesson))}
      lab={LABS[lessonId(lesson)]}
    />
  );
}
