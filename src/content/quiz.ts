/**
 * Retrieval practice: two questions per lesson, asked after the recap and again in /review.
 * Each is a decision an engineer has to make, not a definition to recite.
 * [question, right answer, wrong answer, wrong answer, why]. Options are shuffled on screen.
 */
type Q = [question: string, right: string, wrong1: string, wrong2: string, why: string];

export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  why: string;
}

const bank: Record<string, [Q, Q]> = {
  /* ── LLM ── */
  'llm/tokenization': [
    ['A model miscounts the letters in a word. What is the sound fix?', 'Give it a code tool for character-level work', 'Raise max output tokens so it can spell it out', 'Set the temperature to 0 so it stops guessing', 'The model sees ids for learned pieces, not characters. Sampling settings cannot restore information that was never in the input.'],
    ['Your JSON payloads cost far more than the 4-characters-per-token estimate. Why?', 'Punctuation, keys and ids split into many short pieces', 'Providers bill structured formats at a higher input rate', 'The tokenizer adds a special token at the end of every line', 'The 4-character average describes English prose. Dense symbols and random ids have few long learned pieces, so measure with the provider’s counter.'],
  ],
  'llm/self-attention': [
    ['Why can the KV state of a prefix be reused by a later request?', 'The causal mask means a token never depends on later ones', 'Softmax gives the same result for equal scores at T = 0', 'Values are identical for every token within one layer', 'Each token attends only to itself and what came before, so identical prefixes give identical state.'],
    ['You double the prompt length. What happens to attention prefill work, roughly?', 'It grows about four times', 'It doubles', 'It stays flat because layers run in parallel', 'Every token is compared with every earlier token, so the work grows roughly with n². KV memory grows with n.'],
  ],
  'llm/context-windows': [
    ['A chat “forgets” a rule given in the first message. What is the most likely cause?', 'Your app trimmed the oldest turns to fit', 'The provider expired the user’s session', 'The model’s weights drifted during the chat', 'Models are stateless: only what is resent exists. Pin anything that must never be trimmed.'],
    ['Why edit history in large, rare steps instead of a little every turn?', 'Each edit breaks the cached prefix after that point', 'Small edits are rejected by most APIs', 'Large edits make the context window bigger', 'Prompt caching matches an exact prefix. Constant small edits mean you pay full price every turn.'],
  ],
  'llm/temperature-top-p': [
    ['You set temperature to 0. What have you actually bought?', 'Less variance, with no promise of correct output', 'Identical output on every call, forever', 'Protection against invented facts', 'Greedy decoding picks the top token. Batching and floating-point effects can still change it, and the top token can be wrong.'],
    ['What does top-p = 0.9 do before the draw?', 'Keeps the smallest set of tokens reaching 90% and renormalises', 'Keeps every token whose own probability is above 90%', 'Multiplies every logit by 0.9 and then renormalises them', 'Top-p is a cumulative cut, so the number of survivors adapts to how confident the model is.'],
  ],
  'llm/reasoning-models': [
    ['A reasoning call returns an empty answer. What do you check first?', 'Whether thinking used up the output limit', 'Whether the system prompt was too short to act on', 'Whether the temperature was set too high', 'Thinking shares the output limit with the answer. The stop reason tells you that it ran out.'],
    ['Traffic is 90% simple look-ups and 10% hard analysis. What is the best setup?', 'Route only the hard minority to reasoning', 'Use maximum effort on everything for consistency', 'Disable reasoning and lengthen the prompt', 'Thinking is billed as output and adds latency. Spend it where the extra serial compute changes the result.'],
  ],
  'llm/structured-outputs': [
    ['Constrained decoding is on. Which failure is still possible?', 'A well-formed object with a wrong value', 'A missing closing brace on a complete response', 'A string where the schema requires a number', 'Masking guarantees shape, not truth. Keep validating meaning in code, and check the stop reason for truncation.'],
    ['Your schema puts `verdict` before `reasoning`. Why is that a problem?', 'The verdict is generated before any reasoning exists', 'JSON parsers reject keys that are not in alphabetical order', 'Long strings must come first so that masking can apply', 'Field order is generation order. Put the reasoning first so that the verdict can depend on it.'],
  ],
  'llm/prompt-caching': [
    ['Cache reads fell to zero after a deploy that added the current time to the system prompt. Why?', 'A change early in the prompt invalidates everything after it', 'A timestamp pushes the prompt over the maximum cacheable size', 'The cache stores answers, and answers now contain the time', 'The key is a hash of the exact prefix. Put volatile content last.'],
    ['With a 1.25× write and a 0.1× read, when does caching start to pay?', 'On the second call', 'On the very first call', 'After roughly ten calls inside the TTL', 'Two uncached calls cost 2.0×. One write plus one read costs 1.35×.'],
  ],
  /* ── RAG ── */
  'rag/embeddings': [
    ['You upgrade the embedding model for queries only. What happens?', 'Scores become meaningless until documents are re-embedded', 'Recall improves slightly, with no other visible effect', 'Only documents longer than the new input limit are affected', 'Each model has its own vector space. An index must hold vectors from a single model version.'],
    ['Users search for the error code E-4012 and get similar but wrong codes. Why?', 'Embeddings capture meaning and are weak on exact identifiers', 'Cosine similarity drops digits before it compares vectors', 'The vectors were not normalised, so short texts rank badly', 'A rare id has little semantic content. Add lexical search such as BM25.'],
  ],
  'rag/chunking-strategies': [
    ['Answers are often split across two neighbouring chunks. What fixes the cause?', 'Split on document structure and keep the heading path', 'Raise the vector dimension so that more text fits in', 'Lower the similarity threshold so that both are returned', 'A chunk should be about one thing and stand alone. Overlap only patches the symptom, at the price of duplicates.'],
    ['Small chunks match well but give the model too little context. What do you do?', 'Match on small chunks and return their parent section', 'Index whole documents so that nothing is ever cut', 'Store each chunk three times to raise its weight', 'What you match and what you return can be different units.'],
  ],
  'rag/vector-databases': [
    ['A tenant-filtered search for the top 10 returns only 2 results. What is the likely cause?', 'The filter ran after the search and discarded most hits', 'The embedding dimension is too small for that tenant', 'HNSW stops after it has found two exact neighbours', 'Post-filtering starves results. Filter during the search, and enforce tenancy on the server.'],
    ['Recall is too low, and you cannot rebuild the HNSW index today. Which dial helps?', 'Raise `efSearch`', 'Raise `M` in the settings', 'Raise `efConstruction` now', '`efSearch` trades latency for recall per query. The other two are fixed at build time.'],
  ],
  'rag/hybrid-search': [
    ['Why combine the two retrievers by rank (RRF) and not by adding their scores?', 'BM25 and cosine scores are on unrelated scales', 'Ranks are stored with more precision than scores', 'Adding scores would need both indexes in one database', 'RRF sums 1 / (60 + rank), so neither scale can dominate.'],
    ['Which query does BM25 handle better than embeddings?', 'A part number such as “KX-77B”', '“How do I get my money back?”', 'A question in another language', 'Rare exact terms carry a high IDF. Paraphrase and cross-language queries favour embeddings.'],
  ],
  'rag/reranking': [
    ['The right chunk is missing from the first-stage top 100. Will a reranker help?', 'No, it can only reorder what was retrieved', 'Yes, it searches the full corpus again', 'Yes, if you raise its temperature', 'Reranking improves precision at the top. Recall belongs to the first stage, so measure both.'],
    ['Why not run the cross-encoder over the whole corpus?', 'It needs one forward pass per query–chunk pair', 'It is less accurate than one vector per chunk', 'It cannot read text longer than a sentence', 'Joint reading is accurate but cannot be precomputed. Retrieve wide, rerank, keep few.'],
  ],
  'rag/contextual-retrieval': [
    ['A chunk says “revenue grew 3%” and never matches “ACME Q2”. What is the fix?', 'Add generated situating context before indexing', 'Retrieve many more chunks for every query', 'Rewrite the chunk as a question before storing', 'Isolated chunks lose who, what and when. The context is written once, at index time.'],
    ['What makes writing context for every chunk affordable?', 'Caching the document as a shared prompt prefix', 'Generating it lazily for the top hits at query time', 'Skipping the BM25 index to save on storage', 'Each chunk’s call repeats the same document. Cached reads cut most of the input cost.'],
  ],
  'rag/agentic-rag': [
    ['Which question needs agentic retrieval most?', '“Who manages the team that owns the failing service?”', '“What is our refund window for annual plans?”', '“Summarise the three paragraphs I pasted below”', 'The second search depends on what the first one found. Single-hop lookups are cheaper with fixed RAG.'],
    ['An agentic search runs 25 rounds and times out. What was missing?', 'A cap on rounds and time that forces a final answer', 'A larger embedding model with better first-round recall', 'A higher temperature to make the queries more diverse', 'Loops need limits in code, and a useful answer with what was found when a limit is hit.'],
  ],
  /* ── Agents ── */
  'agents/tool-calling': [
    ['Who executes a tool call?', 'Your code, after validating the request', 'The model, inside the provider’s servers', 'The JSON Schema validator', 'The model only emits a request. That makes your executor the security boundary.'],
    ['A tool fails with “date must be YYYY-MM-DD”. What should you return?', 'An error result that states the expected format', 'An empty success so that the loop continues', 'Nothing, and end the conversation', 'An error written for the model lets it correct itself on the next turn.'],
  ],
  'agents/agent-loop': [
    ['Each step succeeds 95% of the time. What is the chance a 10-step task succeeds?', 'About 60%', 'About 95%', 'About 85%', '0.95 to the power of 10 is roughly 0.60. Shorter paths and self-checks matter more than clever prompts.'],
    ['Why does turn 30 cost more than turn 3?', 'The whole history is resent on every turn', 'Providers raise prices within a session', 'Tools get slower as they are reused', 'Context grows with the run. Caching and compaction keep that under control.'],
  ],
  'agents/long-term-memory': [
    ['Memory holds both “lives in Tunis” and “lives in Paris”. What was missing on write?', 'Reconciling: supersede the old fact and date it', 'A larger context window to hold both entries', 'A higher top-k when recalling memories', 'Append-only memory accumulates contradictions. Facts need dates and replacement.'],
    ['Why is a poisoned memory worse than a poisoned message?', 'It is replayed into every future session', 'It uses many more tokens on each request', 'It cannot be encrypted once it is stored', 'Persistence turns one injection into a standing one. Gate writes, and scope reads per user in code.'],
  ],
  'agents/orchestrator-worker': [
    ['A worker returns an off-topic report. Where do you look first?', 'Its brief: goal, known facts, scope, return format', 'The results that the other workers sent it while it ran', 'The sampling temperature of the orchestrator model', 'A worker starts with a fresh context and knows only its brief.'],
    ['Which job should stay with one agent?', 'Editing several tightly coupled files', 'Reading 40 reports in parallel', 'Searching five unrelated sources', 'Workers cannot see each other. Parallelise reading and keep coupled writing together.'],
  ],
  'agents/mcp': [
    ['5 apps need 8 integrations each. What does MCP change?', '40 custom integrations become 5 clients and 8 servers', 'All 8 integrations are merged into one shared MCP server', 'The apps no longer have to authenticate to those systems', 'M × N becomes M + N because both sides speak one protocol.'],
    ['Why pin and review third-party MCP servers?', 'Their tool descriptions enter your prompt as untrusted text', 'Servers without a pinned version cannot use Streamable HTTP', 'The capability handshake fails if no version is declared', 'A changed description can steer the model. Every connected tool also costs context.'],
  ],
  'agents/a2a-protocol': [
    ['Your agent must delegate to a partner company’s agent. Which protocol fits?', 'A2A, agent to agent', 'MCP, agent to tool', 'SSE, server to browser', 'A2A lets opaque agents collaborate on tasks. MCP connects an agent to tools and data.'],
    ['A remote task pauses with “input required”. How should you treat that?', 'As a normal lifecycle state to resume', 'As a failed task to be retried from the start', 'As proof that the Agent Card is out of date', 'Tasks can pause, run for hours and end in several terminal states. Persist the task id.'],
  ],
  'agents/human-in-the-loop': [
    ['Where must “ask before refunding” be enforced?', 'In the executor code', 'In the system prompt', 'In the tool description', 'A prompt is advice. Only code can guarantee that the action waits.'],
    ['An approval arrives 6 hours later. What must happen before executing?', 'Re-validate the action against current state', 'Ask the model to repeat the request', 'Extend the model’s context window', 'The world may have changed. Resume must be idempotent and checked again.'],
  ],
  /* ── Evals ── */
  'evals/golden-datasets': [
    ['Overall score rose 1 point on 200 cases. What can you conclude?', 'Little: it is within the sampling noise', 'A lot: the new version is better', 'Nothing: the dataset is too easy now', 'At 200 cases the uncertainty is about ±5 points. Compare case by case and per slice.'],
    ['Where should most golden cases come from?', 'Production traces and error analysis', 'Examples invented by the prompt author', 'Randomly generated questions, for coverage', 'Real failures show what matters. Synthetic data can fill thin slices.'],
  ],
  'evals/llm-as-a-judge': [
    ['90% of outputs are good and a judge passes everything. What is its agreement with experts?', '90%, while it catches no bad output at all', '50%, because it gives no more signal than a coin', '100%, because it agrees on every output it passes', 'Raw agreement hides a lenient judge. Report TPR and TNR.'],
    ['The output must be valid ISO dates. How do you grade it?', 'With a code check', 'With an LLM judge and a clear rubric', 'With pairwise human preference votes', 'If there is one right form, code is cheaper, exact and repeatable.'],
  ],
  'evals/faithfulness': [
    ['An answer matches its sources exactly, but the sources are outdated. The answer is…', 'Faithful and wrong', 'Unfaithful and wrong', 'Unfaithful and right', 'Faithfulness compares the answer with the context, not with the truth.'],
    ['Faithfulness is high and correctness is low. Where do you look first?', 'Retrieval and source freshness', 'The generator’s temperature', 'The claim extractor’s model name', 'The generator used what it was given, so grade what it was given.'],
  ],
  'evals/trajectory-evals': [
    ['An agent gave the right answer but deleted a record on the way. What catches this?', 'Checking the end state of the environment', 'Comparing the final answer with a reference', 'Counting the tokens the agent used in total', 'Final-answer checks miss side effects. Also verify that nothing else changed.'],
    ['Why not require one exact sequence of tool calls?', 'Several different paths can be correct', 'Tool calls cannot be logged in a fixed order', 'Judges cannot read JSON arguments', 'Use must / must-not rules and argument checks, so that valid alternatives still pass.'],
  ],
  'evals/tracing': [
    ['A step produced nonsense. What do you read first in the trace?', 'What that step received as input', 'What the model provider changed last week', 'What the next step produced from it', 'Most faults are input faults: wrong chunks, a truncated history, a malformed tool result.'],
    ['You can only keep 5% of traces. Which policy loses the least?', 'Tail-sample: keep errors, slow traces and bad feedback', 'Head-sample: keep the first 5% of requests each day', 'Head-sample: pick 5% at random before each one runs', 'Head sampling throws away the rare traces you need. Decide after the outcome is known.'],
  ],
  /* ── System design ── */
  'system-design/model-routing': [
    ['Your router is unsure about a request. Which way should it lean?', 'To the larger model', 'To the smaller model', 'To whichever is least busy', 'A needless upgrade costs cents. A silent wrong answer costs trust, so misroutes are asymmetric.'],
    ['The cascade’s escalation rate rises from 15% to 60%. What follows?', 'You pay for both models on most requests', 'Latency improves, because the larger model is faster', 'The small model improves as it sees more hard cases', 'Escalated requests are charged twice and answered late. Past some rate, go straight to the larger model.'],
  ],
  'system-design/model-fallbacks': [
    ['Which error should fail fast with no retry?', '400 invalid request', '429 rate limited', '503 overloaded', 'Permanent errors fail the same way again. Retry only the transient ones, with jitter and `retry-after`.'],
    ['SDK, gateway and app each make up to 4 attempts. How many calls can one request cause?', 'Up to 64', 'Up to 12', 'Up to 4', '4 × 4 × 4. Retry in one layer, under a budget.'],
  ],
  'system-design/semantic-caching': [
    ['Why is a false hit worse than a miss?', 'It returns a wrong answer with no error', 'It costs more tokens than calling the model would', 'It evicts other entries from the whole cache', 'A miss only costs a model call. A false hit fails silently, so set the threshold from labelled pairs.'],
    ['User A sees user B’s account answer. Which control was missing?', 'A hard scope filter before similarity', 'A shorter TTL on personal answers', 'A much higher similarity threshold', 'Two users can ask identical questions. Scope by tenant and user first; similarity cannot separate them.'],
  ],
  'system-design/streaming-responses': [
    ['Streaming works on localhost and arrives in one block in production. Why?', 'A proxy on the path is buffering', 'The model generates more slowly in production', 'Server-sent events require HTTP/3 outside localhost', 'Every hop has to pass chunks unbuffered. Test the real URL with `curl -N`.'],
    ['The provider fails halfway through a stream. What does the client see?', 'HTTP 200 and an in-band error or a missing end event', 'HTTP 500, because the status is updated when it fails', 'HTTP 206 and an automatic retry by the browser', 'The status line has already been sent. A stream without a terminal event has failed.'],
  ],
  'system-design/context-management': [
    ['A long agent session degrades. What do you remove first?', 'Old tool results that can be fetched again', 'The system prompt, because the model has read it', 'The latest user message, because it is the newest', 'Clearing recoverable content loses nothing permanently. Compaction is lossy, so it comes second.'],
    ['What is the real cost of using a sub-agent?', 'More total tokens and a lossy handoff', 'A larger context window in the main agent', 'A slower embedding index for all agents', 'The main window stays clean, but the sub-agent starts from its brief and returns only a summary.'],
  ],
  /* ── Security ── */
  'security/prompt-injection': [
    ['Why can’t delimiters and role tags stop injection?', 'The model reads instructions and data as one token sequence', 'The tokenizer strips delimiters before the model sees them', 'Attackers can always find out which delimiters you use', 'Markers are a convention, not a boundary. Bound the damage in code.'],
    ['“Never reveal the discount code” is in the system prompt. What is the right fix?', 'Take the secret out of the prompt', 'Repeat the rule in capital letters', 'Add a longer refusal example', 'Assume the system prompt is public.'],
  ],
  'security/indirect-injection': [
    ['Which combination in one session is the dangerous one?', 'Private data, untrusted content and a way out', 'Long context, many tools and streaming output', 'Two models, one shared cache and long-term memory', 'With all three, an injected instruction can read and exfiltrate. Remove one leg.'],
    ['Your agent has no HTTP tool. Can it still leak data?', 'Yes, for example through a rendered image URL', 'No, because HTTP tools are the only way out of it', 'Only if a user pastes the private data into the chat', 'Images, links and email are exits too. Deny egress by default.'],
  ],
  'security/input-guardrails': [
    ['0.1% of traffic is attacks; the classifier has 1% false positives. Who gets blocked most?', 'Legitimate users, about ten to one', 'Attackers, about ten to one', 'Both about equally', 'Per 100,000 requests: at most 100 attacks caught, about 1,000 users blocked. Measure precision.'],
    ['How do you add a classifier without adding its full latency?', 'Run it in parallel and hold output until it clears', 'Run it after the answer is shown, then delete if needed', 'Run it on a random 10% of requests to save time', 'Work proceeds, but nothing leaves and no tool runs before the verdict.'],
  ],
  'security/pii-redaction': [
    ['You redact prompts. Where else is the personal data likely to survive?', 'Traces, datasets, caches and memory', 'Only in the weights of the hosted model', 'Nowhere, once the prompt is clean', 'Text is copied at every stage. Map every copy before you design the scrubbing.'],
    ['Why use typed placeholders such as [PERSON_1] and not ***?', 'The model keeps who is who, and you can restore it', 'They are shorter than asterisks when tokenized', 'Tokenizers reject repeated asterisks in a prompt', 'Consistent placeholders preserve meaning. The mapping stays in a short-lived vault.'],
  ],
  'security/least-privilege-tools': [
    ['Which tool is the safest design?', '`get_my_orders(limit)`, with the user taken from the session', '`run_sql(query)`, with strict rules in the system prompt', '`get_orders(user_id)`, with the id filled in by the model', 'Identity comes from the authenticated session and never from model output.'],
    ['What is the goal of least privilege for agents?', 'To bound the consequences of a bad decision', 'To guarantee the model decides correctly', 'To cut the number of tokens used', 'You cannot guarantee decisions. You can make the worst outcome survivable.'],
  ],
  /* ── Deployment ── */
  'deployment/docker': [
    ['Every code edit reinstalls all dependencies. What is wrong?', 'Code is copied before the dependencies are installed', 'The base image is too small to cache the dependencies', 'The container runs as root, so layers are never reused', 'A changed layer rebuilds everything after it. Copy the lockfile, install, and then copy the code.'],
    ['An API key was added in one layer and deleted in the next. Is it safe?', 'No, it is still in the earlier layer', 'Yes, deleting it removes it from the image', 'Yes, as long as the image stays private', 'Layers are immutable. Rotate the key and inject secrets at run time.'],
  ],
  'deployment/eval-gates-in-ci': [
    ['What should the gate compare?', 'This branch with main, on the same cases, per category', 'One raw average with a fixed minimum score for all branches', 'The latest run with the best run ever recorded', 'A per-category difference shows regressions that an average hides.'],
    ['The gate fails at random one time in five. What happens next?', 'People learn to bypass it', 'Quality improves', 'Nothing, reruns are free', 'Measure the noise, set the tolerance above it, and track false alarms as a metric.'],
  ],
  'deployment/canary-releases': [
    ['Why compare the canary with stable at the same time, not with last week?', 'Traffic mix and load change over time', 'Metrics from last week have already been deleted', 'Stable runs faster when a canary is live', 'A concurrent control removes outside changes. Keep assignment sticky by hash.'],
    ['A canary gets 50 requests a day. After one hour it looks fine. Do you promote?', 'No, there is too little data to see a regression', 'Yes, an hour without any errors shows that it is safe', 'Yes, but only for admins and internal testers', 'Low traffic means low statistical power. Soak time is part of the design.'],
  ],
  'deployment/prompt-versioning': [
    ['What exactly should a version contain?', 'Template, pinned model, parameters, tools and examples', 'The template text only, since the rest is configuration', 'The template, its author, and the date of the last edit', 'Any of these changes behaviour, so version the whole bundle.'],
    ['Production misbehaves after a prompt release. What is the fastest safe action?', 'Move the production label back to the last good version', 'Edit the published version in place and clear the caches', 'Redeploy the previous build of the whole application', 'Versions are immutable and labels move. The cache TTL is your rollback time.'],
  ],
};

/** A small stable hash, so the options keep the same order on the server and in the browser. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function questionsFor(lessonId: string): Question[] {
  return (bank[lessonId] ?? []).map(([question, right, wrong1, wrong2, why], i) => {
    const options = [wrong1, wrong2];
    const answer = hash(question) % 3;
    options.splice(answer, 0, right);
    return { id: `${lessonId}#${i}`, question, options, answer, why };
  });
}

export const quizLessonIds = Object.keys(bank);
