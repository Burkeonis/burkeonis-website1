import { describe, expect, it } from 'vitest';
import { immediateDangerResponse } from '../src/safety/immediateDanger';

describe('immediate danger pathway', () => {
  it('does not classify ordinary anger or dark writing as an emergency', () => {
    expect(immediateDangerResponse('I am furious and writing a dark song about death.', '1.0.0')).toBeNull();
  });

  it('interrupts explicit imminent self-harm intent', () => {
    const result = immediateDangerResponse('I am going to kill myself right now.', '1.0.0');
    expect(result?.nextStep).toContain('emergency services');
    expect(result?.patterns).toEqual([]);
  });

  it('interrupts a direct physical emergency signal', () => {
    expect(immediateDangerResponse('I cannot breathe and I overdosed.', '1.0.0')).not.toBeNull();
  });
});
