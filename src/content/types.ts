/**
 * The lesson format.
 *
 * A lesson is a list of steps. Each step has a little prose for the guide column and a
 * picture for the stage. The picture is meant to carry the idea on its own: blocks light
 * up, packets travel carrying their payload, chips and gauges change, and the metrics
 * strip above the stage updates. Prose strings support two inline marks: **bold** and `code`.
 */

export type AreaId = 'llm' | 'rag' | 'agents' | 'evals' | 'system-design' | 'security' | 'deployment';

export type Level = 'beginner' | 'intermediate' | 'advanced';

/**
 * Colour meaning, used the same way everywhere:
 * neutral = a request going out · ok = a good response / success · accent = data or context
 * being moved · warn = slow, costly or risky · bad = failure, attack or blocked.
 */
export type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad';

export type NodeKind =
  | 'user' // a person
  | 'app' // your own service / backend
  | 'model' // an LLM or embedding model
  | 'agent' // a model running in a loop with tools
  | 'db' // database, index, store (drawn as a cylinder)
  | 'doc' // document, prompt, file, result (drawn as a flat slab)
  | 'tool' // a function / tool the model can call
  | 'guard' // a check, gate, filter, validator
  | 'cache' // a cache (drawn as a cylinder)
  | 'judge' // grader, evaluator, monitor
  | 'queue' // router, splitter, gateway, queue
  | 'cloud'; // an external service or the outside world

/**
 * How a block is drawn in one step.
 * hot = the thing to look at now (glowing base) · ok = green tick · warn = amber "!"
 * bad = red cross · off = dimmed and dashed (down, skipped, not used).
 */
export type NodeState = 'hot' | 'ok' | 'warn' | 'bad' | 'off';

export interface SceneNode {
  id: string;
  /** Short name shown in a pill under the block. Keep it under ~16 characters. */
  label: string;
  kind: NodeKind;
  /** Grid position: column 0–4 and row 0–2. Fractions are allowed. Keep neighbours ≥ 1 apart. */
  col: number;
  row: number;
}

/** [from, to, label?] — a plain connection with no packet. */
type LinkSpec = [from: string, to: string, label?: string];

/**
 * [from, to, tone?, payload?, end?] — a packet that travels the connection carrying its
 * payload chip. Flows play one after another, in order, so their order tells the story.
 * end = 'block' makes the packet stop short of the target with a red cross.
 */
export type FlowSpec = [from: string, to: string, tone?: Tone, payload?: string, end?: 'block'];

export interface Scene {
  /** Blocks to show. Defaults to every block this step mentions (or all, if it mentions none). */
  show?: string[];
  links?: LinkSpec[];
  flows?: FlowSpec[];
  state?: Record<string, NodeState>;
  /** A chip above a block, for this step: a value, a status, a fact. Under ~22 characters. */
  note?: Record<string, string | [text: string, tone: Tone]>;
  /** A gauge chip beside a block: 0–100, optionally with its own text (e.g. [92, '184k / 200k']). */
  meter?: Record<string, number | [value: number, text: string]>;
}

export interface TokenChip {
  text: string;
  tone?: Tone;
  /** Small caption under the chip, e.g. a token id. */
  sub?: string;
}

export interface Bar {
  label: string;
  /** 0–100 */
  value: number;
  tone?: Tone;
  /** Text shown at the end of the bar. Defaults to the value. */
  display?: string;
}

type CalloutKind = 'tip' | 'warn' | 'insight';

/** What role a step plays; shown as a badge on the guide card. */
export type StepKind = 'problem' | 'idea' | 'technique' | 'pitfall' | 'tradeoff' | 'recap';

export interface Step {
  /** One or two words for the timeline under the stage, e.g. "Cache hit". Max ~12 characters. */
  short: string;
  kind: StepKind;
  title: string;
  /** One or two short paragraphs. The picture should already tell the story. */
  body: string[];
  scene?: Scene;
  tokens?: { caption?: string; items: TokenChip[] };
  bars?: { caption?: string; items: Bar[] };
  callout?: [kind: CalloutKind, text: string];
  /** A practitioner's note: a number, a failure mode or a rule of thumb from production. */
  pro?: string;
  /** Lines starting with "+" are gains, "-" are costs, anything else is neutral. */
  changes?: string[];
  /**
   * New values for the lesson's metric tiles, by key. A value stays until a later step
   * changes it, so only list what changes in this step.
   */
  metrics?: Record<string, string | [value: string, tone: Tone]>;
}

export interface Lesson {
  slug: string;
  area: AreaId;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  /** 3–5 outcomes. They are ticked off on screen as the reader moves through the steps. */
  goals: string[];
  /** The 3–5 tiles above the stage: [key, label]. Steps fill them in via `metrics`. */
  metrics?: Array<[key: string, label: string]>;
  nodes?: SceneNode[];
  steps: Step[];
  takeaways: string[];
}

export interface Concept {
  title: string;
  /** Set when the concept has a finished lesson. */
  slug?: string;
}

export interface Area {
  id: AreaId;
  number: string;
  title: string;
  tagline: string;
  blurb: string;
  concepts: Concept[];
}

/** Shorthand for declaring a scene block. */
export const n = (id: string, label: string, kind: NodeKind, col: number, row: number): SceneNode => ({
  id,
  label,
  kind,
  col,
  row,
});
