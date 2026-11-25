'use client';

import { BookOpen, Clock, FlaskConical, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useDone, useDueCount } from '@/lib/progress';

/** The four numbers at the top of the dashboard. */
export function StatRow({ ids, hours, labs }: { ids: string[]; hours: number; labs: number }) {
  const done = useDone();
  const due = useDueCount((id) => ids.includes(id));
  const stats = [
    { label: 'Lessons finished', value: `${ids.filter((id) => done.has(id)).length} / ${ids.length}`, icon: BookOpen },
    { label: 'Due for review', value: due, icon: RotateCcw, href: '/review' },
    { label: 'Interactive labs', value: labs, icon: FlaskConical, href: '/#labs' },
    { label: 'Course length', value: `${hours} h`, icon: Clock },
  ];
  return (
    <div className="stats">
      {stats.map(({ label, value, icon: Icon, href }) => {
        const body = (
          <>
            <span className="stat-head">
              <span className="eyebrow">{label}</span>
              <Icon />
            </span>
            <span className="stat-value">{value}</span>
          </>
        );
        return href ? (
          <Link key={label} className="card stat" href={href}>
            {body}
          </Link>
        ) : (
          <div key={label} className="card stat">
            {body}
          </div>
        );
      })}
    </div>
  );
}
