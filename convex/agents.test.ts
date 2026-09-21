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
  expect(state?.email).toContain("@agentmail.to");
  expect(state?.name).toBe("Moitrii Companion");
});

test("initializeAgent writes record with 11:00 PM IST default schedule, distinct agent email, and persona name", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const agentId = await asUser.mutation(api.agents.initializeAgent, {});
  expect(agentId).toBeDefined();

  const stored = await t.run((ctx) => ctx.db.get(agentId));
  expect((stored as any)?.wakeTimeOfDay).toBe("23:00");
  expect((stored as any)?.timezone).toBe("Asia/Kolkata");
  expect((stored as any)?.wakeFrequency).toBe("Daily (11:00 PM IST)");
  expect((stored as any)?.email).toContain("@agentmail.to");
  // Strict PII Anonymization: Companion persona name stored, zero human PII
  expect((stored as any)?.name).toBe("Moitrii Companion");
});

test("initializeAgent and updateWakeSchedule reject inactive or disputed users", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  await t.run((ctx) => ctx.db.patch(userId, { isActive: false }));
  const asUser = t.withIdentity({ subject: userId });

  await expect(asUser.mutation(api.agents.initializeAgent, {})).rejects.toThrow(
    /Account is inactive or under review/
  );

  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "23:00" })
  ).rejects.toThrow(/Account is inactive or under review/);
});

test("updateWakeSchedule allows any valid 24-hour time format across day and night", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Afternoon 2:00 PM (14:00)
  const res1 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "14:00" });
  expect(res1.wakeFrequency).toBe("Daily (2:00 PM IST)");
  expect(res1.wakeTimeOfDay).toBe("14:00");

  // Morning 9:30 AM (09:30)
  const res2 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "09:30" });
  expect(res2.wakeFrequency).toBe("Daily (9:30 AM IST)");
  expect(res2.wakeTimeOfDay).toBe("09:30");

  // Evening 8:00 PM (20:00)
  const res3 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "20:00" });
  expect(res3.wakeFrequency).toBe("Daily (8:00 PM IST)");

  // Night 10:00 PM (22:00)
  const res4 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "22:00" });
  expect(res4.wakeFrequency).toBe("Daily (10:00 PM IST)");
  expect(res4.wakeTimeOfDay).toBe("22:00");

  // Early morning 6:30 AM (06:30)
  const res5 = await asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "06:30" });
  expect(res5.wakeFrequency).toBe("Daily (6:30 AM IST)");
  expect(res5.wakeTimeOfDay).toBe("06:30");
});

test("updateWakeSchedule rejects malformed or invalid time strings", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "25:00" })
  ).rejects.toThrow(/Invalid time format/);

  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "12:65" })
  ).rejects.toThrow(/Invalid time format/);

  await expect(
    asUser.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "invalid-time" })
  ).rejects.toThrow(/Invalid time format/);
});

test("updateWakeSchedule rejects unauthenticated callers", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.agents.updateWakeSchedule, { wakeTimeOfDay: "23:00" })
  ).rejects.toThrow(/Unauthorized/);
});
