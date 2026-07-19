import type { ReflectionRequest, ReflectionResult } from '../reflection/schema';

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ProviderResult {
  data: ReflectionResult;
  provider: string;
  model: string;
  usage: ProviderUsage;
}

export interface AiProvider {
  reflect(request: ReflectionRequest, doctrine: string, signal: AbortSignal): Promise<ProviderResult>;
}
