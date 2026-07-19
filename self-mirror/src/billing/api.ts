import type { User } from 'firebase/auth';
import type { PlanTier } from '../config/product';

export interface BillingStatus {
  plan: PlanTier;
  subscriptionStatus: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}

async function authorizedFetch(user: User, path: string, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function getBillingStatus(user: User): Promise<BillingStatus> {
  const response = await authorizedFetch(user, '/api/self-mirror/billing/status');
  if (!response.ok) throw new Error('Billing status is temporarily unavailable.');
  const body = await response.json() as { entitlement: BillingStatus };
  return body.entitlement;
}

export async function startCheckout(user: User, cadence: 'monthly' | 'yearly') {
  const response = await authorizedFetch(user, '/api/self-mirror/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ cadence }),
  });
  if (!response.ok) throw new Error('Checkout could not be started.');
  const body = await response.json() as { url: string };
  window.location.assign(body.url);
}

export async function openBillingPortal(user: User) {
  const response = await authorizedFetch(user, '/api/self-mirror/billing/portal', { method: 'POST' });
  if (!response.ok) throw new Error('The billing portal could not be opened.');
  const body = await response.json() as { url: string };
  window.location.assign(body.url);
}
