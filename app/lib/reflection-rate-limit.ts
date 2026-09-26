type Prepared = {
  bind(...values: unknown[]): Prepared;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
};
export type RateLimitDb = { prepare(query: string): Prepared };

export async function hashRateLimitSubject(subject: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(subject)));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// One atomic SQLite statement controls concurrency. No raw IP or reflection content is persisted.
export async function consumeReflectionAllowance(
  db: RateLimitDb, key: string, day: string, limit: number,
): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(key) || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid rate-limit configuration");
  await db.prepare(`CREATE TABLE IF NOT EXISTS self_mirror_reflection_usage (
    subject_hash TEXT NOT NULL,
    utc_day TEXT NOT NULL,
    uses INTEGER NOT NULL,
    PRIMARY KEY (subject_hash, utc_day)
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS self_mirror_reflection_usage_day ON self_mirror_reflection_usage (utc_day)").run();
  const cutoff = new Date(`${day}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 2);
  await db.prepare("DELETE FROM self_mirror_reflection_usage WHERE utc_day < ?")
    .bind(cutoff.toISOString().slice(0, 10)).run();
  const row = await db.prepare(`INSERT INTO self_mirror_reflection_usage (subject_hash, utc_day, uses)
    VALUES (?, ?, 1)
    ON CONFLICT(subject_hash, utc_day) DO UPDATE SET uses = uses + 1 WHERE uses < ?
    RETURNING uses`).bind(key, day, limit).first<{ uses: number }>();
  return Boolean(row && Number.isSafeInteger(row.uses) && row.uses >= 1 && row.uses <= limit);
}
