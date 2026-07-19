import type { Env } from '../env';

export type OperationalEvent =
  | 'ai_timeout'
  | 'quota_exceeded'
  | 'validation_failed'
  | 'prompt_injection_detected'
  | 'ollama_unavailable'
  | 'worker_exception'
  | 'stripe_webhook_processed'
  | 'stripe_webhook_failed';

export async function recordEvent(
  env: Env,
  eventType: OperationalEvent,
  resultCode: string,
  subjectHash: string | null = null,
) {
  await env.DB.prepare(
    `INSERT INTO operational_events (event_type, result_code, subject_hash, created_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(eventType, resultCode, subjectHash, Date.now()).run();
}
