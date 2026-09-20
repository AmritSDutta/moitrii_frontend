/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type Tester = TestConvex<typeof schema>;

const seedUser = (t: Tester) =>
  t.run((ctx) => ctx.db.insert("users", { name: "Aditi Sharma", email: "aditi@example.com" }));

test("getAgentState returns 11:00 PM IST default fallback for uninitialized user", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const state = await asUser.query(api.agents.getAgentState, {});
  expect(state).not.toBeNull();
  expect(state?.wakeTimeOfDay).toBe("23:00");
  expect(state?.wakeFrequency).toContain("11:00 PM IST");
  expect(state?.status).toBe("SLEEPING");
});

test("initializeAgent writes record with 11:00 PM IST default schedule", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const agentId = await asUser.mutation(api.agents.initializeAgent, {});
  expect(agentId).toBeDefined();

  const stored = await t.run((ctx) => ctx.db.get(agentId));
  expect((stored as any)?.wakeTimeOfDay).toBe("23:00");
  expect((stored as any)?.timezone).toBe("Asia/Kolkata");
  expect((stored as any)?.wakeFrequency).toBe("Daily (11:00 PM IST)");
});

test("updateWakeSchedule allows valid night/early morning hours", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Test 10:00 PM (22:00)
  const res1 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "22:00" });
  expect(res1.wakeFrequency).toBe("Daily (10:00 PM IST)");
  expect(res1.wakeTimeOfDay).toBe("22:00");

  // Test 6:30 AM (06:30)
  const res2 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "06:30" });
  expect(res2.wakeFrequency).toBe("Daily (6:30 AM IST)");
  expect(res2.wakeTimeOfDay).toBe("06:30");

  // Test 9:00 PM boundary (21:00)
  const res3 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "21:00" });
  expect(res3.wakeFrequency).toBe("Daily (9:00 PM IST)");

  // Test 9:00 AM boundary (09:00)
  const res4 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "09:00" });
  expect(res4.wakeFrequency).toBe("Daily (9:00 AM IST)");
});

test("updateWakeSchedule rejects daytime hours between 9:00 AM and 9:00 PM IST", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Afternoon 2:00 PM (14:00)
  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "14:00" })
  ).rejects.toThrow(/Wake time must be scheduled between 9:00 PM and 9:00 AM IST/);

  // Morning 9:30 AM (09:30)
  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "09:30" })
  ).rejects.toThrow(/Wake time must be scheduled between 9:00 PM and 9:00 AM IST/);

  // Evening 8:00 PM (20:00)
  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "20:00" })
  ).rejects.toThrow(/Wake time must be scheduled between 9:00 PM and 9:00 AM IST/);
});

test("updateWakeSchedule rejects unauthenticated callers", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "23:00" })
  ).rejects.toThrow(/Unauthorized/);
});
