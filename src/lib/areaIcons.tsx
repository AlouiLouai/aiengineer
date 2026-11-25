import { Bot, BrainCircuit, Gauge, Layers, Rocket, Search, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { AreaId } from '@/content/types';

export const AREA_ICON: Record<AreaId, LucideIcon> = {
  llm: BrainCircuit,
  rag: Search,
  agents: Bot,
  evals: Gauge,
  'system-design': Layers,
  security: ShieldCheck,
  deployment: Rocket,
};
