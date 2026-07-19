import type { MemoryItem, Session } from '../types';

const CONFIDENCE_SCORE = { low: 35, moderate: 60, high: 80 } as const;

export function memoryFromConfirmedReflection(
  session: Session,
  confirmation: 'yes' | 'partly' | 'no',
): MemoryItem | null {
  if (confirmation === 'no') return null;
  const assistant = [...session.messages].reverse().find(
    (message) => message.role === 'assistant' && message.meta?.reflection,
  );
  const reflection = assistant?.meta?.reflection;
  if (!reflection) return null;

  const facts = reflection.facts.slice(0, 4);
  const content = facts.length
    ? facts.join(' ')
    : 'The user confirmed this guided reflection, but the response contained no separately stated facts.';
  const baseConfidence = CONFIDENCE_SCORE[reflection.confidence];
  const confidence = confirmation === 'partly' ? Math.max(20, baseConfidence - 20) : baseConfidence;
  const hasSupportedPattern = reflection.patterns.length > 0
    && ['supported', 'strongly supported'].includes(reflection.evidenceLevel);

  return {
    id: `guided:${session.id}`,
    type: 'observation',
    content,
    whySaved: `User marked this guided observation ${confirmation.toUpperCase()}. Model evidence level: ${reflection.evidenceLevel}. Interpretations were not silently promoted to facts.`,
    sourceSessionId: session.id,
    sourceSessionTitle: session.title,
    dateSaved: new Date().toLocaleDateString(),
    confidence,
    evidenceCount: facts.length,
    firstObservedDate: session.date,
    lastObservedDate: session.date,
    insightLevel: confirmation === 'yes' && hasSupportedPattern ? 'Emerging Pattern' : 'Observation',
  };
}
