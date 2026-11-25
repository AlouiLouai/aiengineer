import { areas } from './areas';
import { agentLessons } from './lessons/agents';
import { deploymentLessons } from './lessons/deployment';
import { evalLessons } from './lessons/evals';
import { llmLessons } from './lessons/llm';
import { ragLessons } from './lessons/rag';
import { securityLessons } from './lessons/security';
import { systemDesignLessons } from './lessons/system-design';
import type { Area, AreaId, Lesson, Level } from './types';

export { areas };

const written: Lesson[] = [
  ...llmLessons,
  ...ragLessons,
  ...agentLessons,
  ...evalLessons,
  ...systemDesignLessons,
  ...securityLessons,
  ...deploymentLessons,
];

export const lessonId = (l: { area: string; slug: string }) => `${l.area}/${l.slug}`;
export const lessonHref = (l: { area: string; slug: string }) => `/${l.area}/${l.slug}`;

const byId = new Map(written.map((l) => [lessonId(l), l]));

/** Every finished lesson, in roadmap order. */
export const lessons: Lesson[] = areas.flatMap((area) =>
  area.concepts.flatMap((c) => {
    if (!c.slug) return [];
    const lesson = byId.get(`${area.id}/${c.slug}`);
    if (!lesson) throw new Error(`areas.ts links to a missing lesson: ${area.id}/${c.slug}`);
    return [lesson];
  }),
);

export function getArea(id: string): Area | undefined {
  return areas.find((a) => a.id === id);
}

export function getLesson(area: string, slug: string): Lesson | undefined {
  return byId.get(`${area}/${slug}`);
}

export function lessonsIn(area: AreaId): Lesson[] {
  return lessons.filter((l) => l.area === area);
}

export function neighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const i = lessons.indexOf(lesson);
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}

/** The light-weight tree the sidebar and search need (no lesson bodies). */
interface NavLesson {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
}
export interface NavArea {
  id: AreaId;
  number: string;
  title: string;
  tagline: string;
  blurb: string;
  lessons: NavLesson[];
  soon: string[];
}

export const nav: NavArea[] = areas.map((a) => ({
  id: a.id,
  number: a.number,
  title: a.title,
  tagline: a.tagline,
  blurb: a.blurb,
  lessons: lessonsIn(a.id).map(({ slug, title, summary, minutes, level }) => ({ slug, title, summary, minutes, level })),
  soon: a.concepts.filter((c) => !c.slug).map((c) => c.title),
}));

export const totalMinutes = lessons.reduce((sum, l) => sum + l.minutes, 0);
