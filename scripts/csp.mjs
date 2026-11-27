/**
 * Adds a Content-Security-Policy to an exported page.
 *
 * The pages are static, so a nonce is impossible. Instead each page lists the SHA-256 hash of the
 * inline scripts it really contains: anything else injected into the page will not run.
 * A <meta> policy cannot hold frame-ancestors; that one is a response header (public/_headers, vercel.json).
 */
import { createHash } from 'node:crypto';

// Cloudflare Web Analytics: the beacon script, and where it reports page views.
const beacon = { script: 'https://static.cloudflareinsights.com', report: 'https://cloudflareinsights.com' };

export function withPolicy(html) {
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(attrs) || !body) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
  const analytics = html.includes(`src="${beacon.script}/`);
  const policy = [
    "default-src 'self'",
    ['script-src', "'self'", analytics && beacon.script, ...hashes].filter(Boolean).join(' '),
    analytics && `connect-src 'self' ${beacon.report}`,
    // React writes style attributes (bar widths, animation delays).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
    .filter(Boolean)
    .join('; ');
  if (!html.includes('<head>')) throw new Error('page has no <head>');
  return html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}"/>`);
}
