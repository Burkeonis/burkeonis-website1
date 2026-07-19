import { z } from 'zod';

export const modeSchema = z.enum(['mirror', 'mediator', 'abyss', 'builder']);
export const reflectionRequestSchema = z.object({
  mode: modeSchema.default('mirror'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8_000),
  })).min(1).max(20),
  doctrineVersion: z.string().max(32).optional(),
});

export const reflectionResultSchema = z.object({
  facts: z.array(z.string()).max(12),
  patterns: z.array(z.string()).max(8),
  possibilities: z.array(z.string()).max(8),
  blindSpots: z.array(z.string()).max(6),
  nextStep: z.string().min(1).max(1_200),
  confidence: z.enum(['low', 'moderate', 'high']),
  evidenceLevel: z.enum(['insufficient', 'limited', 'supported', 'strongly supported']),
  limitations: z.array(z.string()).max(8),
  doctrineVersion: z.string().min(1).max(32),
});

export type ReflectionRequest = z.infer<typeof reflectionRequestSchema>;
export type ReflectionResult = z.infer<typeof reflectionResultSchema>;
