/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { REQUEST_TTL_MS } from "./requests";

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

test("createRequest persists a PENDING request with 3-day TTL stamp for its owner", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  const beforeMs = Date.now();
  await t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, {
    prompt: "Find immunity boosting soups",
    category: "Health & Nutrition",
    priority: "high",
  });

  const requests = await t.withIdentity({ subject: userId }).query(api.requests.listUserRequests, {});

  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    prompt: "Find immunity boosting soups",
    category: "Health & Nutrition",
    priority: "high",
    status: "PENDING",
  });
  expect(requests[0].expiresAt).toBeGreaterThanOrEqual(beforeMs + REQUEST_TTL_MS - 1000);

  // Verifies agent record was automatically initialized for user
  const agentDoc = await t.run((ctx) =>
    ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
  );
  expect(agentDoc).toBeDefined();
  expect(agentDoc?.status).toBe("SLEEPING");
});

test("createRequest rejects the 6th pending request when user reaches max 5 limit", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  // Submit 5 pending requests (allowed)
  for (let i = 1; i <= 5; i++) {
    await t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, {
      prompt: `Prompt number ${i}`,
      category: "Wellness",
    });
  }

  const currentRequests = await t.withIdentity({ subject: userId }).query(api.requests.listUserRequests, {});
  expect(currentRequests).toHaveLength(5);

  // 6th pending request should be rejected
  await expect(
    t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, {
      prompt: "Prompt number 6 (should fail)",
      category: "Wellness",
    })
  ).rejects.toThrow(/Queue limit reached: You can have at most 5 pending research requests/);
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

test("listUserRequests filters out expired requests older than 3 days", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  // Insert active request
  await t.run((ctx) =>
    ctx.db.insert("requests", {
      userId,
      prompt: "Active recent request",
      category: "Wellness",
      status: "PENDING",
      submittedAt: "Sep 22, 01:00 AM",
      scheduledFor: "Next Wake-Up Cycle",
      isReused: false,
      expiresAt: Date.now() + 100000,
    })
  );

  // Insert expired request (older than 3 days)
  await t.run((ctx) =>
    ctx.db.insert("requests", {
      userId,
      prompt: "Old expired request",
      category: "Wellness",
      status: "COMPLETED",
      submittedAt: "Sep 15, 01:00 AM",
      scheduledFor: "Next Wake-Up Cycle",
      isReused: false,
      expiresAt: Date.now() - 5000, // expired in past
    })
  );

  const visible = await t.withIdentity({ subject: userId }).query(api.requests.listUserRequests, {
    nowMs: Date.now(),
  });
  expect(visible).toHaveLength(1);
  expect(visible[0].prompt).toBe("Active recent request");
});

test("cleanupExpiredRequests batch deletes expired requests", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  // Insert expired request
  const expiredId = await t.run((ctx) =>
    ctx.db.insert("requests", {
      userId,
      prompt: "Ancient completed todo",
      category: "Wellness",
      status: "COMPLETED",
      submittedAt: "Sep 10, 01:00 AM",
      scheduledFor: "Next Wake-Up Cycle",
      isReused: false,
      expiresAt: 1000, // old timestamp
    })
  );

  // Insert active request
  const activeId = await t.run((ctx) =>
    ctx.db.insert("requests", {
      userId,
      prompt: "Fresh todo",
      category: "Wellness",
      status: "PENDING",
      submittedAt: "Sep 22, 01:00 AM",
      scheduledFor: "Next Wake-Up Cycle",
      isReused: false,
      expiresAt: Date.now() + 100000,
    })
  );

  const cleanupRes = await t.mutation(internal.requests.cleanupExpiredRequests, {
    nowMs: Date.now(),
  });
  expect(cleanupRes.deletedCount).toBe(1);

  const docExpired = await t.run((ctx) => ctx.db.get(expiredId));
  expect(docExpired).toBeNull();

  const docActive = await t.run((ctx) => ctx.db.get(activeId));
  expect(docActive).not.toBeNull();
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

test("createRequest enforces 250 character prompt limit", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);

  // 250 characters succeeds
  const exact250 = "a".repeat(250);
  const reqId = await t
    .withIdentity({ subject: userId })
    .mutation(api.requests.createRequest, { prompt: exact250 });
  expect(reqId).toBeDefined();

  // 251 characters fails
  const tooLong = "a".repeat(251);
  await expect(
    t.withIdentity({ subject: userId }).mutation(api.requests.createRequest, { prompt: tooLong })
  ).rejects.toThrow(/exceeds maximum length of 250 characters/i);
});

