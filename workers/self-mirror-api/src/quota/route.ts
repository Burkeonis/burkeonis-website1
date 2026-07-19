import type { Env } from '../env';
import { requireFirebaseUser } from '../auth/firebase';
import { getEntitlement } from '../entitlements/repository';
import { json } from '../http';
import { anonymousSubject, authenticatedSubject } from '../security/anonymous';
import { checkQuota } from './repository';

export async function quotaStatus(request: Request, env: Env) {
  const url = new URL(request.url);
  const feature = ['mirror', 'mediator', 'abyss', 'builder'].includes(url.searchParams.get('feature') ?? '')
    ? url.searchParams.get('feature')!
    : 'mirror';
  const authorization = request.headers.get('Authorization');
  const user = authorization ? await requireFirebaseUser(request, env) : null;
  const anon = user ? null : await anonymousSubject(request, env);
  const subjectHash = user ? await authenticatedSubject(user.uid, env) : anon!.subjectHash;
  const entitlement = user ? await getEntitlement(env, user.uid) : null;
  const paid = entitlement ? ['pro', 'founder', 'admin'].includes(entitlement.plan) : false;
  const limit = Number(paid ? env.PRO_REQUEST_LIMIT : env.FREE_REQUEST_LIMIT);
  const quota = await checkQuota(env, subjectHash, feature, env.AI_PROVIDER, limit);
  return json({ limit, remaining: quota.remaining, resetAt: quota.resetAt }, 200, anon?.setCookie ? { 'Set-Cookie': anon.setCookie } : {});
}
