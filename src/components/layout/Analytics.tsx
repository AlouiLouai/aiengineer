import { analyticsToken } from '@/lib/site';

/**
 * Cloudflare Web Analytics beacon. Production builds only, so local work is never counted.
 * It follows client-side navigations on its own (History API), so it is loaded once, here.
 * The page policy allows its origins only on pages that carry it (scripts/csp.mjs).
 */
export function Analytics() {
  if (process.env.NODE_ENV !== 'production' || !analyticsToken) return null;
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: analyticsToken })}
    />
  );
}
