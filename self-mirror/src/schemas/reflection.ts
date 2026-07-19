import { z } from 'zod';

export const confidenceSchema = z.enum(['low', 'moderate', 'high']);
export const evidenceLevelSchema = z.enum([
  'insufficient',
  'limited',
  'supported',
  'strongly supported',
]);

export const reflectionResultSchema = z.object({
  facts: z.array(z.string()).max(12),
  patterns: z.array(z.string()).max(8),
  possibilities: z.array(z.string()).max(8),
  blindSpots: z.array(z.string()).max(6),
  nextStep: z.string().min(1).max(1200),
  confidence: confidenceSchema,
  evidenceLevel: evidenceLevelSchema,
  limitations: z.array(z.string()).max(8),
  doctrineVersion: z.string().min(1),
});

export type ReflectionResult = z.infer<typeof reflectionResultSchema>;
