import type { Env } from '../env';
import { requireFirebaseUser } from '../auth/firebase';
import { getEntitlement, requirePro } from '../entitlements/repository';
import { json, safeError } from '../http';
import { recordEvent } from '../observability/events';
import { createProvider } from '../providers/factory';
import { checkQuota, recordUsage } from '../quota/repository';
import { anonymousSubject, authenticatedSubject } from '../security/anonymous';
import { verifyTurnstile } from '../security/turnstile';
import { containsPromptInjectionSignal } from '../security/promptInjection';
import { buildSystemDoctrine } from './doctrine';
import { reflectionRequestSchema, reflectionResultSchema } from './schema';
import { immediateDangerResponse } from '../safety/immediateDanger';

const PRO_MODES = new Set(['mediator', 'abyss', 'builder']);

export async function reflect(request: Request, env: Env) {
  if (!(await verifyTurnstile(request, env))) return safeError('TURNSTILE_REQUIRED', 403);
  const parsed = reflectionRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    await recordEvent(env, 'validation_failed', 'reflection_request');
    return safeError('INVALID_REFLECTION_REQUEST', 400);
  }

  const latestUserText = [...parsed.data.messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  if (containsPromptInjectionSignal(latestUserText)) {
    await recordEvent(env, 'prompt_injection_detected', parsed.data.mode);
  }
  const danger = immediateDangerResponse(latestUserText, env.DOCTRINE_VERSION);
  if (danger) return json({ reflection: danger, requestId: crypto.randomUUID(), provider: 'safety-path', model: 'none', usage: { remaining: null, resetAt: null } });

  let uid: string | null = null;
  const authorization = request.headers.get('Authorization');
  if (authorization) uid = (await requireFirebaseUser(request, env)).uid;
  if (PRO_MODES.has(parsed.data.mode)) {
    if (!uid) return safeError('AUTH_REQUIRED', 401);
    await requirePro(env, uid);
  }

  const anon = uid ? null : await anonymousSubject(request, env);
  const subjectHash = uid ? await authenticatedSubject(uid, env) : anon!.subjectHash;
  const entitlement = uid ? await getEntitlement(env, uid) : null;
  const paid = entitlement ? ['pro', 'founder', 'admin'].includes(entitlement.plan) : false;
  const limit = Number(paid ? env.PRO_REQUEST_LIMIT : env.FREE_REQUEST_LIMIT);
  const quota = await checkQuota(env, subjectHash, parsed.data.mode, env.AI_PROVIDER, limit);
  if (!quota.allowed) {
    await recordEvent(env, 'quota_exceeded', parsed.data.mode, subjectHash);
    return json({ error: { code: 'QUOTA_EXCEEDED', message: 'Cloud reflection limit reached.' }, resetAt: quota.resetAt }, 429);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const provider = createProvider(env);
    const doctrine = buildSystemDoctrine(env.DOCTRINE_VERSION, parsed.data.mode);
    let result;
    try {
      result = await provider.reflect(parsed.data, doctrine, controller.signal);
    } catch (firstError) {
      if (controller.signal.aborted) throw firstError;
      result = await provider.reflect(parsed.data, `${doctrine}\nRepair the prior invalid response. Return every required field and JSON only.`, controller.signal);
    }
    const validated = reflectionResultSchema.parse({ ...result.data, doctrineVersion: env.DOCTRINE_VERSION });
    await recordUsage(env, subjectHash, parsed.data.mode, result.provider, quota.windowStartedAt, result.usage.inputTokens, result.usage.outputTokens);
    return json({
      reflection: validated,
      requestId: crypto.randomUUID(),
      provider: result.provider,
      model: result.model,
      usage: { remaining: Math.max(0, quota.remaining - 1), resetAt: quota.resetAt },
    }, 200, anon?.setCookie ? { 'Set-Cookie': anon.setCookie } : {});
  } catch (error) {
    if (controller.signal.aborted) await recordEvent(env, 'ai_timeout', parsed.data.mode, subjectHash);
    else await recordEvent(env, 'validation_failed', 'provider_response', subjectHash);
    return safeError('REFLECTION_UNAVAILABLE', 502);
  } finally {
    clearTimeout(timeout);
  }
}
