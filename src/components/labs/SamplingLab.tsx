'use client';

import { useState } from 'react';
import { sample } from '@/lib/sampling';
import { Dial, Facts, Insight, Panel, pct } from './kit';

const WORDS: Array<[string, number]> = [
  ['blue', 4.2],
  ['clear', 3.5],
  ['grey', 2.9],
  ['falling', 2.1],
  ['beautiful', 1.7],
  ['dark', 1.3],
  ['green', 0.2],
  ['database', -1.4],
];

const LOGITS = WORDS.map(([, logit]) => logit);

/** The index of one random draw from a distribution. */
function drawFrom(odds: number[]): number {
  let u = Math.random();
  for (let i = 0; i < odds.length; i++) {
    u -= odds[i];
    if (u < 0) return i;
  }
  // Rounding can leave a sliver above the last bar.
  return odds.indexOf(Math.max(...odds));
}

export function SamplingLab() {
  const [temp, setTemp] = useState(0.8);
  const [topP, setTopP] = useState(1);
  const [counts, setCounts] = useState<number[]>(() => WORDS.map(() => 0));
  const [last, setLast] = useState(-1);

  const { before, after } = sample(LOGITS, temp, topP);

  const draw = (times: number) => {
    const next = [...counts];
    let hit = 0;
    for (let k = 0; k < times; k++) {
      hit = drawFrom(after);
      next[hit]++;
    }
    setCounts(next);
    setLast(hit);
  };
  const reset = () => {
    setCounts(WORDS.map(() => 0));
    setLast(-1);
  };
  const drawn = counts.reduce((a, b) => a + b, 0);
  const alive = after.filter((p) => p > 0).length;

  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">
          The sky today is <span className="lab-blank">{last >= 0 ? WORDS[last][0] : '…'}</span>
        </p>
        <ul className="dist">
          {WORDS.map(([word], i) => (
            <li key={word} className={`${after[i] === 0 ? 'is-cut' : ''}${i === last ? ' is-last' : ''}`}>
              <span className="dist-word">{word}</span>
              <span className="dist-track">
                <span className="dist-ghost" style={{ transform: `scaleX(${before[i]})` }} />
                <span className="dist-fill" style={{ transform: `scaleX(${after[i]})` }} />
                {drawn > 0 && <span className="dist-mark" style={{ left: `${(counts[i] / drawn) * 100}%` }} />}
              </span>
              <span className="dist-num">{pct(after[i], 1)}</span>
              <span className="dist-count">{counts[i] || ''}</span>
            </li>
          ))}
        </ul>
        <p className="lab-key">Pale bar: before top-p. Solid bar: after the cut and renormalising. Vertical mark: share of your draws.</p>
      </Panel>
      <div className="lab-side">
        <Dial label="Temperature" value={temp} min={0} max={2} step={0.1} show={temp.toFixed(1)} onChange={(v) => { setTemp(v); reset(); }} />
        <Dial label="Top-p" value={topP} min={0.1} max={1} step={0.05} show={topP.toFixed(2)} onChange={(v) => { setTopP(v); reset(); }} />
        <div className="lab-actions">
          <button type="button" className="btn btn-primary" onClick={() => draw(1)}>Draw 1</button>
          <button type="button" className="btn btn-outline" onClick={() => draw(100)}>Draw 100</button>
        </div>
        <Facts items={[['Words in play', `${alive} of ${WORDS.length}`], ['Draws', String(drawn)]]} />
        <Insight tone={temp > 1.3 && topP > 0.95 ? 'warn' : 'accent'}>
          {temp === 0
            ? 'Greedy: one word takes everything. Repeatable most of the time, but only as right as the top word.'
            : temp > 1.3 && topP > 0.95
              ? 'A hot, uncut distribution: “database” is now a real possibility. Lower top-p and watch the tail disappear.'
              : topP < 0.6
                ? 'A tight nucleus. However high the temperature, the tail cannot be drawn.'
                : 'Temperature reshapes all the odds. Top-p then removes the tail.'}
        </Insight>
      </div>
    </div>
  );
}
