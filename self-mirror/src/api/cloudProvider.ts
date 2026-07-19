import { reflectionResultSchema } from '../schemas/reflection';
import type { AiProvider, ProviderResponse, ReflectionRequest } from '../providers/types';
import { cloudReflectionError, ReflectionUnavailableError } from './errors';

export interface BurkeonisCloudOptions {
  accessToken?: string | null;
  turnstileToken?: string | null;
}

export class BurkeonisCloudProvider implements AiProvider {
  readonly id = 'burkeonis-cloud' as const;
  constructor(private readonly options: BurkeonisCloudOptions = {}) {}

  async reflect(request: ReflectionRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    const response = await fetch('/api/self-mirror/reflections', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.accessToken ? { Authorization: `Bearer ${this.options.accessToken}` } : {}),
        ...(this.options.turnstileToken ? { 'X-Turnstile-Token': this.options.turnstileToken } : {}),
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) throw await cloudReflectionError(response);

    const payload: unknown = await response.json();
    const envelope = payload as Partial<ProviderResponse>;
    const parsed = reflectionResultSchema.safeParse(envelope.reflection);
    if (!parsed.success || !envelope.requestId || !envelope.provider) {
      throw new ReflectionUnavailableError();
    }

    return {
      reflection: parsed.data,
      requestId: envelope.requestId,
      provider: envelope.provider,
    };
  }
}
