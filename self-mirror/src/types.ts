import type { ReflectionResult } from './schemas/reflection';

export interface MessageMeta {
  contradiction: string | null;
  shadowPattern: {
    wound: string;
    weapon: string;
    description: string;
  } | null;
  defenseIntensity: number; // 0 - 100
  avoidedQuestion: string | null;
  // Evidence metrics
  evidenceCount?: number;
  confidence?: number;
  insightLevel?: 'Observation' | 'Possible Pattern' | 'Emerging Pattern' | 'Repeating Pattern';
  reflection?: ReflectionResult;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  meta?: MessageMeta;
}

export interface GuidedFlow {
  currentStepIndex: number; // 0 to 5 (or -1 if not guided or completed)
  answers: {
    happened: string;
    felt: string;
    did: string;
    wanted: string;
    avoided: string;
  };
  observation?: string;
  confirmation?: 'yes' | 'partly' | 'no' | null;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  activeAbyssTopic?: string | null;
  summary?: string;
  intensityMax?: number;
  guidedFlow?: GuidedFlow; // Guided step-by-step reflection state
  mode?: 'mirror' | 'mediator' | 'abyss' | 'builder';
}

export interface MirrorTestResult {
  strongestTrait: {
    title: string;
    desc: string;
    detail: string;
  };
  repeatingWeakness: {
    title: string;
    desc: string;
    detail: string;
  };
  hiddenFear: {
    title: string;
    desc: string;
    detail: string;
  };
  avoidancePattern: {
    title: string;
    desc: string;
    detail: string;
  };
  unrealizedPotential: {
    title: string;
    desc: string;
    detail: string;
  };
  nextEvolution: {
    title: string;
    desc: string;
    detail: string;
  };
  summaryText: string;
  createdAt: string;
  confidence: number;
}

export interface MemoryItem {
  id: string;
  type: 'trigger' | 'contradiction' | 'shadow-swap' | 'observation' | 'pattern';
  content: string;
  whySaved: string;
  sourceSessionId: string;
  sourceSessionTitle: string;
  dateSaved: string;
  confidence: number; // confidence percentage (e.g., 46)
  evidenceCount: number;
  firstObservedDate: string;
  lastObservedDate: string;
  insightLevel: 'Observation' | 'Possible Pattern' | 'Emerging Pattern' | 'Repeating Pattern';
}

export interface UserProfile {
  name: string;
  repeatingTriggersCount: number;
  emotionalReactionsCount: number;
  corePatternsCount: number;
  breakthroughsCount: number;
  recentTriggers: { text: string; date: string }[];
  shadowSwaps: { wound: string; weapon: string; context: string }[];
  isMemoryEnabled: boolean;
}

export type AbyssTopicId = 'fear' | 'relationships' | 'identity' | 'ambition' | 'shadow';

export interface AbyssTopic {
  id: AbyssTopicId;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  initialQuestion: string;
}
