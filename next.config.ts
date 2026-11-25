import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Plain files in ./out, so any static host can serve the site.
  output: 'export',
  // /llm/ is out/llm/index.html, which every host resolves without special rules.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
