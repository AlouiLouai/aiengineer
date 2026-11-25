import type { Bar, TokenChip } from '@/content/types';

export function Tokens({ caption, items }: { caption?: string; items: TokenChip[] }) {
  return (
    <figure className="board tokens">
      {caption && <figcaption>{caption}</figcaption>}
      <div className="token-row">
        {items.map((t, i) => (
          <span key={i} className={`token tone-${t.tone ?? 'neutral'}`} style={{ animationDelay: `${i * 90}ms` }}>
            <span className="token-text">{t.text}</span>
            {t.sub && <span className="token-sub">{t.sub}</span>}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function Bars({ caption, items }: { caption?: string; items: Bar[] }) {
  return (
    <figure className="board bars">
      {caption && <figcaption>{caption}</figcaption>}
      <ul>
        {items.map((b, i) => (
          <li key={i} className={`bar tone-${b.tone ?? 'neutral'}`}>
            <div className="bar-head">
              <span className="bar-label">{b.label}</span>
              <span className="bar-value">{b.display ?? b.value}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${Math.max(1.5, Math.min(100, b.value))}%`, animationDelay: `${i * 140}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
