/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { isWakeDue, istMinutesNow } from "./agentRunner";

const modules = import.meta.glob("./**/*.ts");

type Tester = TestConvex<typeof schema>;

const seedAgentWithPendingRequest = async (t: Tester, wakeTimeOfDay: string) => {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { name: "Test User", email: "test@example.com" })
  );
  const agentId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("agents", {
      userId,
      status: "SLEEPING",
      statusMessage: "Resting",
      nextWakeTime: "Tonight, 11:00 PM IST",
      lastActiveTime: "Today, 11:30 PM IST",
      wakeFrequency: "Daily (11:00 PM IST)",
      wakeTimeOfDay,
      timezone: "Asia/Kolkata",
      subscriptionTier: "Starter",
    });
    return id;
  });
  const requestId = await t.run((ctx) =>
    ctx.db.insert("requests", {
      userId,
      prompt: "Find immunity boosting soups",
      category: "Health & Nutrition",
      status: "PENDING",
      submittedAt: "Sep 21, 10:00 AM",
      scheduledFor: "Next Wake-Up Cycle",
      isReused: false,
    })
  );
  return { userId, agentId, requestId };
};

test("isWakeDue fires only inside the hour after the scheduled wake time", () => {
  // 23:00 wake, 23:30 now -> due
  expect(isWakeDue("23:00", 23 * 60 + 30)).toBe(true);
  // 23:30 wake, 00:00 now (past midnight) -> 30 min since wake -> due
  expect(isWakeDue("23:30", 0)).toBe(true);
  // 23:00 wake, 00:30 now -> 90 min since wake -> window elapsed -> not due
  expect(isWakeDue("23:00", 30)).toBe(false);
  // 23:00 wake, 22:00 now -> not yet due
  expect(isWakeDue("23:00", 22 * 60)).toBe(false);
  // 06:30 wake, 14:00 now (daytime, outside calm window) -> not due
  expect(isWakeDue("06:30", 14 * 60)).toBe(false);
  // Malformed wake time never dispatches
  expect(isWakeDue("not-a-time", 0)).toBe(false);
});

test("istMinutesNow converts UTC instants to IST minutes since midnight", () => {
  // 18:00 UTC == 23:30 IST
  expect(istMinutesNow("2026-09-21T18:00:00.000Z")).toBe(23 * 60 + 30);
  // 08:30 UTC == 14:00 IST
  expect(istMinutesNow("2026-09-21T08:30:00.000Z")).toBe(14 * 60);
  expect(istMinutesNow("garbage")).toBe(-1);
});

test("getDueAgentsWithRequests only returns agents inside their wake window", async () => {
  const t = convexTest(schema, modules);
  await seedAgentWithPendingRequest(t, "23:00");

  // 18:00 UTC == 23:30 IST -> agent with 23:00 wake is due
  const due = await t.query(internal.agentRunner.getDueAgentsWithRequests, {
    nowIso: "2026-09-21T18:00:00.000Z",
  });
  expect(due).toHaveLength(1);
  expect(due[0].requests[0].prompt).toBe("Find immunity boosting soups");

  // 08:30 UTC == 14:00 IST -> outside the wake window, nothing dispatches
  const notDue = await t.query(internal.agentRunner.getDueAgentsWithRequests, {
    nowIso: "2026-09-21T08:30:00.000Z",
  });
  expect(notDue).toHaveLength(0);
});

test("revertAgentWorking restores PENDING requests and SLEEPING agents after a failed dispatch", async () => {
  const t = convexTest(schema, modules);
  const { agentId, requestId } = await seedAgentWithPendingRequest(t, "23:00");

  // Simulate the dispatch sequence: marked in-progress, then the service failed.
  await t.mutation(internal.agentRunner.markAgentWorking, {
    agentId,
    requestIds: [requestId],
    activeTask: "Researching 1 prompt(s)",
  });

  let request = await t.run((ctx) => ctx.db.get(requestId));
  expect(request?.status).toBe("PROCESSING");

  await t.mutation(internal.agentRunner.revertAgentWorking, {
    agentId,
    requestIds: [requestId],
  });

  request = await t.run((ctx) => ctx.db.get(requestId));
  expect(request?.status).toBe("PENDING");

  const agent = await t.run((ctx) => ctx.db.get(agentId));
  expect(agent?.status).toBe("SLEEPING");
  expect(agent?.activeTask).toBeUndefined();
});
