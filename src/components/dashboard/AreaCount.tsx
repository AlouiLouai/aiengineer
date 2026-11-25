'use client';

import { useDone } from '@/lib/progress';

/** "3 of 7" for one area, with a bar. */
export function AreaCount({ areaId, slugs }: { areaId: string; slugs: string[] }) {
  const done = useDone();
  const finished = slugs.filter((s) => done.has(`${areaId}/${s}`)).length;
  return (
    <span className="area-count">
      <span className="bar-mini">
        <span style={{ width: `${slugs.length ? (finished / slugs.length) * 100 : 0}%` }} />
      </span>
      {finished} of {slugs.length}
    </span>
  );
}
