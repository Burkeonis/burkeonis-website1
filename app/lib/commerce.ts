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
