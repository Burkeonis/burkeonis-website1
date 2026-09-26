import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { consumeReflectionAllowance, hashRateLimitSubject } from "../app/lib/reflection-rate-limit.ts";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {
        bind(...values) {
          return {
            run: async () => statement.run(...values),
            first: async () => statement.get(...values) ?? null,
          };
        },
        run: async () => statement.run(),
      };
    },
  };
}

test("an anonymous subject gets three uses per UTC day; the fourth is denied", async () => {
  const db = database();
  const key = await hashRateLimitSubject("anonymous:192.0.2.4", "a".repeat(32));
  for (let i = 0; i < 3; i++) assert.equal(await consumeReflectionAllowance(db, key, "2026-09-26", 3), true);
  assert.equal(await consumeReflectionAllowance(db, key, "2026-09-26", 3), false);
  assert.equal(await consumeReflectionAllowance(db, key, "2026-09-27", 3), true);
  const rows = db.sqlite.prepare("SELECT subject_hash, uses FROM self_mirror_reflection_usage WHERE utc_day = ?").all("2026-09-26");
  assert.deepEqual(rows.map((row) => ({ ...row })), [{ subject_hash: key, uses: 3 }]);
  assert.equal(JSON.stringify(rows).includes("192.0.2.4"), false);
  db.sqlite.close();
});

test("a distinct Pro subject has a separate conservative allowance", async () => {
  const db = database();
  const secret = "b".repeat(32);
  const anonymous = await hashRateLimitSubject("anonymous:192.0.2.4", secret);
  const pro = await hashRateLimitSubject("pro:cus_example", secret);
  assert.notEqual(anonymous, pro);
  assert.equal(await consumeReflectionAllowance(db, anonymous, "2026-09-26", 1), true);
  assert.equal(await consumeReflectionAllowance(db, anonymous, "2026-09-26", 1), false);
  assert.equal(await consumeReflectionAllowance(db, pro, "2026-09-26", 2), true);
  assert.equal(await consumeReflectionAllowance(db, pro, "2026-09-26", 2), true);
  assert.equal(await consumeReflectionAllowance(db, pro, "2026-09-26", 2), false);
  db.sqlite.close();
});

test("invalid state or a database failure never grants access", async () => {
  const key = await hashRateLimitSubject("anonymous:192.0.2.4", "c".repeat(32));
  await assert.rejects(consumeReflectionAllowance(database(), key, "2026-09-26", 0));
  await assert.rejects(consumeReflectionAllowance({ prepare() { throw Error("D1 unavailable"); } }, key, "2026-09-26", 3));
});
