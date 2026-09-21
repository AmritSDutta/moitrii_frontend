/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type Tester = TestConvex<typeof schema>;

const seedUser = (t: Tester) =>
  t.run((ctx) => ctx.db.insert("users", { name: "Test User", email: "test@example.com" }));

test("createRequest rejects an unauthenticated caller", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.requests.createRequest, { prompt: "anything" })
  ).rejects.toThrow(/Unauthorized/);
});

test("createRequest persists a PENDING request for its owner", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  await t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, {
    prompt: "Find immunity boosting soups",
    category: "Health & Nutrition",
  });

  const requests = await t.withIdentity({ subject: userId }).query(api.requests.listUserRequests, {});

  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    prompt: "Find immunity boosting soups",
    category: "Health & Nutrition",
    status: "PENDING",
  });
});

test("requests are isolated per user", async () => {
  const t = convexTest(schema, modules);
  const userA = await seedUser(t);
  const userB = await t.run((ctx) =>
    ctx.db.insert("users", { name: "Other User", email: "other@example.com" })
  );

  await t
    .withIdentity({ subject: userA })
    .mutation(api.requests.createRequest, { prompt: "A private request" });

  const forB = await t.withIdentity({ subject: userB }).query(api.requests.listUserRequests, {});

  expect(forB).toHaveLength(0);
});

test("createRequest rejects an empty prompt", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  await expect(
    t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, { prompt: "   " })
  ).rejects.toThrow(/empty/i);
});

test("createRequest rejects inactive or disputed users", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  await t.run((ctx) => ctx.db.patch(userId, { isActive: false }));

  await expect(
    t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, { prompt: "A valid prompt" })
  ).rejects.toThrow(/Account is inactive or under review/);
});

