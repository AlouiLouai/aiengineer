/** Interactive labs, by the lesson they belong to. One per area. The code is in components/labs. */
export interface LabInfo {
  title: string;
  blurb: string;
}

export const LABS: Record<string, LabInfo> = {
  'llm/temperature-top-p': {
    title: 'Sampling playground',
    blurb: 'Turn temperature and top-p, then draw tokens and watch the distribution answer back.',
  },
  'rag/chunking-strategies': {
    title: 'Chunk a returns policy',
    blurb: 'Change chunk size and overlap, and see whether the fact you need survives in one piece.',
  },
  'agents/agent-loop': {
    title: 'Reliability simulator',
    blurb: 'Run 100 agents at once and see how step count, step quality and retries compound.',
  },
  'evals/llm-as-a-judge': {
    title: 'Calibrate the judge',
    blurb: 'Move the pass mark and find out why raw agreement is a trap.',
  },
  'system-design/model-routing': {
    title: 'Tune a model router',
    blurb: 'Balance cost against silent failures across 120 requests.',
  },
  'security/prompt-injection': {
    title: 'Defence in depth',
    blurb: 'Fire six attacks and switch layers on until nothing gets through.',
  },
  'deployment/canary-releases': {
    title: 'Ship a bad release',
    blurb: 'Release a broken version to real traffic and see how many users a canary saves.',
  },
};
