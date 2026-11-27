/** The public address, for absolute links in metadata. Set SITE_URL at build time. */
export const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

/**
 * Cloudflare Web Analytics site token, set as a build variable by whoever deploys.
 * Unset means no analytics: forks and local builds never report to someone else's dashboard.
 */
export const analyticsToken = process.env.CF_BEACON_TOKEN || '';
