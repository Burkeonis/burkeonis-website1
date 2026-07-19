import type { Env } from '../env';

export async function verifyTurnstile(request: Request, env: Env) {
  if (env.TURNSTILE_REQUIRED !== 'true') return true;
  const token = request.headers.get('X-Turnstile-Token');
  if (!token || !env.TURNSTILE_SECRET_KEY) return false;
  const body = new FormData();
  body.set('secret', env.TURNSTILE_SECRET_KEY);
  body.set('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}
