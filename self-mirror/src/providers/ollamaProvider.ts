import { reflectionResultSchema } from '../schemas/reflection';
import type { AiProvider, ProviderResponse, ReflectionRequest } from './types';
import { ReflectionUnavailableError } from '../api/errors';

export interface OllamaOptions { baseUrl: string; model: string; }

const LOCAL_RULES = `Return JSON only with facts, patterns, possibilities, blindSpots, nextStep, confidence, evidenceLevel, limitations and doctrineVersion. Facts must come directly from supplied text. Interpretations must be labelled. Never diagnose or claim certainty about another person's intent. Never fabricate conclusions.`;

export class OllamaProvider implements AiProvider {
  readonly id = 'ollama' as const;
  constructor(private readonly options: OllamaOptions) {}

  async testConnection(signal?: AbortSignal) {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/api/tags`, { signal });
    if (!response.ok) throw new Error('Ollama responded but could not list models.');
    const body = await response.json() as { models?: Array<{ name: string }> };
    return body.models ?? [];
  }

  async reflect(request: ReflectionRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.options.model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: LOCAL_RULES },
          ...request.messages,
          { role: 'user', content: `Analyze in ${request.mode} mode. Doctrine version: ${request.doctrineVersion}.` },
        ],
      }),
      signal,
    });
    if (!response.ok) throw new ReflectionUnavailableError('Ollama could not complete this reflection. No cloud fallback was used.');
    const body = await response.json() as { message?: { content?: string } };
    let parsedJson: unknown;
    try { parsedJson = JSON.parse(body.message?.content ?? ''); } catch { throw new ReflectionUnavailableError('Ollama returned an invalid response. No cloud fallback was used.'); }
    const parsed = reflectionResultSchema.safeParse(parsedJson);
    if (!parsed.success) throw new ReflectionUnavailableError('Ollama returned an incomplete reflection. No cloud fallback was used.');
    return { reflection: parsed.data, requestId: crypto.randomUUID(), provider: `ollama:${this.options.model}` };
  }
}
