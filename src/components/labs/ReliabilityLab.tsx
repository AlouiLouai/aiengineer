'use client';

import { useMemo, useState } from 'react';
import { Dial, Facts, Insight, Panel, pct, rng, useTick } from './kit';

export function ReliabilityLab() {
  const [p, setP] = useState(0.95);
  const [n, setN] = useState(10);
  const [retries, setRetries] = useState(0);
  const [seed, setSeed] = useState(1);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  // For each agent: the step at which it fails, or Infinity.
  const fails = useMemo(() => {
    const r = rng(seed);
    const each = 1 - (1 - p) ** (retries + 1);
    return Array.from({ length: 100 }, () => {
      let failed = Infinity;
      for (let s = 1; s <= n; s++) if (r() > each && failed === Infinity) failed = s;
      return failed;
    });
  }, [p, n, retries, seed]);

  useTick(running, 240, () => {
    if (step >= n) setRunning(false);
    else setStep(step + 1);
  });
  const reset = () => {
    setStep(0);
    setRunning(false);
  };

  const expected = (1 - (1 - p) ** (retries + 1)) ** n;
  // Expected tries per step, times the steps.
  const calls = n * Array.from({ length: retries + 1 }, (_, k) => (1 - p) ** k).reduce((a, b) => a + b, 0);
  const alive = fails.filter((f) => f > step).length;

  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">
          100 agents, step {step} of {n}. <b>{alive} still on track.</b>
        </p>
        <div className="swarm" role="img" aria-label={`${alive} of 100 agents still on track`}>
          {fails.map((f, i) => (
            <span key={i} className={f <= step ? 'is-dead' : step >= n ? 'is-ok' : ''}>
              {f <= step ? f : ''}
            </span>
          ))}
        </div>
        <p className="lab-key">A number is the step where that agent went wrong.</p>
      </Panel>
      <div className="lab-side">
        <Dial label="Success per step" value={p} min={0.8} max={0.99} step={0.01} show={pct(p)} onChange={(v) => { setP(v); reset(); }} />
        <Dial label="Steps in the task" value={n} min={1} max={30} step={1} onChange={(v) => { setN(v); reset(); }} />
        <Dial label="Checked retries per step" value={retries} min={0} max={2} step={1} onChange={(v) => { setRetries(v); reset(); }} />
        <div className="lab-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={running}
            onClick={() => {
              setSeed(seed + 1);
              setStep(0);
              setRunning(true);
            }}
          >
            Run 100 agents
          </button>
        </div>
        <Facts
          items={[
            ['Expected', pct(expected), expected > 0.85 ? 'ok' : expected > 0.6 ? 'warn' : 'bad'],
            ['Model calls, if all steps run', calls.toFixed(1)],
          ]}
        />
        <Insight tone={expected > 0.85 ? 'ok' : 'warn'}>
          {retries === 0
            ? `${p.toFixed(2)} to the power of ${n} is ${pct(expected)}. Try one checked retry before you try a better prompt.`
            : `A retry only helps if something detects the failure. Assuming a perfect check, it costs ${(calls - n).toFixed(1)} extra calls.`}
        </Insight>
      </div>
    </div>
  );
}
