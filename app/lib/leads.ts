// Lead capture for free-protocol landing pages (e.g. /first-pattern-file).
// Shares the same D1 database as commerce (COMMERCE_DB) — no new binding
// needed. Deliberately minimal: this is a mailing-list seed with UTM source
// tracking, not a CRM. One table, one write path, idempotent on email so a
// repeat signup never errors or duplicates the row.

export type LeadSource = "first-pattern-file";

async function ensureLeadsSchema(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS leads (
        email TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 5 || trimmed.length > 254) return null;
  if (!EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

// UTM values are attacker/visitor-controlled query-string data. Cap length
// and strip anything that isn't a plausible campaign-tag character so a
// malformed or hostile link can't stuff junk into the row.
const UTM_PATTERN = /^[\w.\-:/%+ ]{1,80}$/;

export function normalizeUtm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !UTM_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export async function recordLead(
  db: D1Database,
  input: {
    email: string;
    source: LeadSource;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
  },
): Promise<void> {
  await ensureLeadsSchema(db);
  await db
    .prepare(
      `INSERT OR IGNORE INTO leads (email, source, utm_source, utm_medium, utm_campaign, utm_content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.email,
      input.source,
      input.utmSource,
      input.utmMedium,
      input.utmCampaign,
      input.utmContent,
      new Date().toISOString(),
    )
    .run();
}
