import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DoneTick } from '@/components/ui/DoneTick';
import { areas, getArea, lessonsIn } from '@/content';
import { LABS } from '@/content/labs';
import { AREA_ICON } from '@/lib/areaIcons';

type Params = Promise<{ area: string }>;

export function generateStaticParams() {
  return areas.map((a) => ({ area: a.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const area = getArea((await params).area);
  if (!area) return {};
  return { title: `${area.title} — ${area.tagline}`, description: area.blurb };
}

export default async function AreaPage({ params }: { params: Params }) {
  const area = getArea((await params).area);
  if (!area) notFound();

  const ready = lessonsIn(area.id);
  const soon = area.concepts.filter((c) => !c.slug);

  const Icon = AREA_ICON[area.id];

  return (
    <div className="page" data-area={area.id}>
      <header className="page-head area-head">
        <span className="tile tile-lg">
          <Icon />
        </span>
        <div>
          <h1>
            {area.title} <span className="c-primary">{area.tagline}</span>
          </h1>
          <p className="page-sub">{area.blurb}</p>
        </div>
      </header>

      <ol className="lesson-list">
        {ready.map((lesson, i) => (
          <li key={lesson.slug} style={{ animationDelay: `${i * 40}ms` }}>
            <Link href={`/${area.id}/${lesson.slug}`} className="card lesson-row">
              <span className="lesson-row-num">{i + 1}</span>
              <span className="lesson-row-main">
                <span className="lesson-row-title">{lesson.title}</span>
                <span className="lesson-row-sum">{lesson.summary}</span>
              </span>
              <span className="lesson-row-meta">
                {LABS[`${area.id}/${lesson.slug}`] && <span className="tag tag-accent">Lab</span>}
                <span className="tag">{lesson.level}</span>
                <span className="tag">{lesson.minutes} min</span>
                <DoneTick id={`${area.id}/${lesson.slug}`} />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="section-title">Coming soon</h2>
        <p className="muted">These {soon.length} concepts are on the roadmap and not written yet.</p>
        <ul className="soon-list">
          {soon.map((c) => (
            <li key={c.title}>{c.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
