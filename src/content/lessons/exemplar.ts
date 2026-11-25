import { n, type Lesson } from '../types';

/**
 * The reference lesson: every other lesson follows this shape.
 *
 * What makes it work without reading the guide:
 *  - packets carry their payload ("20k tokens", "KV state") so the picture narrates itself;
 *  - block states and chips show the outcome (hit, miss, TTL) right where it happens;
 *  - the metric tiles above the stage change step by step, so cause and effect are visible;
 *  - each step changes ONE thing compared with the previous step.
 */
export const promptCaching: Lesson = {
  slug: 'prompt-caching',
  area: 'llm',
  title: 'Prompt Caching',
  summary: 'Most of your prompt is identical on every call. Stop paying full price to recompute it.',
  minutes: 10,
  level: 'intermediate',
  goals: [
    'Say exactly what a provider caches: KV state for a prefix, not text or answers',
    'Read the write and read paths, and their prices',
    'Lay out a prompt so the prefix stays byte-identical',
    'Work out break-even and verify hits from usage fields',
  ],
  metrics: [
    ['billed', 'Input billed'],
    ['cached', 'Read from cache'],
    ['ttft', 'First token'],
    ['hit', 'Hit rate'],
  ],
  nodes: [
    n('app', 'Your app', 'app', 0, 1),
    n('api', 'Model API', 'model', 2, 1),
    n('cache', 'Prompt cache', 'cache', 2, 0),
    n('out', 'Response', 'doc', 4, 1),
  ],
  steps: [
    {
      short: 'Full price',
      kind: 'problem',
      title: 'The same 19,500 tokens, on every call',
      body: [
        'A production request is mostly boilerplate: tool definitions, a long system prompt, reference documents. Only the last few hundred tokens are new.',
        'Without caching the model runs attention over all of it again, and you pay the full input rate each time.',
      ],
      scene: {
        show: ['app', 'api', 'out'],
        flows: [
          ['app', 'api', 'warn', '20,000 tokens'],
          ['api', 'out', 'ok', 'answer'],
          ['app', 'api', 'warn', 'same 19,500 + 500 new'],
          ['api', 'out', 'ok', 'answer'],
        ],
        note: { api: ['recomputes everything', 'warn'] },
      },
      tokens: {
        caption: 'One request · what changes between calls',
        items: [
          { text: 'tools', sub: '3,000 · static', tone: 'warn' },
          { text: 'system prompt', sub: '2,000 · static', tone: 'warn' },
          { text: 'reference docs', sub: '14,500 · static', tone: 'warn' },
          { text: 'user question', sub: '500 · new', tone: 'accent' },
        ],
      },
      metrics: { billed: ['20,000 tok', 'warn'], cached: '0', ttft: '1.8 s', hit: '—' },
    },
    {
      short: 'KV state',
      kind: 'idea',
      title: 'What is actually cached',
      body: [
        'Not your text and not the answer. While reading a prompt, every layer computes **key and value tensors** for each token. In a decoder, token `n` depends only on tokens before it, so the state for a prefix is reusable by any request that starts with the same tokens.',
        'The provider stores that state, keyed by a hash of the prefix.',
      ],
      scene: {
        flows: [
          ['app', 'api', 'neutral', 'prompt'],
          ['api', 'cache', 'accent', 'KV state of the prefix'],
        ],
        state: { cache: 'hot' },
        note: { cache: 'key = hash(prefix)' },
        show: ['app', 'api', 'cache'],
      },
      callout: ['insight', 'This is the same KV cache that makes token-by-token generation fast. Prompt caching just keeps it alive between requests.'],
      pro: 'It is exact-match on tokens. A semantic cache (similar questions) is a different system with different risks.',
    },
    {
      short: 'Write',
      kind: 'technique',
      title: 'First call: the cache is written',
      body: [
        'The first request with a new prefix is a **miss**. The model does all the work and the provider stores the prefix state with a time-to-live.',
        'Some providers charge a premium for the write (Anthropic: 1.25× input). Others write for free and discount reads less (OpenAI).',
      ],
      scene: {
        flows: [
          ['app', 'api', 'neutral', 'prefix + question'],
          ['api', 'cache', 'accent', 'write 19,500'],
          ['api', 'out', 'ok', 'answer'],
        ],
        state: { cache: 'hot' },
        note: { cache: ['TTL 5 min', 'accent'] },
      },
      metrics: { billed: ['24,875 tok-eq', 'warn'], cached: '0', hit: '0%' },
      changes: ['- First call costs slightly more: 19,500 × 1.25 + 500', '+ State for the prefix now exists'],
    },
    {
      short: 'Hit',
      kind: 'technique',
      title: 'Next call: read instead of recompute',
      body: [
        'A later request that starts with **exactly the same tokens** loads the stored state. The model only processes the 500 new tokens.',
        'Cached tokens are billed at about a tenth of the input price, and each read resets the TTL.',
      ],
      scene: {
        flows: [
          ['app', 'api', 'neutral', 'same prefix + new question'],
          ['cache', 'api', 'ok', 'read 19,500'],
          ['api', 'out', 'ok', 'answer'],
        ],
        state: { cache: 'ok' },
        note: { api: ['computes only 500', 'ok'], cache: ['TTL reset', 'ok'] },
      },
      metrics: { billed: ['2,450 tok-eq', 'ok'], cached: ['19,500', 'ok'], ttft: ['0.6 s', 'ok'], hit: ['100%', 'ok'] },
      changes: ['+ Input cost −88%: 19,500 × 0.1 + 500', '+ Time to first token drops by about two thirds'],
    },
    {
      short: 'Miss',
      kind: 'pitfall',
      title: 'One changed byte, and everything after it is lost',
      body: [
        'Each token’s state depends on every token before it. Change something early and the hash no longer matches: the whole prefix is recomputed.',
        'The classic bug is a timestamp, request id or user name at the top of the system prompt.',
      ],
      scene: {
        flows: [
          ['app', 'api', 'warn', '"Time: 14:03:22" + prefix'],
          ['api', 'cache', 'bad', 'lookup', 'block'],
          ['api', 'out', 'ok', 'answer'],
        ],
        state: { cache: 'bad' },
        note: { cache: ['no match', 'bad'], api: ['recomputes everything', 'warn'] },
      },
      tokens: {
        caption: 'Bad order · nothing after the first chip can be reused',
        items: [
          { text: 'Time: 14:03:22', sub: 'changes every call', tone: 'bad' },
          { text: 'system prompt', sub: 'invalidated', tone: 'warn' },
          { text: 'tools', sub: 'invalidated', tone: 'warn' },
          { text: 'reference docs', sub: 'invalidated', tone: 'warn' },
          { text: 'user question', tone: 'accent' },
        ],
      },
      metrics: { billed: ['24,875 tok-eq', 'bad'], cached: ['0', 'bad'], ttft: ['1.8 s', 'bad'], hit: ['0%', 'bad'] },
      pro: 'Other silent cache-breakers: non-deterministic JSON key order in tool schemas, reordering tools, toggling a tool on or off, and A/B testing a system-prompt variant.',
    },
    {
      short: 'Layout',
      kind: 'technique',
      title: 'Stable first, volatile last',
      body: [
        'Order content by how often it changes: tools, system prompt, long documents, conversation history, then the new message. Put the date and per-user details at the very end.',
        'With explicit breakpoints you mark where a cacheable prefix ends; several breakpoints let a shared prefix and a per-conversation prefix both hit.',
      ],
      scene: {
        flows: [
          ['app', 'api', 'neutral', 'stable prefix + volatile tail'],
          ['cache', 'api', 'ok', 'read 19,500'],
          ['api', 'out', 'ok', 'answer'],
        ],
        state: { cache: 'ok' },
      },
      tokens: {
        caption: 'Good order · ▮ marks a cache breakpoint',
        items: [
          { text: 'tools', sub: 'static', tone: 'ok' },
          { text: 'system prompt ▮', sub: 'static', tone: 'ok' },
          { text: 'reference docs ▮', sub: 'per corpus', tone: 'ok' },
          { text: 'history ▮', sub: 'grows', tone: 'ok' },
          { text: 'time + question', sub: 'new', tone: 'accent' },
        ],
      },
      metrics: { billed: ['2,450 tok-eq', 'ok'], cached: ['19,500', 'ok'], ttft: ['0.6 s', 'ok'], hit: ['100%', 'ok'] },
      callout: ['tip', 'Serialize tool schemas deterministically (sorted keys, fixed order) and treat the system prompt as an immutable, versioned artifact.'],
    },
    {
      short: 'Break-even',
      kind: 'tradeoff',
      title: 'When it pays, and when it does not',
      body: [
        'With a 1.25× write and 0.1× read, caching wins from the **second** call inside the TTL. If the prefix is used once and then expires, you paid 25% extra for nothing.',
        'Prefixes below the minimum size (around 1,024 tokens, model-dependent) are not cached at all. A longer TTL costs more to write and suits bursty traffic.',
      ],
      bars: {
        caption: 'Input cost for N calls with a 19,500-token prefix (relative)',
        items: [
          { label: '1 call · no cache', value: 20, display: '1.00×' },
          { label: '1 call · cache written, never read', value: 25, display: '1.24×', tone: 'bad' },
          { label: '10 calls · no cache', value: 100, display: '10.0×', tone: 'warn' },
          { label: '10 calls · cached', value: 23, display: '2.35×', tone: 'ok' },
        ],
      },
      metrics: { hit: ['depends on traffic', 'warn'] },
      pro: 'Low-traffic endpoints fall out of a 5-minute TTL constantly. Either accept the misses, pay for a longer TTL, or send a cheap keep-warm request if the maths works.',
    },
    {
      short: 'Recap',
      kind: 'recap',
      title: 'Where caching matters most: agent loops',
      body: [
        'An agent resends its whole growing conversation on every turn. Each previous turn is a ready-made prefix, so a 30-turn task reads almost everything from cache.',
        'Verify, do not assume: the usage block of every response reports cache-write and cache-read token counts.',
      ],
      scene: {
        flows: [
          ['app', 'api', 'neutral', 'turn 30: 80k history + result'],
          ['cache', 'api', 'ok', 'read 78k'],
          ['api', 'cache', 'accent', 'write 2k more'],
          ['api', 'out', 'ok', 'next action'],
        ],
        state: { cache: 'ok' },
        note: { cache: ['grows with each turn', 'ok'] },
      },
      metrics: { billed: ['≈ 10k tok-eq', 'ok'], cached: ['78,000', 'ok'], ttft: ['0.9 s', 'ok'], hit: ['97%', 'ok'] },
      pro: 'Alert on the ratio cache_read / (cache_read + input). A sudden drop means someone changed the prefix; it shows up in the bill a day later.',
    },
  ],
  takeaways: [
    'The cache holds **KV state for an exact token prefix**, keyed by its hash.',
    'Writes cost a little extra, reads about **10%**; break-even is the second call inside the TTL.',
    'Any early change invalidates everything after it: **stable first, volatile last**.',
    'Check `cache_read` tokens in usage; agent loops benefit the most.',
  ],
};
