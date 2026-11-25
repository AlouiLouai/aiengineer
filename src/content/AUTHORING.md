# Writing a lesson

A lesson is data: see the types in `types.ts` and the reference lesson in `lessons/exemplar.ts`.
Read both before writing. This file holds the rules that the types cannot express.

## The goal

A reader should understand each step **from the stage alone**, before reading the guide text.
The author is a senior AI engineer who has run these systems in production: precise about
mechanisms, honest about costs, specific about failure modes.

## Shape of a lesson

- **7 to 9 steps.** Step 1 has `kind: 'problem'` (show the failure or cost that motivates the
  topic). The last step has `kind: 'recap'` and shows the whole system working.
- **Each step changes one thing** compared with the previous step: one new block, one new
  packet path, one state flip, one number. That single change is the lesson of the step.
- Every step has a picture: a `scene` (preferred), and/or a `tokens` or `bars` board.
- `short` is the timeline label: 1–2 words, at most 12 characters ("Cache hit", "Rerank").
- `body`: at most two paragraphs of at most ~45 words each. The picture carries the story.
- `metrics` on the lesson: 3–5 tiles `[key, label]` (label ≤ 16 characters). Steps set values
  with `metrics: { key: 'value' }` or `{ key: ['value', 'ok' | 'warn' | 'bad'] }`. Values persist
  until changed, so only list what changes. Step 1 should set every tile. Make the numbers tell
  the story: the reader should see latency, cost, accuracy or risk move.
- `goals`: 3–5 outcomes, each starting with a verb. `takeaways`: 3–5 lines, may use **bold**.
- `pro` (a "From production" note): use on 3–5 steps per lesson. A concrete number, a failure
  mode, a debugging tip or a rule of thumb that a practitioner would know and a tutorial omits.
- `callout`: at most one per step, and not on every step.
- `changes`: use on steps that introduce a technique; 2–4 lines starting with `+` or `-`.

## Making the scene explain itself

- **Packets narrate.** Give every flow a payload that says what is moving, in the system's own
  vocabulary: `'tool_use: get_weather'`, `'top 50 chunks'`, `'429 retry-after: 2s'`,
  `'WHERE tenant = 42'`. Never `'request'` or `'data'`.
- **Order is the story.** Flows play one after another in array order. Write them in the order
  things really happen. 2–6 flows per step.
- **Tone has a fixed meaning:** `neutral` = request going out, `ok` = good response or success,
  `accent` = data/context being moved, `warn` = slow, costly or risky, `bad` = failure or attack.
- **Show outcomes on the blocks:** `state` (`hot` = look here, `ok` ✓, `warn` !, `bad` ✕,
  `off` = unused/down) and `note` chips with a fact (`'TTL 5 min'`, `['0 rows', 'ok']`).
- **Gauges** (`meter`) for anything that fills up or is a share: context window, cache hit
  rate, traffic split, budget. `meter: { ctx: [92, '184k / 200k'] }`.
- **Blocked actions:** a flow with `'block'` as the fifth element stops short with a red cross.
  Use it for guardrails, permission checks, rate limits, failed lookups.
- **Boards:** `tokens` for anything that is a sequence of pieces (prompt layout, tokens, chunks,
  tool list, trace events); `bars` for comparisons and distributions. A board can accompany a
  scene. For purely conceptual lessons a board alone is fine.

## How the stage plays a step

- The flows play once, then the picture holds. Moving the mouse over it (or tapping) plays it again.
  Readers can also pause, scrub, slow down or use Auto.
- **Cause before effect.** A block's `note`, `meter` and outcome `state` appear when the last packet
  that feeds it lands (or, for a block that only sends, when it first sends). `hot` and `off` show
  from the start. Metric tiles change when the last packet has landed.
- So write the flow that *causes* an outcome into the block that shows it.
- Two directions between the same blocks get separate curved lanes; each keeps its own chip.

## Quiz and labs

- Every lesson has two questions in `quiz.ts`. Ask for a decision in a concrete situation, keep the
  three options similar in length, and make the explanation teach. Answers feed `/review`.
- A lab (one per area, `labs.ts` + `components/labs`) lets the reader change the numbers. Its insight
  text must react to the controls. Say when data is simulated.

## Layout rules (the stage does not check these)

- Columns 0–4, rows 0–2. One column is 200 px, one row 236 px; a block is about 115 px wide.
- 3–6 blocks per lesson. Give the first step only the blocks it needs (`show`), and let the
  system grow as the lesson goes on.
- Two blocks joined by a flow **with a payload** must be at least **1.8 columns** apart, or on
  different rows. Blocks in the same column must be a full row apart.
- Text limits: block `label` ≤ 16 characters, `note` ≤ 22, payload ≤ 28, meter text ≤ 14.
- Flow left to right for the main path; put side systems (cache, store, judge) above or below.

## Accuracy

- State mechanisms correctly and precisely. Prefer "typically", "often", ranges and
  provider-neutral wording over exact vendor numbers that go stale. Where a number is
  illustrative, the board caption or text says "(illustrative)".
- Do not invent benchmark results, citations, product names or API fields. Real, well-known
  names (BM25, HNSW, RRF, OpenTelemetry, MCP, A2A, pgvector, LoRA, vLLM, OWASP) are fine.
- No hype and no filler. If a technique has a cost or a failure mode, say it.

## Mechanics

- Prose supports only `**bold**` and `` `code` `` — no italics, no links, no lists.
- Use double-quoted or single-quoted TypeScript strings; escape quotes correctly. Curly quotes
  (“ ”) are fine inside prose.
- Keep each lesson's `slug`, `area` and `title` unchanged, and keep the file's export name and
  lesson order. Every block id used in a step must exist in the lesson's `nodes`.
- `pnpm test` checks block ids, text lengths, layout and quizzes. `pnpm typecheck` checks types.
