'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DoneTick } from '@/components/ui/DoneTick';
import type { NavArea } from '@/content';
import { useDone, useLastLesson } from '@/lib/progress';

/** Resumes where the reader left off, or starts lesson one. */
export function ContinueCard({ nav }: { nav: NavArea[] }) {
  const last = useLastLesson();
  const done = useDone();
  const flat = nav.flatMap((a) => a.lessons.map((l) => ({ ...l, id: `${a.id}/${l.slug}`, areaId: a.id, area: a.title })));
  const resume = flat.find((l) => l.id === last);
  // If the last lesson is finished, offer the first unfinished one after it.
  const target =
    resume && done.has(resume.id)
      ? (flat.slice(flat.indexOf(resume) + 1).find((l) => !done.has(l.id)) ?? flat.find((l) => !done.has(l.id)) ?? resume)
      : (resume ?? flat[0]);
  const at = flat.indexOf(target);

  return (
    <div className="card continue-card" data-area={target.areaId}>
      <p className="eyebrow">{resume ? 'Continue' : 'Start here'}</p>
      <h2>{target.title}</h2>
      <p className="muted">{target.summary}</p>
      <p className="continue-meta">
        {target.area}, {target.minutes} min, {target.level}
      </p>
      <Link className="btn btn-primary btn-lg" href={`/${target.id}`}>
        {resume ? 'Continue' : 'Start the course'} <ArrowRight />
      </Link>
      <div className="continue-next">
        <p className="eyebrow">Up next</p>
        <ul>
          {flat.slice(at + 1, at + 4).map((l) => (
            <li key={l.id}>
              <Link href={`/${l.id}`}>
                <DoneTick id={l.id} />
                <span>{l.title}</span>
                <span className="muted">{l.minutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
