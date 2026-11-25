'use client';

import { useState } from 'react';
import { Dial, Facts, gauss, Insight, Panel, pct, rng } from './kit';

const OUTPUTS = (() => {
  const r = rng(11);
  return Array.from({ length: 100 }, (_, i) => {
    const good = i < 80;
    const score = Math.min(98, Math.max(2, (good ? 70 : 42) + gauss(r) * 14));
    return { good, score, y: r() };
  });
})();

export function JudgeLab() {
  const [cut, setCut] = useState(20);
  const good = OUTPUTS.filter((o) => o.good);
  const bad = OUTPUTS.filter((o) => !o.good);
  const tpr = good.filter((o) => o.score >= cut).length / good.length;
  const tnr = bad.filter((o) => o.score < cut).length / bad.length;
  const agree = (tpr * good.length + tnr * bad.length) / OUTPUTS.length;
  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">
          100 outputs labelled by experts: <b className="c-ok">80 good</b>, <b className="c-bad">20 bad</b>. The judge passes everything right of the line.
        </p>
        <svg className="plot" viewBox="0 0 600 260" role="img" aria-label="Judge scores of good and bad outputs">
          <rect className="plot-pass" x={cut * 6} y="0" width={600 - cut * 6} height="260" />
          {OUTPUTS.map((o, i) => {
            const passed = o.score >= cut;
            const wrong = passed !== o.good;
            return (
              <g key={i} transform={`translate(${o.score * 6} ${o.good ? 20 + o.y * 95 : 145 + o.y * 95})`}>
                <circle className={`plot-dot ${o.good ? 'is-good' : 'is-bad'}${wrong ? ' is-wrong' : ''}`} r={wrong ? 7 : 5.5} />
              </g>
            );
          })}
          <line className="plot-cut" x1={cut * 6} x2={cut * 6} y1="0" y2="260" />
          <text className="plot-label" x="8" y="18">good</text>
          <text className="plot-label" x="8" y="250">bad</text>
        </svg>
        <p className="lab-key">Filled: the judge agrees with the expert. Hollow: it does not. Scores are simulated.</p>
      </Panel>
      <div className="lab-side">
        <Dial label="Pass mark" value={cut} min={0} max={100} step={1} onChange={setCut} />
        <Facts
          items={[
            ['Raw agreement', pct(agree), agree > 0.75 ? 'ok' : 'warn'],
            ['Good passed (TPR)', pct(tpr), tpr > 0.8 ? 'ok' : 'bad'],
            ['Bad caught (TNR)', pct(tnr), tnr > 0.8 ? 'ok' : 'bad'],
          ]}
        />
        <Insight tone={tnr < 0.5 ? 'bad' : tpr < 0.6 ? 'warn' : 'ok'}>
          {tnr < 0.5
            ? `${pct(agree)} agreement looks respectable, yet the judge misses most bad outputs. The class imbalance does the work.`
            : tpr < 0.6
              ? 'A strict judge catches the bad and fails most of the good. A team would stop trusting it.'
              : 'Both rates are visible now. Choose the trade by what a missed failure costs you, not by agreement.'}
        </Insight>
      </div>
    </div>
  );
}
