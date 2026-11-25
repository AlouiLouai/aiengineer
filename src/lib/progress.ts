'use client';

import { useSyncExternalStore } from 'react';

/**
 * Reader progress, kept in this browser's localStorage.
 * Everything is wrapped in try/catch: storage can be blocked or unavailable.
 */

const DONE_KEY = 'aie:done';
const LAST_KEY = 'aie:last';
const CARDS_KEY = 'aie:cards';
const DAY = 86_400_000;
/** Days until a question comes back, by box. A wrong answer returns it to box 0. */
const INTERVALS = [0, 1, 3, 7, 16, 35];

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* progress simply is not saved */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
}

/** A snapshot that is only re-parsed when the stored text changes, as React requires. */
function stored<T>(key: string, empty: T, parse: (value: unknown) => T): () => T {
  let raw: string | null | undefined;
  let value = empty;
  return () => {
    const now = read(key);
    if (now !== raw) {
      raw = now;
      try {
        value = now ? parse(JSON.parse(now)) : empty;
      } catch {
        value = empty;
      }
    }
    return value;
  };
}

const EMPTY: ReadonlySet<string> = new Set();
const doneSnapshot = stored(DONE_KEY, EMPTY, (v) =>
  Array.isArray(v) ? new Set(v.filter((x): x is string => typeof x === 'string')) : EMPTY,
);

/** Ids ("area/slug") of the lessons the reader has finished. Empty during server render. */
export function useDone(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, doneSnapshot, () => EMPTY);
}

export function markDone(id: string) {
  const current = doneSnapshot();
  if (current.has(id)) return;
  write(DONE_KEY, JSON.stringify([...current, id]));
}

/** The lesson the reader opened most recently, or null. */
export function useLastLesson(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(LAST_KEY),
    () => null,
  );
}

export function rememberLesson(id: string) {
  if (read(LAST_KEY) !== id) write(LAST_KEY, id);
}

/* ── Spaced review ── */

export interface Card {
  box: number;
  /** When the question is due again, in epoch milliseconds. */
  due: number;
}
export type Cards = Readonly<Record<string, Card>>;

const NO_CARDS: Cards = {};
const isCard = (v: unknown): v is Card =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Card).box === 'number' &&
  typeof (v as Card).due === 'number';
const cardsSnapshot = stored<Cards>(CARDS_KEY, NO_CARDS, (v) =>
  typeof v === 'object' && v !== null ? Object.fromEntries(Object.entries(v).filter(([, c]) => isCard(c))) : NO_CARDS,
);

/** Every question the reader has answered at least once, by question id. */
export function useCards(): Cards {
  return useSyncExternalStore(subscribe, cardsSnapshot, () => NO_CARDS);
}

/** Record an answer. Right answers move the question to a longer interval. */
export function gradeCard(id: string, right: boolean) {
  const cards = cardsSnapshot();
  const now = Date.now();
  const old = cards[id];
  // Answering again before the question is due does not push it further away.
  if (right && old && old.box > 0 && old.due > now) return;
  const box = right ? Math.min(INTERVALS.length - 1, (old?.box ?? 0) + 1) : 0;
  write(CARDS_KEY, JSON.stringify({ ...cards, [id]: { box, due: now + INTERVALS[box] * DAY } }));
}

/** How many questions are due for review right now, ignoring lessons that no longer exist. */
export function useDueCount(isLesson: (lessonId: string) => boolean): number {
  return useSyncExternalStore(
    subscribe,
    () => {
      const now = Date.now();
      return Object.entries(cardsSnapshot()).filter(([id, c]) => c.due <= now && isLesson(id.split('#')[0])).length;
    },
    () => 0,
  );
}
