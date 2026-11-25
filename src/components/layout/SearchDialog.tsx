'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { NavArea } from '@/content';

interface Hit {
  href: string;
  title: string;
  area: string;
  areaId: string;
  soon: boolean;
}

export function SearchDialog({ nav, onClose }: { nav: NavArea[]; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const all = useMemo<(Hit & { text: string })[]>(
    () =>
      nav.flatMap((a) => [
        ...a.lessons.map((l) => ({
          href: `/${a.id}/${l.slug}`,
          title: l.title,
          area: a.title,
          areaId: a.id,
          soon: false,
          text: `${l.title} ${l.summary} ${a.title}`.toLowerCase(),
        })),
        ...a.soon.map((title) => ({
          href: `/${a.id}`,
          title,
          area: a.title,
          areaId: a.id,
          soon: true,
          text: `${title} ${a.title}`.toLowerCase(),
        })),
      ]),
    [nav],
  );

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = (words.length ? all.filter((h) => words.every((w) => h.text.includes(w))) : all.filter((h) => !h.soon)).slice(0, 40);
  const active = Math.min(cursor, Math.max(0, hits.length - 1));

  const open = (hit: Hit | undefined) => {
    if (!hit) return;
    onClose();
    router.push(hit.href);
  };

  return (
    <dialog
      ref={ref}
      className="search"
      aria-label="Search lessons"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="search-box">
        <input
          autoFocus
          type="search"
          placeholder="Search 140 concepts…"
          aria-label="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor(Math.min(hits.length - 1, active + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor(Math.max(0, active - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              open(hits[active]);
            }
          }}
        />
        <button type="button" className="search-close" onClick={onClose}>
          Esc
        </button>
      </div>
      <ul className="search-results">
        {hits.length === 0 && <li className="search-empty">No concept matches “{query}”.</li>}
        {hits.map((hit, i) => (
          <li key={`${hit.href}-${hit.title}`}>
            <button
              type="button"
              className={`search-hit${i === active ? ' is-active' : ''}`}
              data-area={hit.areaId}
              onMouseEnter={() => setCursor(i)}
              onClick={() => open(hit)}
            >
              <span className="search-hit-dot" aria-hidden="true" />
              <span className="search-hit-title">{hit.title}</span>
              <span className="search-hit-area">
                {hit.area}
                {hit.soon ? ', coming soon' : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
