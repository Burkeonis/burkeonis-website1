import type { ReflectionResult } from '../schemas/reflection';

export type ProviderId = 'burkeonis-cloud' | 'byok' | 'ollama';

export interface ReflectionRequest {
  mode: 'mirror' | 'mediator' | 'abyss' | 'builder';
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  doctrineVersion: string;
}

export interface ProviderResponse {
  reflection: ReflectionResult;
  requestId: string;
  provider: string;
}

export interface AiProvider {
  readonly id: ProviderId;
  reflect(request: ReflectionRequest, signal?: AbortSignal): Promise<ProviderResponse>;
}
