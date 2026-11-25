import type { MetadataRoute } from 'next';
import { areas, lessonHref, lessons } from '@/content';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', ...areas.map((a) => `/${a.id}/`), ...lessons.map((l) => `${lessonHref(l)}/`)];
  return paths.map((path) => ({ url: new URL(path, siteUrl).href }));
}
