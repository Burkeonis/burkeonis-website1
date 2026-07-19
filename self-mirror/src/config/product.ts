export const DOCTRINE_VERSION = '1.0.0' as const;

export const PLAN_TIERS = ['free', 'plus', 'pro', 'founder', 'admin'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const featureFlags = {
  abyss: true,
  voice: false,
  ollama: false,
  billing: false,
  blog: false,
} as const;

export const PRODUCT_LIMITS = {
  freeCloudReflections: 5,
  freeWindowHours: 24,
} as const;
