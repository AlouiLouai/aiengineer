'use client';

import { useState } from 'react';
import { Dial, Facts, Insight, Panel, pct } from './kit';

const POLICY =
  'Orders ship within two business days. Express shipping is available in most regions. Customers may return unused items for a full refund within thirty days of delivery, except for opened software, which can only be exchanged. Refunds reach the original payment method in five to seven days. Gift cards are never refundable. Damaged items must be reported within two days with a photo.'.split(
    ' ',
  );
const FACT_FROM = POLICY.indexOf('Customers');
const FACT_TO = POLICY.indexOf('exchanged.');

export function ChunkingLab() {
  const [size, setSize] = useState(14);
  const [overlap, setOverlap] = useState(0);
  const lap = Math.min(overlap, size - 4);

  const chunks: Array<[number, number]> = [];
  for (let start = 0; ; start += size - lap) {
    const end = Math.min(POLICY.length, start + size);
    chunks.push([start, end - 1]);
    if (end === POLICY.length) break;
  }
  const whole = chunks.findIndex(([a, b]) => a <= FACT_FROM && b >= FACT_TO);
  const stored = chunks.reduce((sum, [a, b]) => sum + b - a + 1, 0);
  const noise = whole >= 0 ? 1 - (FACT_TO - FACT_FROM + 1) / (chunks[whole][1] - chunks[whole][0] + 1) : 0;

  return (
    <div className="lab">
      <Panel>
        <p className="lab-prompt">
          Question: “Can I return <b>opened software</b>?” The answer needs the underlined sentence in one piece.
        </p>
        <p className="chunk-text">
          {POLICY.map((word, i) => {
            const inside = chunks.flatMap(([a, b], c) => (i >= a && i <= b ? [c] : []));
            const starts = chunks.some(([a]) => a === i && i > 0);
            const fact = i >= FACT_FROM && i <= FACT_TO;
            return (
              <span
                key={i}
                className={`chunk-word hue-${inside[0] % 4}${inside.length > 1 ? ' is-double' : ''}${starts ? ' is-start' : ''}${fact ? ' is-fact' : ''}`}
              >
                {word}{' '}
              </span>
            );
          })}
        </p>
        <div className="chunk-rail" aria-hidden="true">
          {chunks.map(([a, b], i) => (
            <span
              key={i}
              className={`hue-${i % 4}${i === whole ? ' is-hit' : ''}`}
              style={{
                left: `${(a / POLICY.length) * 100}%`,
                width: `${((b - a + 1) / POLICY.length) * 100}%`,
                top: i % 2 ? 18 : 0,
              }}
            />
          ))}
        </div>
      </Panel>
      <div className="lab-side">
        <Dial label="Chunk size" value={size} min={8} max={60} step={1} show={`${size} words`} onChange={setSize} />
        <Dial label="Overlap" value={lap} min={0} max={Math.min(30, size - 4)} step={1} show={`${lap} words`} onChange={setOverlap} />
        <Facts
          items={[
            ['Chunks', String(chunks.length)],
            ['Stored', `${(stored / POLICY.length).toFixed(2)}×`, stored / POLICY.length > 1.6 ? 'warn' : 'neutral'],
            ['Fact intact', whole >= 0 ? 'yes' : 'no', whole >= 0 ? 'ok' : 'bad'],
            ['Noise in chunk', whole >= 0 ? pct(noise) : '—', noise > 0.45 ? 'warn' : 'neutral'],
          ]}
        />
        <Insight tone={whole < 0 ? 'bad' : noise > 0.45 || stored / POLICY.length > 1.6 ? 'warn' : 'ok'}>
          {whole < 0
            ? 'The rule and its exception are in different chunks. The model would see “full refund” and miss the exception.'
            : stored / POLICY.length > 1.6
              ? 'The fact survives because you store much of the text more than once. Overlap buys safety with duplicates.'
              : noise > 0.45
                ? 'The fact survives, buried in unrelated text. Its embedding is blurred, so it ranks lower.'
                : 'One chunk holds the rule and its exception with little else. Splitting on sentences finds this boundary directly.'}
        </Insight>
      </div>
    </div>
  );
}
