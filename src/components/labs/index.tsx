'use client';

import type { ComponentType } from 'react';
import { CanaryLab } from './CanaryLab';
import { ChunkingLab } from './ChunkingLab';
import { DefenceLab } from './DefenceLab';
import { JudgeLab } from './JudgeLab';
import { ReliabilityLab } from './ReliabilityLab';
import { RouterLab } from './RouterLab';
import { SamplingLab } from './SamplingLab';

const LAB_COMPONENTS: Record<string, ComponentType> = {
  'llm/temperature-top-p': SamplingLab,
  'rag/chunking-strategies': ChunkingLab,
  'agents/agent-loop': ReliabilityLab,
  'evals/llm-as-a-judge': JudgeLab,
  'system-design/model-routing': RouterLab,
  'security/prompt-injection': DefenceLab,
  'deployment/canary-releases': CanaryLab,
};

export const LAB_IDS = Object.keys(LAB_COMPONENTS);

/** The lab for a lesson. Loaded on demand. */
export default function Lab({ id }: { id: string }) {
  const Component = LAB_COMPONENTS[id];
  return Component ? <Component /> : null;
}
