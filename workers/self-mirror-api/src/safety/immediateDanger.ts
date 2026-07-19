import type { ReflectionResult } from '../reflection/schema';

const immediateTime = /\b(now|right now|tonight|today|immediately|in the next (few )?(minutes|hours))\b/i;
const selfHarmIntent = /\b(i am going to|i'm going to|i will|i intend to|i plan to)\b.{0,50}\b(kill myself|end my life|suicide)\b/i;
const otherHarmIntent = /\b(i am going to|i'm going to|i will|i intend to|i plan to)\b.{0,50}\b(kill|shoot|stab|seriously hurt)\b.{0,50}\b(him|her|them|someone|my partner|my family)\b/i;
const physicalEmergency = /\b(can't breathe|cannot breathe|severe chest pain|overdosed|overdose|uncontrolled bleeding)\b/i;

export function immediateDangerResponse(text: string, doctrineVersion: string): ReflectionResult | null {
  const imminentIntent = immediateTime.test(text) && (selfHarmIntent.test(text) || otherHarmIntent.test(text));
  if (!imminentIntent && !physicalEmergency.test(text)) return null;
  return {
    facts: ['Your message contains a direct signal of possible immediate danger.'],
    patterns: [],
    possibilities: [],
    blindSpots: [],
    nextStep: 'Stop this reflection and contact local emergency services now, or go to the nearest emergency department. If another person may be harmed, create distance from them and from any weapon while help is contacted. Ask a trusted person nearby to stay with you if that can be done safely.',
    confidence: 'high',
    evidenceLevel: 'supported',
    limitations: ['Self Mirror cannot verify your location or provide emergency intervention.', 'Self Mirror is not emergency, medical, or crisis support.'],
    doctrineVersion,
  };
}
