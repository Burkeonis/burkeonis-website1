import { getCommerceBindings } from "../../lib/commerce";
import { normalizeEmail, normalizeUtm, recordLead } from "../../lib/leads";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  let payload: {
    email?: unknown;
    source?: unknown;
    // Honeypot: a real visitor never fills this (it's visually hidden on
    // the form). A bot filling every field will. If it's non-empty, pretend
    // success and drop the submission instead of erroring — don't tip off
    // the bot that it was caught.
    company?: unknown;
    utmSource?: unknown;
    utmMedium?: unknown;
    utmCampaign?: unknown;
    utmContent?: unknown;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ error: "A valid signup request is required." }, 400);
  }

  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    return json({ ok: true });
  }

  const email = normalizeEmail(payload.email);
  if (!email) return json({ error: "Enter a valid email address." }, 400);

  if (payload.source !== "first-pattern-file") {
    return json({ error: "This signup form is not available." }, 400);
  }

  const bindings = await getCommerceBindings();
  if (!bindings.COMMERCE_DB) return json({ error: "Signup isn't available right now. Try again shortly." }, 503);

  await recordLead(bindings.COMMERCE_DB, {
    email,
    source: "first-pattern-file",
    utmSource: normalizeUtm(payload.utmSource),
    utmMedium: normalizeUtm(payload.utmMedium),
    utmCampaign: normalizeUtm(payload.utmCampaign),
    utmContent: normalizeUtm(payload.utmContent),
  });

  return json({ ok: true });
}
