'use client';

import { useState } from 'react';
import { Dial, Facts, gauss, Insight, Panel, pct, rng } from './kit';

const REQUESTS = (() => {
  const r = rng(5);
  return Array.from({ length: 120 }, () => {
    const hard = r() < 0.25;
    const difficulty = hard ? 0.6 + r() * 0.4 : r() * 0.6;
    return { hard, noise: gauss(r), difficulty };
  });
})();

export function RouterLab() {
  const [cut, setCut] = useState(0.75);
  const [noise, setNoise] = useState(0.15);
  const routed = REQUESTS.map((q) => {
    const guess = Math.min(1, Math.max(0, q.difficulty + q.noise * noise));
    return { ...q, large: guess >= cut };
  });
  const large = routed.filter((q) => q.large).length;
  const wrong = routed.filter((q) => q.hard && !q.large).length;
  const waste = routed.filter((q) => !q.hard && q.large).length;
  // Illustrative prices: the large model costs 10 units, the small one 1.
  const cost = (large * 10 + (routed.length - large)) / (routed.length * 10);
  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">120 requests, about a quarter of them hard. The classifier guesses difficulty and gets some wrong.</p>
        <div className="router">
          {[true, false].map((side) => (
            <div key={String(side)} className="router-bin">
              <p className="eyebrow">{side ? 'Large model' : 'Small model'}</p>
              <div className="router-dots">
                {routed.map(
                  (q, i) =>
                    q.large === side && (
                      <span
                        key={i}
                        className={q.hard ? (q.large ? 'is-hard' : 'is-fail') : q.large ? 'is-waste' : 'is-easy'}
                        title={q.hard ? (q.large ? 'Hard, handled well' : 'Hard, answered badly') : q.large ? 'Easy, overpaid' : 'Easy, cheap'}
                      />
                    ),
                )}
              </div>
            </div>
          ))}
        </div>
        <ul className="router-key">
          <li className="is-easy">easy, cheap</li>
          <li className="is-hard">hard, handled</li>
          <li className="is-waste">easy, overpaid</li>
          <li className="is-fail">hard, silent failure</li>
        </ul>
      </Panel>
      <div className="lab-side">
        <Dial label="Escalate above difficulty" value={cut} min={0} max={1} step={0.01} show={cut.toFixed(2)} onChange={setCut} />
        <Dial label="Classifier noise" value={noise} min={0} max={0.4} step={0.01} show={noise.toFixed(2)} onChange={setNoise} />
        <Facts
          items={[
            ['Cost vs all-large', pct(cost), cost < 0.5 ? 'ok' : 'warn'],
            ['Silent failures', String(wrong), wrong === 0 ? 'ok' : wrong > 5 ? 'bad' : 'warn'],
            ['Overpaid', String(waste), waste > 25 ? 'warn' : 'neutral'],
          ]}
        />
        <Insight tone={wrong > 5 ? 'bad' : cost > 0.6 ? 'warn' : 'ok'}>
          {wrong > 5
            ? 'Cheap, and wrong where it hurts. No error is raised for any of these. Lean towards the large model.'
            : cost > 0.6
              ? 'Safe, but the savings are nearly gone. A better classifier moves both numbers at once: lower the noise.'
              : 'A good spot. A few overpaid requests are the insurance against silent failures.'}
        </Insight>
      </div>
    </div>
  );
}
