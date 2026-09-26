import assert from "node:assert/strict";
import test from "node:test";
import { createSelfMirrorSessionToken, verifySelfMirrorSessionToken, isSelfMirrorProActive, verifyStripeSignature } from "../app/lib/commerce.ts";

test("Pro session verifies signature, expiry, and customer identity", async () => {
  const secret = "test-only-long-random-secret";
  const token = await createSelfMirrorSessionToken("cus_example", secret, 60);
  assert.equal(await verifySelfMirrorSessionToken(token, secret), "cus_example");
  assert.equal(await verifySelfMirrorSessionToken(token, "wrong-secret"), null);
  assert.equal(await verifySelfMirrorSessionToken(token + "tampered", secret), null);
  const expired = await createSelfMirrorSessionToken("cus_example", secret, -10);
  assert.equal(await verifySelfMirrorSessionToken(expired, secret), null);
});
test("only active or trialing subscriptions grant Pro", () => {
  for (const state of ["active", "trialing"]) assert.equal(isSelfMirrorProActive(state), true);
  for (const state of ["canceled", "unpaid", "past_due", "incomplete", "paused"]) assert.equal(isSelfMirrorProActive(state), false);
});
test("unsigned Stripe webhook payload is rejected", async () => {
  assert.equal(await verifyStripeSignature("{}", null, "whsec_example"), false);
});
