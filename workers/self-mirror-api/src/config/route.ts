import type { Env } from '../env';
import { json } from '../http';

export async function runtimeConfig(env: Env) {
  const rows = await env.DB.prepare('SELECT flag_key, enabled FROM feature_flags').all<{ flag_key: string; enabled: number }>();
  const flags = Object.fromEntries(rows.results.map((row) => [row.flag_key, row.enabled === 1]));
  return json({
    flags,
    doctrineVersion: env.DOCTRINE_VERSION,
    freeRequestLimit: Number(env.FREE_REQUEST_LIMIT),
  });
}
