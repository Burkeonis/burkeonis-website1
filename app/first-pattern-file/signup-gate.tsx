"use client";

import { useEffect } from "react";

type SenderQueue = ((accountId: string) => void) & { q?: unknown[][]; l?: number };

declare global {
  interface Window { sender?: SenderQueue }
}

const SENDER_ACCOUNT_ID = "b07de66e2b6147";

export default function SignupGate() {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-burkeonis-sender="true"]');

    if (!window.sender) {
      const sender = ((...args: unknown[]) => {
        sender.q = sender.q || [];
        sender.q.push(args);
      }) as SenderQueue;
      sender.l = Date.now();
      window.sender = sender;
    }

    const initialize = () => window.sender?.(SENDER_ACCOUNT_ID);
    if (existing) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.sender.net/accounts_resources/universal.js";
    script.dataset.burkeonisSender = "true";
    script.addEventListener("load", initialize, { once: true });
    document.head.appendChild(script);
  }, []);

  return (
    <div className="checkout-card pfc-gate" id="get-the-file">
      <p className="checkout-label">Free download · delivered immediately</p>
      <h3 className="pfc-gate-title">Put the pattern on the table.</h3>
      <p className="checkout-copy">Enter your email. The complete Pattern Autopsy opens immediately, and Burkeonis Field Notes follow only when there is something worth saying.</p>
      <div className="sender-form-field" data-sender-form-id="en53v4" style={{ textAlign: "left" }} />
      <noscript><p className="checkout-status">JavaScript is required to open the signup form.</p></noscript>
    </div>
  );
}
