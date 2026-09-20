/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("subscribeDigest validates and persists subscriber email for anonymous visitors", async () => {
  const t = convexTest(schema, modules);

  const res = await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });
  expect(res.success).toBe(true);

  const rows = await t.run((ctx) => ctx.db.query("subscribers").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].email).toBe("visitor@example.com");
});

test("subscribeDigest rejects duplicate insertions gracefully", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });
  await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });

  const rows = await t.run((ctx) => ctx.db.query("subscribers").collect());
  expect(rows).toHaveLength(1);
});

test("subscribeDigest rejects malformed email addresses", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.subscribers.subscribeDigest, { email: "invalid-email" })).rejects.toThrow(
    /Invalid email address format/
  );
});
