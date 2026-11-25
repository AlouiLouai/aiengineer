# AI Engineer Course

An interactive course in AI engineering: 40 animated lessons, 7 simulators, quizzes and spaced review.
Covers LLMs, RAG, agents, evals, system design, security and deployment.

## Run it

Needs Node 22.13 or newer and pnpm 10.

```sh
pnpm install
pnpm dev
```

| Command | What it does |
| --- | --- |
| `pnpm check` | Everything CI runs: lint, types, tests and build |
| `pnpm test` | Unit tests, including checks on every lesson |
| `pnpm build` | Static site in `out/`, with a Content-Security-Policy on each page |
| `pnpm preview` | Serves `out/` locally |

## Layout

| Folder | Contents |
| --- | --- |
| `src/app` | Routes and metadata |
| `src/components` | `stage` (animation), `lesson`, `labs`, `practice` (quiz, review), `dashboard`, `layout`, `ui` |
| `src/content` | Lessons, quizzes and the course map, as data |
| `src/lib` | Hooks and logic without markup |
| `src/styles` | One stylesheet per area; the colours are in `tokens.css` |
| `tests` | Vitest |

## Deploy

The build is plain files: no server, database or secret. Set `SITE_URL` (for example `https://example.com`) when
building, so the sitemap and social links are correct.

- **Cloudflare Workers:** build command `pnpm build`, deploy command `npx wrangler deploy`, build variable
  `SITE_URL`. Settings are in `wrangler.jsonc`.
- **Anywhere else:** upload `out/`. `public/_headers` lists the security headers to set.

Progress is stored in the reader's browser (`localStorage`). Nothing is sent to a server.

## Write a lesson

Lessons are data. Read [src/content/AUTHORING.md](src/content/AUTHORING.md).

## Credits

The font is [Aspekta](https://github.com/ivodolenc/aspekta) by Ivo Dolenc, under the SIL Open Font License 1.1
([src/fonts/OFL.txt](src/fonts/OFL.txt)).
