import { describe, expect, it } from 'vitest';
import type { Session } from '../types';
import { memoryFromConfirmedReflection } from './memoryEngine';

const session: Session = {
  id: 'session-1',
  title: 'Guided Reflection 1',
  date: '2026-07-19',
  messages: [{
    id: 'assistant-1',
    role: 'assistant',
    content: 'Structured reflection',
    timestamp: 'Just now',
    meta: {
      contradiction: null,
      shadowPattern: null,
      defenseIntensity: 0,
      avoidedQuestion: 'Pause before responding.',
      reflection: {
        facts: ['The user said they raised their voice.', 'The user said they wanted to be heard.'],
        patterns: ['Escalation may follow feeling dismissed.'],
        possibilities: [],
        blindSpots: [],
        nextStep: 'Pause before responding.',
        confidence: 'moderate',
        evidenceLevel: 'supported',
        limitations: ['Only one account is available.'],
        doctrineVersion: '1.0.0',
      },
    },
  }],
};

describe('confirmed guided memory', () => {
  it('stores fact-based memory only after affirmative confirmation', () => {
    const memory = memoryFromConfirmedReflection(session, 'yes');
    expect(memory?.id).toBe('guided:session-1');
    expect(memory?.content).toContain('raised their voice');
    expect(memory?.insightLevel).toBe('Emerging Pattern');
    expect(memory?.whySaved).toContain('User marked this guided observation YES');
  });

  it('reduces confidence for partial confirmation and stores nothing for rejection', () => {
    expect(memoryFromConfirmedReflection(session, 'partly')?.confidence).toBe(40);
    expect(memoryFromConfirmedReflection(session, 'no')).toBeNull();
  });
});
