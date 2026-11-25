import { Check } from 'lucide-react';
import { Inline } from '@/components/ui/Inline';
import type { Step } from '@/content/types';

export function Takeaways({ items }: { items: string[] }) {
  return (
    <ul className="takeaways">
      {items.map((t) => (
        <li key={t}>
          <span className="goal-box" aria-hidden="true">
            <Check />
          </span>
          <span>
            <Inline text={t} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StepText({ step, takeaways }: { step: Step; takeaways?: string[] }) {
  return (
    <article className="step">
      <h2 className="step-title">{step.title}</h2>
      {step.body.map((p, i) => (
        <p key={i}>
          <Inline text={p} />
        </p>
      ))}
      {takeaways && <Takeaways items={takeaways} />}
      {step.callout && (
        <aside className={`callout callout-${step.callout[0]}`}>
          <span className="callout-kind">
            {step.callout[0] === 'tip' ? 'Good to know' : step.callout[0] === 'warn' ? 'Watch out' : 'Key idea'}
          </span>
          <p>
            <Inline text={step.callout[1]} />
          </p>
        </aside>
      )}
      {step.pro && (
        <aside className="callout callout-pro">
          <span className="callout-kind">From production</span>
          <p>
            <Inline text={step.pro} />
          </p>
        </aside>
      )}
      {step.changes && (
        <>
          <p className="eyebrow changes-title">What changed</p>
          <ul className="changes">
            {step.changes.map((line, i) => {
              const sign = line[0] === '+' ? 'plus' : line[0] === '-' ? 'minus' : 'same';
              return (
                <li key={i} className={`change change-${sign}`}>
                  <span className="change-sign" aria-hidden="true">
                    {sign === 'plus' ? '+' : sign === 'minus' ? '−' : '~'}
                  </span>
                  <span>
                    <Inline text={sign === 'same' ? line : line.slice(1).trim()} />
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
