import { Check, FlaskConical, ListChecks } from 'lucide-react';

export interface Stop {
  kind: 'step' | 'lab' | 'quiz';
  label: string;
}

/** The numbered dots above the stage: every step, then the lab and the quiz. */
export function StepRail({ stops, index, onGo }: { stops: Stop[]; index: number; onGo: (to: number) => void }) {
  return (
    <nav className="timeline" aria-label="Parts of this lesson">
      <ol style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
        {stops.map((s, i) => (
          <li key={i} className={i < index ? 'is-past' : i === index ? 'is-current' : ''}>
            <button type="button" aria-current={i === index ? 'step' : undefined} onClick={() => onGo(i)}>
              <span className="timeline-dot" aria-hidden="true">
                {s.kind === 'lab' ? <FlaskConical /> : s.kind === 'quiz' ? <ListChecks /> : i < index ? <Check /> : i + 1}
              </span>
              <span className="timeline-label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
