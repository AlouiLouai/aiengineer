import { ArrowRight, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { AreaCount } from '@/components/dashboard/AreaCount';
import { ContinueCard } from '@/components/dashboard/ContinueCard';
import { HeroDemo } from '@/components/dashboard/HeroDemo';
import { StatRow } from '@/components/dashboard/StatRow';
import { lessonId, lessons, nav, totalMinutes } from '@/content';
import { LABS } from '@/content/labs';
import { AREA_ICON } from '@/lib/areaIcons';

export default function HomePage() {
  const hours = Math.round(totalMinutes / 60);

  return (
    <div className="page">
      <header className="page-head">
        <h1>
          Welcome to <span className="c-primary">AI Engineer</span>
        </h1>
        <p className="page-sub">
          Watch a request move through real AI systems, one animated step at a time. Then play with the numbers, and
          test yourself until it stays. Free and open source, made by louAI.
        </p>
      </header>

      <StatRow ids={lessons.map(lessonId)} hours={hours} labs={Object.keys(LABS).length} />

      <section className="hero">
        <HeroDemo />
        <ContinueCard nav={nav} />
      </section>

      <section>
        <h2 className="section-title">Course modules</h2>
        <div className="area-grid">
          {nav.map((area) => {
            const Icon = AREA_ICON[area.id];
            return (
              <Link key={area.id} href={`/${area.id}`} className="card area-card" data-area={area.id}>
                <span className="tile">
                  <Icon />
                </span>
                <span className="area-card-title">
                  {area.title}
                  <ArrowRight />
                </span>
                <span className="area-card-sub">{area.blurb}</span>
                <AreaCount areaId={area.id} slugs={area.lessons.map((l) => l.slug)} />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="labs">
        <h2 className="section-title">Interactive labs</h2>
        <div className="area-grid">
          {Object.entries(LABS).map(([id, lab]) => (
            <Link key={id} href={`/${id}#lab`} className="card area-card" data-area={id.split('/')[0]}>
              <span className="tile">
                <FlaskConical />
              </span>
              <span className="area-card-title">
                {lab.title}
                <ArrowRight />
              </span>
              <span className="area-card-sub">{lab.blurb}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
