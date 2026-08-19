"use client";

import { useState } from "react";
import { trackPatternFilesEvent } from "./analytics";

export default function CheckoutButton() {
  const [addShadowWork, setAddShadowWork] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setStatus(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "pattern-files-core", addShadowWork }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok || !payload.checkoutUrl) {
        trackPatternFilesEvent("pattern_files_checkout_unavailable", addShadowWork);
        setStatus(payload.error ?? "Checkout could not be started. Please try again.");
        return;
      }

      trackPatternFilesEvent("pattern_files_checkout_started", addShadowWork);
      window.location.assign(payload.checkoutUrl);
    } catch {
      trackPatternFilesEvent("pattern_files_checkout_unavailable", addShadowWork);
      setStatus("Checkout could not be started. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="checkout-card" id="checkout">
      <p className="checkout-label">One-time digital download</p>
      <div className="checkout-price"><span>$</span>24<small>CAD</small></div>
      <p className="checkout-copy">Five core case files. One direct way to examine the patterns you keep calling bad luck.</p>
      <label className="order-bump" htmlFor="shadow-work-bump">
        <input
          checked={addShadowWork}
          id="shadow-work-bump"
          onChange={(event) => setAddShadowWork(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>Add the Shadow Work Protocol for $7 CAD</strong>
          <small>A separate nine-page reflection file for the parts you keep avoiding.</small>
        </span>
      </label>
      <button className="button button-primary checkout-button" disabled={isLoading} onClick={startCheckout} type="button">
        {isLoading ? "Opening secure checkout…" : "Get the Pattern Files"}
      </button>
      <p className="checkout-fine-print">Secure checkout. Instant delivery after confirmed payment. No subscription.</p>
      <p aria-live="polite" className="checkout-status" role="status">{status}</p>
    </div>
  );
}
