import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SiteShell } from '@/components/layout/SiteShell';
import { nav } from '@/content';
import { siteUrl } from '@/lib/site';
import './globals.css';

// Aspekta by Ivo Dolenc, SIL Open Font License 1.1
const aspekta = localFont({
  src: [
    { path: '../fonts/Aspekta-400.woff2', weight: '400' },
    { path: '../fonts/Aspekta-500.woff2', weight: '500' },
    { path: '../fonts/Aspekta-600.woff2', weight: '600' },
  ],
  variable: '--font-aspekta',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  authors: [{ name: 'louAI' }],
  creator: 'louAI',
  title: {
    default: 'AI Engineer Course',
    template: '%s | AI Engineer',
  },
  description:
    'Learn AI engineering one animated step at a time: LLMs, RAG, agents, evals, system design, security and deployment.',
  openGraph: { type: 'website', siteName: 'AI Engineer Course' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

// Runs before first paint so a saved (or system) dark theme never flashes light.
const themeScript = `try{var t=localStorage.getItem('aie:theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={aspekta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteShell nav={nav}>{children}</SiteShell>
      </body>
    </html>
  );
}
