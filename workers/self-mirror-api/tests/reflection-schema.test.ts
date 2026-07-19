import { describe, expect, it } from 'vitest';
import { reflectionRequestSchema, reflectionResultSchema } from '../src/reflection/schema';

describe('reflection schemas', () => {
  it('accepts the bounded structured contract', () => {
    expect(reflectionResultSchema.parse({
      facts: ['The user said they left.'],
      patterns: [],
      possibilities: ['This may be avoidance.'],
      blindSpots: [],
      nextStep: 'Write down what happened before interpreting it.',
      confidence: 'low',
      evidenceLevel: 'limited',
      limitations: ['Only one reflection was supplied.'],
      doctrineVersion: '1.0.0',
    }).confidence).toBe('low');
  });

  it('rejects arbitrary confidence percentages', () => {
    const result = reflectionResultSchema.safeParse({
      facts: [], patterns: [], possibilities: [], blindSpots: [], nextStep: 'Pause.',
      confidence: 75, evidenceLevel: 'limited', limitations: [], doctrineVersion: '1.0.0',
    });
    expect(result.success).toBe(false);
  });

  it('rejects oversized user input', () => {
    const result = reflectionRequestSchema.safeParse({
      mode: 'mirror',
      messages: [{ role: 'user', content: 'x'.repeat(8_001) }],
    });
    expect(result.success).toBe(false);
  });
});
