'use client';

import { PanelLeft, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { NavArea } from '@/content';
import { SearchDialog } from './SearchDialog';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  nav: NavArea[];
  children: React.ReactNode;
}

function isPage(path: string, nav: NavArea[]): boolean {
  const [, areaId, slug] = path.split('/');
  if (path === '/' || path === '/review') return true;
  const area = nav.find((a) => a.id === areaId);
  return Boolean(area && (!slug || area.lessons.some((l) => l.slug === slug)));
}

export function SiteShell({ nav, children }: Props) {
  // Addresses end in a slash on static hosts; compare without it.
  const path = usePathname().replace(/(.)\/$/, '$1');
  // The exported 404 page is shown at any address, so it must render the same for all of them.
  const pathname = isPage(path, nav) ? path : '/404';
  const [drawer, setDrawer] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // The drawer is open only for the page it was opened on, so navigating closes it.
  const drawerOpen = drawer === pathname;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [areaId, slug] = pathname.split('/').slice(1);
  const area = nav.find((a) => a.id === areaId);
  const lesson = area?.lessons.find((l) => l.slug === slug);
  const here = lesson?.title ?? area?.title ?? (pathname === '/review' ? 'Review' : pathname === '/' ? 'Dashboard' : 'Not found');

  return (
    <div className={`shell${collapsed ? ' is-collapsed' : ''}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <nav className={`sidebar${drawerOpen ? ' is-open' : ''}`} aria-label="Course">
        <Sidebar nav={nav} pathname={pathname} collapsed={collapsed && !drawerOpen} onExpand={() => setCollapsed(false)} />
      </nav>
      {drawerOpen && <button type="button" className="scrim" aria-label="Close menu" onClick={() => setDrawer(null)} />}

      <div className="inset">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (Ctrl B)"
            onClick={() => {
              if (window.matchMedia('(max-width: 900px)').matches) setDrawer(drawerOpen ? null : pathname);
              else setCollapsed(!collapsed);
            }}
          >
            <PanelLeft />
          </button>
          <span className="topbar-sep" aria-hidden="true" />
          <div className="crumbs">
            <span className="crumbs-root">AI Engineer</span>
            <span className="crumbs-slash">/</span>
            <span className="crumbs-here">{here}</span>
          </div>
          <button type="button" className="search-btn" onClick={() => setSearchOpen(true)}>
            <Search />
            <span>Search lessons</span>
            <kbd aria-hidden="true">Ctrl K</kbd>
          </button>
          <ThemeToggle />
        </header>
        <main id="main" className="main">
          {children}
        </main>
      </div>

      {searchOpen && <SearchDialog nav={nav} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
