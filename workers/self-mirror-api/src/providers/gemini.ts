import type { Env } from '../env';
import { reflectionResultSchema, type ReflectionRequest } from '../reflection/schema';
import type { AiProvider, ProviderResult } from './types';

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

export class GeminiProvider implements AiProvider {
  constructor(private readonly env: Env) {}

  async reflect(request: ReflectionRequest, doctrine: string, signal: AbortSignal): Promise<ProviderResult> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.env.AI_MODEL)}:generateContent`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: doctrine }] },
        contents: request.messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1_800,
          temperature: 0.35,
        },
      }),
      signal,
    });
    if (!response.ok) throw new Error('PROVIDER_FAILURE');
    const payload = await response.json() as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('PROVIDER_EMPTY');
    let raw: unknown;
    try { raw = JSON.parse(text); } catch { throw new Error('PROVIDER_INVALID_JSON'); }
    const parsed = reflectionResultSchema.safeParse(raw);
    if (!parsed.success) throw new Error('PROVIDER_INVALID_SCHEMA');
    return {
      data: parsed.data,
      provider: 'gemini',
      model: this.env.AI_MODEL,
      usage: {
        inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
