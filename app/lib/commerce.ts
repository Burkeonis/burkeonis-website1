export const PRIMARY_PRODUCT_CODE = "pattern-files-core";
export const ORDER_BUMP_CODE = "shadow-work-protocol";

export const PAID_PRODUCTS = {
  "build-your-nexus": { title: "Build Your Nexus Field Guide", priceId: "price_1UCdk7CE9Tb0E1aS57w9EnBW", objectKey: "Burkeonis_Build_Your_Nexus_Field_Guide.pdf", filename: "Burkeonis_Build_Your_Nexus_Field_Guide.pdf" },
  "relationship-case-file": { title: "Relationship Case File", priceId: "price_1UCdkJCE9Tb0E1aS5OzaDMPs", objectKey: "Burkeonis_Relationship_Case_File.pdf", filename: "Burkeonis_Relationship_Case_File.pdf" },
  "self-mirror-field-test": { title: "Self Mirror Field Test", priceId: "price_1UCdkOCE9Tb0E1aSVrEeSwlU", objectKey: "Burkeonis_Self_Mirror_Field_Test.pdf", filename: "Burkeonis_Self_Mirror_Field_Test.pdf" },
  "relationships-and-repair": { title: "Relationships & Repair Bundle", priceId: "price_1UCdkRCE9Tb0E1aSHRfdBYIL", objectKey: "burkeonis-relationships-and-repair.zip", filename: "burkeonis-relationships-and-repair.zip" },
  "identity-and-inner-work": { title: "Identity & Inner Work Bundle", priceId: "price_1UCdkUCE9Tb0E1aSEcKaNy5O", objectKey: "burkeonis-identity-and-inner-work.zip", filename: "burkeonis-identity-and-inner-work.zip" },
  "recovery-and-regulation": { title: "Recovery & Regulation Bundle", priceId: "price_1UCdkXCE9Tb0E1aS3PD0oUSQ", objectKey: "burkeonis-recovery-and-regulation.zip", filename: "burkeonis-recovery-and-regulation.zip" },
  "life-and-leadership": { title: "Life & Leadership Bundle", priceId: "price_1UCdkaCE9Tb0E1aSM7KtGmFc", objectKey: "burkeonis-life-and-leadership.zip", filename: "burkeonis-life-and-leadership.zip" },
  "complete-field-guide-library": { title: "Complete Field Guide Library", priceId: "price_1UCdkdCE9Tb0E1aSzqxrnnmg", objectKey: "burkeonis-complete-field-guide-library.zip", filename: "burkeonis-complete-field-guide-library.zip" },
} as const;

export type PaidProductCode = keyof typeof PAID_PRODUCTS;
export function getPaidProduct(code: string | null | undefined) {
  return code && code in PAID_PRODUCTS ? PAID_PRODUCTS[code as PaidProductCode] : null;
}

export type CheckoutSelection = {
  addShadowWork: boolean;
};

export type CommerceBindings = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  DOWNLOAD_TOKEN_SECRET?: string;
  STRIPE_PATTERN_FILES_PRICE_ID?: string;
  STRIPE_SHADOW_WORK_PRICE_ID?: string;
  PATTERN_FILES_OBJECT_KEY?: string;
  PATTERN_FILES_WITH_SHADOW_OBJECT_KEY?: string;
  COMMERCE_DB?: D1Database;
  PRODUCT_FILES?: R2Bucket;
};

export type PaidOrder = {
  checkoutSessionId: string;
  email: string | null;
  customerId: string | null;
  addShadowWork: boolean;
  productCode: string;
  fulfilledAt: string;
};

export async function getCommerceBindings(): Promise<CommerceBindings> {
  // Prefer the real Cloudflare Workers runtime env: it's the only source that carries
  // binding objects like D1Database/R2Bucket (COMMERCE_DB, PRODUCT_FILES). With
  // nodejs_compat enabled, `process.env` also exists in production, but it's a
  // string-keyed shim that can never hold those binding objects — checking it first
  // (as this used to) made COMMERCE_DB/PRODUCT_FILES look permanently "missing" in
  // production even when correctly configured. Only fall back to `process.env` when
  // "cloudflare:workers" isn't available at all, e.g. local Node test scripts.
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as CommerceBindings;
  } catch {
    const processEnv = typeof process !== "undefined" ? process.env : undefined;
    return (processEnv as CommerceBindings) ?? {};
  }
}

export function getSiteOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const origin = new URL(request.url).origin;

  if (forwardedProto === "https" && origin.startsWith("http://")) {
    return origin.replace("http://", "https://");
  }

  return origin;
}

export function parseCheckoutSelection(value: unknown): CheckoutSelection | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (record.product !== PRIMARY_PRODUCT_CODE) return null;

  return { addShadowWork: record.addShadowWork === true };
}

export function configurationProblem(bindings: CommerceBindings): string | null {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "DOWNLOAD_TOKEN_SECRET",
    "STRIPE_PATTERN_FILES_PRICE_ID",
    "PATTERN_FILES_OBJECT_KEY",
    "PATTERN_FILES_WITH_SHADOW_OBJECT_KEY",
  ] as const;

  const missing = required.filter((key) => !bindings[key]);
  if (!bindings.COMMERCE_DB) missing.push("COMMERCE_DB" as never);
  if (!bindings.PRODUCT_FILES) missing.push("PRODUCT_FILES" as never);

  return missing.length ? `Missing commerce configuration: ${missing.join(", ")}.` : null;
}

export async function ensureCommerceSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS commerce_orders (
        checkout_session_id TEXT PRIMARY KEY,
        stripe_event_id TEXT UNIQUE NOT NULL,
        customer_email TEXT,
        customer_id TEXT,
        includes_shadow_work INTEGER NOT NULL DEFAULT 0,
        fulfillment_state TEXT NOT NULL,
        fulfilled_at TEXT NOT NULL,
        delivered_at TEXT
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS commerce_events (
        stripe_event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        received_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS commerce_analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        includes_shadow_work INTEGER NOT NULL DEFAULT 0,
        occurred_at TEXT NOT NULL
      )`,
    ),
  ]);
  const columns = await db.prepare("PRAGMA table_info(commerce_orders)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "product_code")) {
    await db.prepare("ALTER TABLE commerce_orders ADD COLUMN product_code TEXT NOT NULL DEFAULT 'pattern-files-core'").run();
  }
}

export async function recordPaidOrder(
  db: D1Database,
  input: {
    checkoutSessionId: string;
    stripeEventId: string;
    email: string | null;
    customerId: string | null;
    addShadowWork: boolean;
    productCode?: string;
  },
): Promise<void> {
  await ensureCommerceSchema(db);
  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO commerce_events (stripe_event_id, event_type, received_at)
         VALUES (?, ?, ?)`,
      )
      .bind(input.stripeEventId, "checkout.session.completed", now),
    db
      .prepare(
        `INSERT OR IGNORE INTO commerce_orders
         (checkout_session_id, stripe_event_id, customer_email, customer_id, includes_shadow_work, product_code, fulfillment_state, fulfilled_at)
         VALUES (?, ?, ?, ?, ?, ?, 'fulfilled', ?)`,
      )
      .bind(
        input.checkoutSessionId,
        input.stripeEventId,
        input.email,
        input.customerId,
        input.addShadowWork ? 1 : 0,
        input.productCode ?? PRIMARY_PRODUCT_CODE,
        now,
      ),
  ]);
}

export async function getPaidOrder(db: D1Database, checkoutSessionId: string): Promise<PaidOrder | null> {
  await ensureCommerceSchema(db);
  const result = await db
    .prepare(
      `SELECT checkout_session_id, customer_email, customer_id, includes_shadow_work, product_code, fulfilled_at
       FROM commerce_orders
       WHERE checkout_session_id = ? AND fulfillment_state = 'fulfilled'`,
    )
    .bind(checkoutSessionId)
    .first<{
      checkout_session_id: string;
      customer_email: string | null;
      customer_id: string | null;
      includes_shadow_work: number;
      product_code: string;
      fulfilled_at: string;
    }>();

  if (!result) return null;

  return {
    checkoutSessionId: result.checkout_session_id,
    email: result.customer_email,
    customerId: result.customer_id,
    addShadowWork: result.includes_shadow_work === 1,
    productCode: result.product_code || PRIMARY_PRODUCT_CODE,
    fulfilledAt: result.fulfilled_at,
  };
}

export async function recordDelivery(db: D1Database, checkoutSessionId: string): Promise<void> {
  await db
    .prepare(
      `UPDATE commerce_orders
       SET delivered_at = COALESCE(delivered_at, ?)
       WHERE checkout_session_id = ?`,
    )
    .bind(new Date().toISOString(), checkoutSessionId)
    .run();
}

export async function recordAnalyticsEvent(
  db: D1Database,
  input: { eventName: string; productCode?: string; addShadowWork?: boolean },
): Promise<void> {
  await ensureCommerceSchema(db);
  await db
    .prepare(
      `INSERT INTO commerce_analytics_events
       (event_name, product_code, includes_shadow_work, occurred_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      input.eventName,
      input.productCode ?? PRIMARY_PRODUCT_CODE,
      input.addShadowWork ? 1 : 0,
      new Date().toISOString(),
    )
    .run();
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function createDownloadToken(
  checkoutSessionId: string,
  secret: string,
  validForSeconds = 15 * 60,
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + validForSeconds;
  const payload = `${checkoutSessionId}.${expiresAt}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyDownloadToken(token: string, secret: string): Promise<string | null> {
  const [checkoutSessionId, expiresAtValue, signature, ...remainder] = token.split(".");
  if (!checkoutSessionId || !expiresAtValue || !signature || remainder.length) return null;

  const expiresAt = Number(expiresAtValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;

  const payload = `${checkoutSessionId}.${expiresAt}`;
  const expected = await hmac(secret, payload);
  return safeEqual(signature, expected) ? checkoutSessionId : null;
}

export async function verifyStripeSignature(
  rawPayload: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (!header) return false;

  const values = header.split(",").reduce<Record<string, string[]>>((accumulator, item) => {
    const [key, value] = item.split("=", 2);
    if (key && value) (accumulator[key] ??= []).push(value);
    return accumulator;
  }, {});
  const timestamp = values.t?.[0];
  const signatures = values.v1 ?? [];
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;

  const issuedAt = Number(timestamp);
  if (Math.abs(Math.floor(Date.now() / 1000) - issuedAt) > 300) return false;

  const raw = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
    new TextEncoder().encode(`${timestamp}.${rawPayload}`),
  ));
  const expected = [...raw].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return signatures.some((signature) => safeEqual(signature, expected));
}
