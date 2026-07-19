import type { Env } from '../env';
import { GeminiProvider } from './gemini';
import { OpenAiProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import type { AiProvider } from './types';

export function createProvider(env: Env): AiProvider {
  if (env.AI_PROVIDER === 'gemini') return new GeminiProvider(env);
  if (env.AI_PROVIDER === 'openai') return new OpenAiProvider(env);
  if (env.AI_PROVIDER === 'anthropic') return new AnthropicProvider(env);
  throw new Error('PROVIDER_NOT_CONFIGURED');
}
