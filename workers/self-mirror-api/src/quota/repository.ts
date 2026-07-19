import type { Env } from '../env';

const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function checkQuota(env: Env, subjectHash: string, feature: string, provider: string, limit: number) {
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT request_count, window_started_at, window_ends_at FROM usage_windows
     WHERE subject_hash = ? AND feature = ? AND provider = ? AND window_ends_at > ?
     ORDER BY window_started_at DESC LIMIT 1`,
  ).bind(subjectHash, feature, provider, now).first<{
    request_count: number; window_started_at: number; window_ends_at: number;
  }>();
  return {
    allowed: !row || row.request_count < limit,
    remaining: row ? Math.max(0, limit - row.request_count) : limit,
    resetAt: row?.window_ends_at ?? now + WINDOW_MS,
    windowStartedAt: row?.window_started_at ?? now,
  };
}

export async function recordUsage(
  env: Env,
  subjectHash: string,
  feature: string,
  provider: string,
  windowStartedAt: number,
  inputTokens: number,
  outputTokens: number,
) {
  const cost = Math.ceil(
    inputTokens * Number(env.INPUT_COST_MICROS_PER_MILLION) / 1_000_000
    + outputTokens * Number(env.OUTPUT_COST_MICROS_PER_MILLION) / 1_000_000,
  );
  await env.DB.prepare(
    `INSERT INTO usage_windows (
      subject_hash, feature, provider, window_started_at, window_ends_at,
      request_count, input_tokens, output_tokens, provider_cost_micros
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(subject_hash, feature, provider, window_started_at) DO UPDATE SET
      request_count = request_count + 1,
      input_tokens = input_tokens + excluded.input_tokens,
      output_tokens = output_tokens + excluded.output_tokens,
      provider_cost_micros = provider_cost_micros + excluded.provider_cost_micros`,
  ).bind(subjectHash, feature, provider, windowStartedAt, windowStartedAt + WINDOW_MS, inputTokens, outputTokens, cost).run();
}
