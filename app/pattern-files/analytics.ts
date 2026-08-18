"use client";

export type PatternFilesEvent =
  | "pattern_files_viewed"
  | "pattern_files_checkout_started"
  | "pattern_files_checkout_unavailable";

export function trackPatternFilesEvent(event: PatternFilesEvent, addShadowWork = false): void {
  const body = JSON.stringify({ event, addShadowWork });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
