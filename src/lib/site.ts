/** The public address, for absolute links in metadata. Set SITE_URL at build time. */
export const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

/**
 * Cloudflare Web Analytics site token: public by design, it ships in every page.
 * Cookieless page views only. Set CF_BEACON_TOKEN="" at build time to turn it off (forks, staging).
 */
export const analyticsToken = process.env.CF_BEACON_TOKEN ?? '5b231235254c4a95a9a058cf1969875a';
