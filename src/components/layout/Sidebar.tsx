'use client';

import { ChevronRight, FlaskConical, LayoutDashboard, Orbit, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { NavArea } from '@/content';
import { AREA_ICON } from '@/lib/areaIcons';
import { useDone, useDueCount } from '@/lib/progress';

interface SidebarProps {
  nav: NavArea[];
  pathname: string;
  collapsed: boolean;
  onExpand: () => void;
}

export function Sidebar({ nav, pathname, collapsed, onExpand }: SidebarProps) {
  const done = useDone();
  const due = useDueCount((id) => nav.some((a) => a.lessons.some((l) => id === `${a.id}/${l.slug}`)));
  const currentArea = pathname.split('/')[1] ?? '';
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const total = nav.reduce((sum, a) => sum + a.lessons.length, 0);
  const finished = nav.reduce((sum, a) => sum + a.lessons.filter((l) => done.has(`${a.id}/${l.slug}`)).length, 0);

  return (
    <>
      <Link href="/" className="brand" title="AI Engineer">
        <Orbit className="brand-mark" aria-hidden="true" />
        <span className="brand-name">ai engineer</span>
        <span className="brand-badge">COURSE</span>
      </Link>

      <div className="side-scroll">
        <ul className="side-group">
          <li>
            <Link href="/" className={`side-item${pathname === '/' ? ' is-active' : ''}`} title="Dashboard">
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </li>
        </ul>

        <p className="side-label">Course</p>
        <ul className="side-group">
          {nav.map((area) => {
            const Icon = AREA_ICON[area.id];
            const active = currentArea === area.id;
            const open = !collapsed && (toggled[area.id] ?? active);
            const count = area.lessons.filter((l) => done.has(`${area.id}/${l.slug}`)).length;
            return (
              <li key={area.id} data-area={area.id}>
                <button
                  type="button"
                  className={`side-item${active ? ' is-active' : ''}`}
                  aria-expanded={open}
                  title={area.title}
                  onClick={() => {
                    if (collapsed) onExpand();
                    setToggled((t) => ({ ...t, [area.id]: collapsed || !open }));
                  }}
                >
                  <Icon />
                  <span>{area.title}</span>
                  <span className="side-badge">
                    {count}/{area.lessons.length}
                  </span>
                  <ChevronRight className="side-caret" />
                </button>
                {open && (
                  <ul className="side-sub">
                    {area.lessons.map((l) => {
                      const href = `/${area.id}/${l.slug}`;
                      const isDone = done.has(`${area.id}/${l.slug}`);
                      return (
                        <li key={l.slug}>
                          <Link
                            href={href}
                            className={`side-lesson${pathname === href ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                            aria-current={pathname === href ? 'page' : undefined}
                          >
                            <span className="side-dot" aria-hidden="true" />
                            <span>{l.title}</span>
                            {isDone && <span className="sr-only"> (finished)</span>}
                          </Link>
                        </li>
                      );
                    })}
                    <li>
                      <Link href={`/${area.id}`} className="side-lesson is-more">
                        All lessons and {area.soon.length} coming soon
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <p className="side-label">Practice</p>
        <ul className="side-group">
          <li>
            <Link href="/review" className={`side-item${pathname === '/review' ? ' is-active' : ''}`} title="Review">
              <RotateCcw />
              <span>Review</span>
              {due > 0 && <span className="side-badge is-due">{due}</span>}
            </Link>
          </li>
          <li>
            <Link href="/#labs" className="side-item" title="Labs">
              <FlaskConical />
              <span>Labs</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="side-foot">
        <span className="live-dot" aria-hidden="true" />
        <span>
          {finished} of {total} lessons finished
        </span>
      </div>
    </>
  );
}
