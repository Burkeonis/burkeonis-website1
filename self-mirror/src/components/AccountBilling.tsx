import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerWithEmail, resetPassword, signInWithEmail, signInWithGoogle, signOutUser } from '../auth/firebase';
import { getBillingStatus, openBillingPortal, startCheckout, type BillingStatus } from '../billing/api';
import LocalAiSettings from './LocalAiSettings';
import BackupControls from './BackupControls';
import AccessibilityPrivacy from './AccessibilityPrivacy';

export default function AccountBilling() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => auth ? onAuthStateChanged(auth, setUser) : undefined, []);

  useEffect(() => {
    if (!user) { setBilling(null); return; }
    void getBillingStatus(user).then(setBilling).catch(() => setMessage('Billing status is unavailable until the test Worker is configured.'));
  }, [user]);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    setMessage('');
    try { await action(); if (success) setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The request failed.'); }
    finally { setBusy(false); }
  };

  const period = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd * 1000).toLocaleDateString()
    : null;

  return (
    <section className="mx-auto max-w-4xl space-y-8 py-4">
      <header className="border-b border-white/10 pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-500">Identity / Entitlement</span>
        <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-wider text-white">Account & Billing</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">Your reflections stay on this device. Authentication identifies your subscription; it does not upload your conversation history.</p>
      </header>

      {!auth && (
        <div role="alert" className="border border-amber-800/60 bg-amber-950/20 p-5 text-sm text-amber-100">Firebase test configuration has not been added yet. Local Free mode remains available.</div>
      )}

      {auth && !user && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 border border-white/10 bg-black/40 p-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white">Email access</h3>
            <label className="block text-xs text-gray-400">Email<input className="mt-2 w-full border border-white/10 bg-[#080909] p-3 text-white" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block text-xs text-gray-400">Password<input className="mt-2 w-full border border-white/10 bg-[#080909] p-3 text-white" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} className="bg-amber-700 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-50" onClick={() => run(() => signInWithEmail(email, password))}>Sign in</button>
              <button disabled={busy} className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-200 disabled:opacity-50" onClick={() => run(() => registerWithEmail(email, password))}>Create account</button>
              <button disabled={busy || !email} className="px-2 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-400 disabled:opacity-50" onClick={() => run(() => resetPassword(email), 'Password reset email sent.')}>Reset password</button>
            </div>
          </div>
          <div className="flex flex-col justify-center border border-white/10 bg-[#0b0c0c] p-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white">Google</h3>
            <p className="my-4 text-sm leading-relaxed text-gray-400">Use Google only for identity and subscription restoration. Private reflection content remains local.</p>
            <button disabled={busy} className="border border-amber-700 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-amber-300 disabled:opacity-50" onClick={() => run(signInWithGoogle)}>Continue with Google</button>
          </div>
        </div>
      )}

      {user && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 border border-white/10 bg-black/40 p-6 sm:flex-row sm:items-center">
            <div><span className="font-mono text-[9px] uppercase tracking-widest text-gray-500">Signed in</span><p className="mt-1 text-white">{user.email ?? 'Verified Firebase user'}</p></div>
            <button className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-300" onClick={() => run(signOutUser)}>Sign out</button>
          </div>

          <div className="border border-amber-800/40 bg-[#0b0c0c] p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div><span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">Current access</span><h3 className="mt-2 text-2xl font-bold uppercase text-white">{billing?.plan ?? 'Checking…'}</h3><p className="mt-2 text-sm text-gray-400">Status: {billing?.subscriptionStatus ?? 'unavailable'}{period ? ` · period ends ${period}` : ''}{billing?.cancelAtPeriodEnd ? ' · cancels at period end' : ''}</p></div>
              {billing && ['pro', 'founder', 'admin'].includes(billing.plan) && <button disabled={busy} className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white" onClick={() => run(() => openBillingPortal(user))}>Manage subscription</button>}
            </div>
          </div>

          {billing?.plan !== 'pro' && billing?.plan !== 'founder' && billing?.plan !== 'admin' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button disabled={busy} className="border border-amber-700 bg-amber-950/20 p-6 text-left disabled:opacity-50" onClick={() => run(() => startCheckout(user, 'monthly'))}><strong className="block uppercase text-white">Self Mirror Pro Monthly</strong><span className="mt-2 block text-sm text-gray-400">Stripe test-mode subscription. Final price appears securely in Checkout.</span></button>
              <button disabled={busy} className="border border-amber-700 bg-amber-950/20 p-6 text-left disabled:opacity-50" onClick={() => run(() => startCheckout(user, 'yearly'))}><strong className="block uppercase text-white">Self Mirror Pro Yearly</strong><span className="mt-2 block text-sm text-gray-400">Stripe test-mode subscription. Final price appears securely in Checkout.</span></button>
            </div>
          )}
        </div>
      )}

      {message && <p role="status" className="border-l-2 border-amber-600 bg-amber-950/20 p-4 text-sm text-gray-200">{message}</p>}
      <LocalAiSettings />
      <BackupControls />
      <AccessibilityPrivacy />
      <p className="text-xs leading-relaxed text-gray-500">Test mode only. Self Mirror never asks for card details directly; Stripe Checkout handles payment information.</p>
    </section>
  );
}
