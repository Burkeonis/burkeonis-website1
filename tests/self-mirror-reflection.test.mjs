import assert from "node:assert/strict";
import test from "node:test";
import { POST, validateReflection } from "../app/api/self-mirror/reflection/route.ts";

const account = "I left the house yesterday because we argued all night. I texted that I needed space.";
const finding = { point: "The writer reports leaving after an argument.", quote: "I left the house yesterday", source: "user account" };
const valid = { summary: [finding], observations: [finding], interpretations: [], missing: ["What was said before the argument?"], nextMove: "Write a neutral timeline." };

test("only accepts findings with exact quoted evidence", () => {
  assert.equal(validateReflection(valid, account), true);
  assert.equal(validateReflection({ ...valid, observations: [{ ...finding, quote: "She threatened me yesterday" }] }, account), false);
  assert.equal(validateReflection({ ...valid, observations: [{ ...finding, source: "fabricated screenshot" }] }, account), false);
});
test("rejects invalid input before invoking AI", async () => {
  const response = await POST(new Request("http://localhost/api/self-mirror/reflection", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "mirror", text: "too short" }),
  }));
  assert.equal(response.status, 400);
});
test("fails closed without an AI binding", async () => {
  const response = await POST(new Request("http://localhost/api/self-mirror/reflection", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "mirror", text: account }),
  }));
  assert.equal(response.status, 503);
});
