import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerHooks } from "node:module";
import { DatabaseSync } from "node:sqlite";
import test, { after } from "node:test";
import { ensureCommerceSchema, getSelfMirrorProEntitlement } from "../app/lib/commerce.ts";
import { syncSelfMirrorProSubscription } from "../app/lib/self-mirror-pro-subscription.ts";
import { POST } from "../app/api/webhooks/stripe/route.ts";

// Supply the Workers binding without credentials or a real Cloudflare runtime.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") return { url: "data:text/javascript,export const env = {}", shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { env } = await import("cloudflare:workers");
after(() => hooks.deregister());

const customer = "cus_ownership_test";
const secret = "whsec_local_test_only";
const product = "self-mirror-pro";
const options = { secretKey: "sk_test_local_test_only", live: false };
function subscription(id, created, status = "active") {
  return { id, created, status, customer, livemode: false, current_period_end: 2000000000, metadata: { product_code: product } };
}

async function setup(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const db = {
    beforeWrite: null,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const bound = (values = []) => ({
        bind: (...next) => bound(next),
        run: async () => statement.run(...values),
        all: async () => ({ results: statement.all(...values) }),
        first: async () => {
          if (/^(INSERT INTO|UPDATE) self_mirror_pro_entitlements/.test(sql)) await db.beforeWrite?.(sql, values);
          return statement.get(...values) ?? null;
        },
      });
      return bound();
    },
    batch: async (statements) => Promise.all(statements.map((statement) => statement.run())),
  };
  await ensureCommerceSchema(db);
  const subscriptions = new Map([
    ["sub_X", subscription("sub_X", 50)],
    ["sub_A", subscription("sub_A", 100)],
    ["sub_B", subscription("sub_B", 200)],
  ]);
  const sessions = new Map();
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    requests.push(url);
    const parsed = new URL(url);
    assert.equal(parsed.origin, "https://api.stripe.com");
    const resource = parsed.pathname.startsWith("/v1/subscriptions/") ? subscriptions : sessions;
    const value = resource.get(decodeURIComponent(parsed.pathname.split("/").at(-1)));
    if (value instanceof Error) throw value;
    if (value instanceof Response) return value.clone();
    return value ? Response.json(value) : new Response("unavailable", { status: 503 });
  });
  Object.assign(env, { COMMERCE_DB: db, STRIPE_SECRET_KEY: options.secretKey, STRIPE_WEBHOOK_SECRET: secret });
  const sync = (id) => syncSelfMirrorProSubscription(db, { ...options, subscriptionId: id });
  const read = () => getSelfMirrorProEntitlement(db, customer);
  const seed = (id) => {
    const value = subscriptions.get(id);
    sqlite.prepare(`INSERT INTO self_mirror_pro_entitlements VALUES (?, ?, ?, ?, ?, ?)`)
      .run(customer, "owner@example.test", id, value.status, "2033-05-18T03:33:20.000Z", "2026-01-01T00:00:00.000Z");
  };
  return { db, sqlite, subscriptions, sessions, requests, sync, read, seed };
}

async function deliver(type, id) {
  const body = JSON.stringify({ id: "evt_duplicate_test", type, livemode: false,
    data: { object: { id, metadata: { product_code: product } } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return POST(new Request("https://example.test/api/webhooks/stripe", {
    method: "POST", body, headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` },
  }));
}

function pauseNextWrite(db) {
  let reached, release;
  const paused = new Promise((resolve) => { reached = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  db.beforeWrite = async () => {
    db.beforeWrite = null;
    reached();
    await gate;
  };
  return { paused, release };
}

for (const type of ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]) {
  test(`newer active B survives delayed ${type} for canceled A`, async (t) => {
    const f = await setup(t);
    f.seed("sub_B");
    f.subscriptions.get("sub_A").status = "canceled";
    const before = await f.read();
    assert.equal((await deliver(type, "sub_A")).status, 200);
    assert.deepEqual(await f.read(), before);
  });
}

for (const type of ["checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
  test(`newer B survives delayed ${type} for A`, async (t) => {
    const f = await setup(t);
    f.seed("sub_B");
    f.sessions.set("cs_old", { id: "cs_old", livemode: false, mode: "subscription", payment_status: "paid",
      customer, subscription: "sub_A", metadata: { product_code: product }, customer_details: { email: "old@example.test" } });
    const before = await f.read();
    assert.equal((await deliver(type, "cs_old")).status, 200);
    assert.deepEqual(await f.read(), before);
  });
}

for (const status of ["active", "trialing"]) {
  test(`older ${status} A cannot replace B even with a later billing period`, async (t) => {
    const f = await setup(t);
    f.seed("sub_B");
    Object.assign(f.subscriptions.get("sub_A"), { status, current_period_end: 2100000000 });
    const before = await f.read();
    assert.equal((await f.sync("sub_A")).outcome, "ignored");
    assert.deepEqual(await f.read(), before);
  });
}

for (const type of ["customer.subscription.created", "checkout.session.completed", "checkout.session.async_payment_succeeded"]) {
  test(`legitimately newer B replaces A through ${type}`, async (t) => {
    const f = await setup(t);
    f.seed("sub_A");
    f.sessions.set("cs_new", { id: "cs_new", livemode: false, mode: "subscription", payment_status: "paid",
      customer, subscription: "sub_B", metadata: { product_code: product } });
    assert.equal((await deliver(type, type.startsWith("checkout") ? "cs_new" : "sub_B")).status, 200);
    assert.equal((await f.read()).subscriptionId, "sub_B");
    assert.equal((await f.read()).status, "active");
  });
}

test("the authoritative subscription still updates and revokes normally", async (t) => {
  const f = await setup(t);
  f.seed("sub_B");
  for (const status of ["trialing", "active", "past_due", "canceled"]) {
    f.subscriptions.get("sub_B").status = status;
    assert.equal((await deliver(status === "canceled" ? "customer.subscription.deleted" : "customer.subscription.updated", "sub_B")).status, 200);
    assert.equal((await f.read()).status, status);
    assert.equal((await f.read()).subscriptionId, "sub_B");
  }
});

for (const initial of ["sub_X", "sub_A"]) {
  test(`A verifies against ${initial}, B writes, A's conditional SQL cannot overwrite B`, async (t) => {
    const f = await setup(t);
    f.seed(initial);
    const gate = pauseNextWrite(f.db);
    const pendingA = f.sync("sub_A");
    await gate.paused;
    try {
      assert.equal((await f.sync("sub_B")).outcome, "applied");
    } finally { gate.release(); }
    assert.equal((await pendingA).outcome, "ignored");
    assert.equal((await f.read()).subscriptionId, "sub_B");
    assert.equal((await f.read()).status, "active");
  });
}

test("duplicate deliveries retain one authoritative entitlement", async (t) => {
  const f = await setup(t);
  for (let i = 0; i < 3; i++) assert.equal((await deliver("customer.subscription.created", "sub_B")).status, 200);
  assert.equal(f.sqlite.prepare("SELECT count(*) AS count FROM self_mirror_pro_entitlements").get().count, 1);
  assert.equal((await f.read()).subscriptionId, "sub_B");
  assert.equal((await f.read()).status, "active");
});

for (const [paused, winner] of [["sub_A", "sub_B"], ["sub_B", "sub_A"], ["sub_B", "sub_B"]]) {
  test(`concurrent first writes: paused ${paused}, inserted ${winner}, converge to B`, async (t) => {
    const f = await setup(t);
    const gate = pauseNextWrite(f.db);
    const pending = f.sync(paused);
    await gate.paused;
    try { assert.equal((await f.sync(winner)).outcome, "applied"); }
    finally { gate.release(); }
    assert.notEqual(await pending, null);
    assert.equal((await f.read()).subscriptionId, "sub_B");
    assert.equal(f.sqlite.prepare("SELECT count(*) AS count FROM self_mirror_pro_entitlements").get().count, 1);
  });
}

for (const target of ["sub_A", "sub_B"]) {
  for (const failure of ["http", "network", "json", "customer", "mode", "product", "id", "created"]) {
    test(`${target} ${failure} verification failure preserves A and returns retryable webhook status`, async (t) => {
      const f = await setup(t);
      f.seed("sub_A");
      const before = await f.read();
      const value = f.subscriptions.get(target);
      if (failure === "http") f.subscriptions.delete(target);
      if (failure === "network") f.subscriptions.set(target, new Error("Stripe unavailable"));
      if (failure === "json") f.subscriptions.set(target, new Response("not json"));
      if (failure === "customer") value.customer = "cus_someone_else";
      if (failure === "mode") value.livemode = true;
      if (failure === "product") value.metadata.product_code = "other-product";
      if (failure === "id") value.id = "sub_wrong";
      if (failure === "created") delete value.created;
      // Checkout independently binds the incoming subscription to this customer.
      f.sessions.set("cs_new", { id: "cs_new", livemode: false, mode: "subscription", payment_status: "paid",
        customer, subscription: "sub_B", metadata: { product_code: product } });
      assert.equal((await deliver("checkout.session.completed", "cs_new")).status, 502);
      assert.deepEqual(await f.read(), before);
    });
  }
}

test("lifecycle ownership verification failures are retryable too", async (t) => {
  const f = await setup(t);
  f.seed("sub_A");
  f.subscriptions.delete("sub_A");
  const before = await f.read();
  assert.equal((await deliver("customer.subscription.created", "sub_B")).status, 502);
  assert.deepEqual(await f.read(), before);
});

test("equal Stripe creation timestamps preserve the existing entitlement", async (t) => {
  const f = await setup(t);
  f.seed("sub_A");
  f.subscriptions.get("sub_B").created = 100;
  const before = await f.read();
  assert.equal((await f.sync("sub_B")).outcome, "ignored");
  assert.deepEqual(await f.read(), before);
});

test("contention is bounded and asks Stripe to retry", async (t) => {
  const f = await setup(t);
  f.seed("sub_X");
  // Simulate a changing owner at every attempted write, using the actual SQL.
  let attempts = 0;
  f.db.beforeWrite = async (_sql, values) => {
    attempts++;
    const expected = values.at(-1);
    f.sqlite.prepare("UPDATE self_mirror_pro_entitlements SET stripe_subscription_id = ? WHERE stripe_customer_id = ?")
      .run(expected === "sub_X" ? "sub_A" : "sub_X", customer);
  };
  assert.equal((await deliver("customer.subscription.created", "sub_B")).status, 502);
  assert.equal(attempts, 5);
  assert.notEqual((await f.read()).subscriptionId, "sub_B");
});
