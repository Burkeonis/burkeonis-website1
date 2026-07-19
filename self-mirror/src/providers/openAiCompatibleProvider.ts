import { reflectionResultSchema } from '../schemas/reflection';
import { ReflectionUnavailableError } from '../api/errors';
import type { AiProvider, ProviderResponse, ReflectionRequest } from './types';

export interface OpenAiCompatibleOptions { baseUrl: string; model: string; apiKey: string; }

const PUBLIC_RULES = `Return JSON only with facts, patterns, possibilities, blindSpots, nextStep, confidence, evidenceLevel, limitations and doctrineVersion. Never diagnose, fabricate evidence, or claim certainty about another person's intentions. Interpretations are possibilities, not facts.`;

export class OpenAiCompatibleProvider implements AiProvider {
  readonly id = 'byok' as const;
  constructor(private readonly options: OpenAiCompatibleOptions) {}
  async reflect(request: ReflectionRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    if (!this.options.apiKey) throw new ReflectionUnavailableError('Your session-only API key is missing. No cloud fallback was used.');
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.options.apiKey}` },
      body: JSON.stringify({
        model: this.options.model,
        response_format: { type: 'json_object' },
        temperature: 0.35,
        messages: [{ role: 'system', content: PUBLIC_RULES }, ...request.messages],
      }),
      signal,
    });
    if (!response.ok) throw new ReflectionUnavailableError('Your API provider rejected the request. No Burkeonis cloud fallback was used.');
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    let raw: unknown;
    try { raw = JSON.parse(body.choices?.[0]?.message?.content ?? ''); } catch { throw new ReflectionUnavailableError('Your provider returned invalid JSON. No cloud fallback was used.'); }
    const parsed = reflectionResultSchema.safeParse(raw);
    if (!parsed.success) throw new ReflectionUnavailableError('Your provider returned an incomplete reflection. No cloud fallback was used.');
    return { reflection: parsed.data, requestId: crypto.randomUUID(), provider: `byok:${new URL(this.options.baseUrl).hostname}` };
  }
}
