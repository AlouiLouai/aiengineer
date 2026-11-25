'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { Tone } from '@/content/types';

/** A small seeded random generator, so simulations are repeatable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** An approximately normal draw: mean 0, standard deviation 1. */
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

interface DialProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  show?: string;
  onChange: (value: number) => void;
}
export function Dial({ label, value, min, max, step, show, onChange }: DialProps) {
  return (
    <label className="dial">
      <span className="dial-head">
        <span>{label}</span>
        <output>{show ?? value}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={show}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Facts({ items }: { items: Array<[label: string, value: string, tone?: Tone]> }) {
  return (
    <dl className="facts">
      {items.map(([label, value, tone]) => (
        <div key={label} className={`chip tone-${tone ?? 'neutral'}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="lab-panel">{children}</div>;
}

/** What to notice. Changes with the controls, so the reader connects the two. */
export function Insight({ tone = 'accent', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <p className={`lab-insight tone-${tone}`} aria-live="polite">
      {children}
    </p>
  );
}

/** Calls `fn` every `ms` while `on`. */
export function useTick(on: boolean, ms: number, fn: () => void) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  });
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [on, ms]);
}

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;
