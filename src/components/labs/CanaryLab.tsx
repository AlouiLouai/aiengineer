'use client';

import { useRef, useState } from 'react';
import { Dial, Facts, Insight, Panel, pct, rng, useTick } from './kit';

const BASE_ERR = 0.02;
const GUARD = 0.06;
const PER_TICK = 200;

export function CanaryLab() {
  const [share, setShare] = useState(5);
  const [err, setErr] = useState(15);
  const [minN, setMinN] = useState(50);
  const [state, setState] = useState<'idle' | 'running' | 'rolled' | 'passed'>('idle');
  const [hist, setHist] = useState<Array<{ n: number; e: number }>>([]);
  const r = useRef<() => number>(() => 0);

  useTick(state === 'running', 260, () => {
    const prev = hist.at(-1) ?? { n: 0, e: 0 };
    const n = prev.n + Math.round((PER_TICK * share) / 100);
    let e = prev.e;
    for (let i = prev.n; i < n; i++) if (r.current() < err / 100) e++;
    setHist([...hist, { n, e }]);
    if (n >= minN && e / n > GUARD) setState('rolled');
    else if (hist.length + 1 >= 24) setState('passed');
  });
  const start = () => {
    r.current = rng(Math.floor(Math.random() * 1e9));
    setHist([]);
    setState('running');
  };
  const edit = (fn: (v: number) => void) => (v: number) => {
    fn(v);
    setHist([]);
    setState('idle');
  };

  const now = hist.at(-1) ?? { n: 0, e: 0 };
  const seen = hist.length * PER_TICK;
  const bigBang = Math.round((seen * err) / 100);
  const scaleY = (rate: number) => 230 - Math.min(0.32, rate) * 690;
  const line = hist.map((h, i) => `${20 + i * 24},${scaleY(h.n ? h.e / h.n : 0)}`).join(' ');

  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">
          {state === 'idle' && 'Set the release up, then ship it.'}
          {state === 'running' && `Live: ${now.n} canary requests so far…`}
          {state === 'rolled' && <b className="c-bad">Guardrail crossed. Rolled back after {now.n} canary requests.</b>}
          {state === 'passed' && <b className="c-ok">No alarm in the window. The release would be promoted.</b>}
        </p>
        <svg className="plot" viewBox="0 0 600 260" role="img" aria-label="Canary error rate over time against the guardrail">
          <line className="plot-axis" x1="20" x2="590" y1={scaleY(0)} y2={scaleY(0)} />
          <line className="plot-cut" x1="20" x2="590" y1={scaleY(GUARD)} y2={scaleY(GUARD)} />
          <text className="plot-label" x="24" y={scaleY(GUARD) - 6}>guardrail {pct(GUARD)}</text>
          <line className="plot-base" x1="20" x2="590" y1={scaleY(BASE_ERR)} y2={scaleY(BASE_ERR)} />
          <text className="plot-label" x="590" y={scaleY(BASE_ERR) - 4} textAnchor="end">stable {pct(BASE_ERR)}</text>
          {hist.length > 1 && <polyline className={`plot-line${state === 'rolled' ? ' is-bad' : ''}`} points={line} />}
          {hist.length > 0 && (
            <circle className={`plot-head${state === 'rolled' ? ' is-bad' : ''}`} cx={20 + (hist.length - 1) * 24} cy={scaleY(now.n ? now.e / now.n : 0)} r="7" />
          )}
        </svg>
        <p className="lab-key">The line is the measured error rate of the new version, on the users it has reached.</p>
      </Panel>
      <div className="lab-side">
        <Dial label="Canary share" value={share} min={1} max={50} step={1} show={`${share}%`} onChange={edit(setShare)} />
        <Dial label="True error rate of the new version" value={err} min={1} max={30} step={1} show={`${err}%`} onChange={edit(setErr)} />
        <Dial label="Requests before judging" value={minN} min={10} max={300} step={10} onChange={edit(setMinN)} />
        <div className="lab-actions">
          <button type="button" className="btn btn-primary" disabled={state === 'running'} onClick={start}>
            Ship it
          </button>
        </div>
        <Facts
          items={[
            ['Failed for users', String(now.e), now.e > 20 ? 'bad' : 'neutral'],
            ['If shipped to all', seen ? `≈ ${bigBang}` : '—', bigBang > 20 ? 'bad' : 'neutral'],
            ['Measured', now.n ? pct(now.e / now.n, 1) : '—'],
          ]}
        />
        <Insight tone={state === 'rolled' ? 'ok' : state === 'passed' && err / 100 > GUARD ? 'bad' : 'accent'}>
          {state === 'rolled'
            ? err / 100 <= GUARD
              ? 'A false alarm: this version is within the guardrail, but the sample was small. Judge after more requests.'
              : `The canary contained it: ${now.e} failures, against roughly ${bigBang} on full traffic over the same time.`
            : state === 'passed'
              ? err / 100 > GUARD
                ? 'A bad release got through: too few requests to see it. A bigger share or a longer soak is needed.'
                : now.n < minN
                  ? `Only ${now.n} requests arrived and you asked for ${minN}, so nothing was ever judged. Silence is not a pass.`
                  : 'This version is within the guardrail, and the sample was large enough to judge it.'
              : 'A small share hurts fewer users but needs longer to see a problem. Try 1%, then 25%.'}
        </Insight>
      </div>
    </div>
  );
}
