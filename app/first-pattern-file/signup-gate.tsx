"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "burkeonisFirstPatternFileUnlocked";

function readUtmParams(): { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; utmContent: string | null } {
  if (typeof window === "undefined") return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null };
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
  };
}

export default function SignupGate({ children, downloadText }: { children: React.ReactNode; downloadText: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
    } catch {
      // Private browsing / storage blocked — fall back to the email form every visit.
    }
    setCheckedStorage(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const utm = readUtmParams();
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "first-pattern-file", company, ...utm }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(payload.error ?? "Something went wrong. Try again.");
        return;
      }

      setUnlocked(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // No storage — they'll just see the form again next visit, no harm done.
      }
    } catch {
      setStatus("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([downloadText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "the-first-pattern-file.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!checkedStorage) return null;

  if (!unlocked) {
    return (
      <div className="checkout-card pfc-gate" id="get-the-file">
        <p className="checkout-label">Free — one email, instant access</p>
        <h3 className="pfc-gate-title">Get the First Pattern File</h3>
        <p className="checkout-copy">Four lines. One page. No account, no app, no charge. You&apos;ll get it below the second you submit.</p>
        <form onSubmit={handleSubmit} className="pfc-form">
          <label className="pfc-honeypot" aria-hidden="true">
            Company
            <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} name="company" />
          </label>
          <input
            required
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pfc-email-input"
          />
          <button className="button button-primary checkout-button" disabled={isLoading} type="submit">
            {isLoading ? "Unlocking…" : "Get the free file"}
          </button>
        </form>
        <p className="checkout-fine-print">
          No fake newsletter. You&apos;ll hear from me when there&apos;s something real, and you can say stop anytime.
        </p>
        <p aria-live="polite" className="checkout-status" role="status">{status}</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <button className="button button-outline pfc-download" onClick={handleDownload} type="button">
        Download as a text file
      </button>
    </>
  );
}
