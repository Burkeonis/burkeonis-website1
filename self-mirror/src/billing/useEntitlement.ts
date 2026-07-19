import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../auth/firebase';
import { getBillingStatus, type BillingStatus } from './api';

const FREE: BillingStatus = { plan: 'free', subscriptionStatus: 'none', currentPeriodEnd: null, cancelAtPeriodEnd: false };

export function useEntitlement() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [billing, setBilling] = useState<BillingStatus>(FREE);
  const [loading, setLoading] = useState(Boolean(auth?.currentUser));
  useEffect(() => auth ? onAuthStateChanged(auth, setUser) : undefined, []);
  useEffect(() => {
    if (!user) { setBilling(FREE); setLoading(false); return; }
    setLoading(true);
    void getBillingStatus(user).then(setBilling).catch(() => setBilling(FREE)).finally(() => setLoading(false));
  }, [user]);
  return { user, billing, loading, hasPro: ['pro', 'founder', 'admin'].includes(billing.plan) };
}
