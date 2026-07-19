import type { Env } from '../env';

export type Plan = 'free' | 'plus' | 'pro' | 'founder' | 'admin';

export interface Entitlement {
  plan: Plan;
  subscriptionStatus: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}

export async function getEntitlement(env: Env, uid: string): Promise<Entitlement> {
  const row = await env.DB.prepare(
    `SELECT plan, subscription_status, current_period_end, cancel_at_period_end
     FROM entitlements WHERE firebase_uid = ?`,
  ).bind(uid).first<{
    plan: Plan;
    subscription_status: string;
    current_period_end: number | null;
    cancel_at_period_end: number;
  }>();

  if (!row) return {
    plan: 'free',
    subscriptionStatus: 'none',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  const expired = row.current_period_end !== null && row.current_period_end * 1000 < Date.now();
  const active = ['active', 'trialing'].includes(row.subscription_status) && !expired;
  return {
    plan: active ? row.plan : 'free',
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end === 1,
  };
}

export async function requirePro(env: Env, uid: string) {
  const entitlement = await getEntitlement(env, uid);
  if (!['pro', 'founder', 'admin'].includes(entitlement.plan)) throw new Error('PRO_REQUIRED');
  return entitlement;
}
