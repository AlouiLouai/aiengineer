import type { NodeKind, NodeState } from '@/content/types';

/** The solid each kind of block is drawn as. */
export type Shape = 'cube' | 'cylinder' | 'slab';
export const SHAPE: Record<NodeKind, Shape> = {
  user: 'slab',
  app: 'cube',
  model: 'cube',
  agent: 'cube',
  db: 'cylinder',
  doc: 'slab',
  tool: 'cube',
  guard: 'cube',
  cache: 'cylinder',
  judge: 'cube',
  queue: 'cube',
  cloud: 'cube',
};

/** 24×24 line icons, drawn in ink on the front of each block. */
export const ICONS: Record<NodeKind, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.600-6 8-6s8 2 8 6" />
    </>
  ),
  app: (
    <>
      <rect x="4" y="4" width="16" height="7" rx="2" />
      <rect x="4" y="13" width="16" height="7" rx="2" />
      <path d="M7.500 7.500h.01M7.500 16.500h.01M11 7.500h5M11 16.500h5" />
    </>
  ),
  model: (
    <>
      <path d="M12 3l2 6.200L20 11l-6 1.800L12 19l-2-6.200L4 11l6-1.800z" />
      <path d="M19 17v4M17 19h4" />
    </>
  ),
  agent: (
    <>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V5M9 13h.01M15 13h.01M9.500 16h5" />
      <circle cx="12" cy="4" r="1" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v10c0 1.700 3.100 3 7 3s7-1.300 7-3V7M5 12c0 1.700 3.100 3 7 3s7-1.300 7-3" />
    </>
  ),
  doc: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  tool: <path d="M14.500 5.500a4 4 0 0 0-5.200 5.200L4 16l4 4 5.300-5.300a4 4 0 0 0 5.200-5.200l-2.600 2.600-2.500-.900-.900-2.500z" />,
  guard: (
    <>
      <path d="M12 3l7 3v6c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  cache: <path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
  judge: (
    <>
      <path d="M12 4v16M7 20h10M5 8h14M5 8l-2.500 6a3 3 0 0 0 5 0zM19 8l-2.500 6a3 3 0 0 0 5 0z" />
    </>
  ),
  queue: <path d="M3 12h6M9 12l5-6h7M9 12l5 6h7M18 3l3 3-3 3M18 15l3 3-3 3" />,
  cloud: <path d="M7 18a4 4 0 0 1-.500-8A6 6 0 0 1 18 9.500 4.300 4.300 0 0 1 17.500 18z" />,
};

export const BADGE: Partial<Record<NodeState, string>> = {
  ok: 'M-5 0.500l3.500 3.500 6.500-7',
  warn: 'M0 -5v5.500M0 4.500v.010',
  bad: 'M-4 -4l8 8M4 -4l-8 8',
};
