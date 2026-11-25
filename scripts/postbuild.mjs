/** Finishes the static export in ./out: portable file names, and a policy on every page. */
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withPolicy } from './csp.mjs';

const out = 'out';
const files = async () =>
  (await readdir(out, { recursive: true, withFileTypes: true }))
    .filter((f) => f.isFile())
    .map((f) => path.join(f.parentPath, f.name));

// The browser asks for `__next.a.b.__PAGE__.txt`. On Windows, Next 16.4 writes `__next.a/b/__PAGE__.txt`.
const folders = new Set();
for (const file of await files()) {
  const parts = file.split(path.sep);
  const at = parts.findIndex((p) => p.startsWith('__next.') && !p.endsWith('.txt'));
  if (at < 0) continue;
  await rename(file, path.join(...parts.slice(0, at), parts.slice(at).join('.')));
  folders.add(path.join(...parts.slice(0, at + 1)));
}
for (const folder of folders) await rm(folder, { recursive: true });

const pages = (await files()).filter((f) => f.endsWith('.html'));
for (const page of pages) await writeFile(page, withPolicy(await readFile(page, 'utf8')));
console.log(`Post-build: policy on ${pages.length} pages, ${folders.size} folders flattened`);
