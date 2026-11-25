import type { Step } from '@/content/types';

/** Comfortable reading speed, used by Auto to decide how long to stay on a step. */
const WORDS_PER_MINUTE = 210;

/** Milliseconds needed to read a step's text. */
export function readingTime(step: Step): number {
  const text = [step.title, ...step.body, step.callout?.[1], step.pro, ...(step.changes ?? [])].join(' ');
  return (text.split(/\s+/).length / WORDS_PER_MINUTE) * 60_000;
}
