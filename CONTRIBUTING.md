# Contributing

Thank you for helping. The most useful contributions are new lessons, corrections to existing ones, and bug reports.

## Before you start

- For a new lesson or a larger change, open an issue first so that two people do not write the same thing.
- For a typo or a small fix, a pull request is enough.

## Set up

```sh
pnpm install
pnpm dev
```

## Write or change a lesson

Lessons are TypeScript data in `src/content/lessons`. Read [src/content/AUTHORING.md](src/content/AUTHORING.md)
first: it explains how a step's diagram should tell the story on its own.

1. In `src/content/areas.ts`, change the concept from `S('Title')` to `L('Title', 'slug')`.
2. Add the lesson to the area's file in `src/content/lessons`.
3. Add two questions for it in `src/content/quiz.ts`.
4. Run `pnpm dev`, step through the lesson, and check that each diagram reads well without the text.

Content must be accurate. Prefer ranges and provider-neutral wording to exact vendor numbers, mark illustrative
numbers as such, and do not invent benchmarks or citations.

## Before you open a pull request

```sh
pnpm check
```

This runs lint, types, tests and the build. The tests check every lesson for unknown blocks, overlapping
labels, text that is too long and quiz problems.

In the pull request, say what changed and why, and add a screenshot for visual changes.

## Code style

- TypeScript, strict. Components in `src/components/<area>`, logic without markup in `src/lib`.
- Styles go in the matching file in `src/styles`, using the variables in `tokens.css`.
- Keep animations on `transform` and `opacity`, and respect `prefers-reduced-motion`.

## Conduct

Be respectful and constructive. Harassment or personal attacks are not accepted, and maintainers may remove
comments or contributors that break this rule.

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
