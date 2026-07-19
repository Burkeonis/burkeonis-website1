import type { Env } from '../env';
import { reflectionResultSchema, type ReflectionRequest } from '../reflection/schema';
import type { AiProvider, ProviderResult } from './types';

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenAiProvider implements AiProvider {
  constructor(private readonly env: Env) {}
  async reflect(request: ReflectionRequest, doctrine: string, signal: AbortSignal): Promise<ProviderResult> {
    if (!this.env.OPENAI_API_KEY) throw new Error('PROVIDER_NOT_CONFIGURED');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: this.env.AI_MODEL,
        response_format: { type: 'json_object' },
        max_completion_tokens: 1_800,
        temperature: 0.35,
        messages: [{ role: 'system', content: doctrine }, ...request.messages],
      }),
      signal,
    });
    if (!response.ok) throw new Error('PROVIDER_FAILURE');
    const payload = await response.json() as OpenAiResponse;
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error('PROVIDER_EMPTY');
    const parsed = reflectionResultSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new Error('PROVIDER_INVALID_SCHEMA');
    return { data: parsed.data, provider: 'openai', model: this.env.AI_MODEL, usage: { inputTokens: payload.usage?.prompt_tokens ?? 0, outputTokens: payload.usage?.completion_tokens ?? 0 } };
  }
}
