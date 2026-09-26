import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("renders the Self Mirror homepage and launch metadata", async () => {
  // Allow validation of a fresh isolated build without replacing local dist.
  const workerUrl = process.env.SELF_MIRROR_ARTIFACT_ROOT
    ? pathToFileURL(resolve(process.env.SELF_MIRROR_ARTIFACT_ROOT, "server/index.js"))
    : new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.equal(html.match(/<title>(.*?)<\/title>/s)?.[1], "Self Mirror — See the pattern before it chooses for you | Burkeonis");
  assert.equal(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1],
    "Self Mirror separates facts from assumptions, exposes contradictions, tracks patterns, and helps you choose the next honest move.");
  assert.ok(/<main[\s>]/.test(html), "homepage main content must render");
  assert.ok(/href="\/self-mirror"[^>]*>Open Self Mirror<\/a>/.test(html), "homepage must link to Self Mirror");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});
