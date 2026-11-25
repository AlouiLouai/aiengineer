'use client';

import { Check } from 'lucide-react';
import { useDone } from '@/lib/progress';

/** A tick shown next to a finished lesson. */
export function DoneTick({ id }: { id: string }) {
  const isDone = useDone().has(id);
  return <span className={`tick${isDone ? ' is-done' : ''}`}>{isDone && <Check role="img" aria-label="Finished" />}</span>;
}
