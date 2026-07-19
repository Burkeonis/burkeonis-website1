import type { Env } from '../env';
import { reflectionResultSchema, type ReflectionRequest } from '../reflection/schema';
import type { AiProvider, ProviderResult } from './types';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export class AnthropicProvider implements AiProvider {
  constructor(private readonly env: Env) {}
  async reflect(request: ReflectionRequest, doctrine: string, signal: AbortSignal): Promise<ProviderResult> {
    if (!this.env.ANTHROPIC_API_KEY) throw new Error('PROVIDER_NOT_CONFIGURED');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.env.AI_MODEL,
        system: doctrine,
        max_tokens: 1_800,
        temperature: 0.35,
        messages: request.messages,
      }),
      signal,
    });
    if (!response.ok) throw new Error('PROVIDER_FAILURE');
    const payload = await response.json() as AnthropicResponse;
    const text = payload.content?.find((item) => item.type === 'text')?.text;
    if (!text) throw new Error('PROVIDER_EMPTY');
    const normalized = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = reflectionResultSchema.safeParse(JSON.parse(normalized));
    if (!parsed.success) throw new Error('PROVIDER_INVALID_SCHEMA');
    return { data: parsed.data, provider: 'anthropic', model: this.env.AI_MODEL, usage: { inputTokens: payload.usage?.input_tokens ?? 0, outputTokens: payload.usage?.output_tokens ?? 0 } };
  }
}
