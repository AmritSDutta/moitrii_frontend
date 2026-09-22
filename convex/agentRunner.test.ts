/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { isWakeDue, istMinutesNow, workflow } from "./agentRunner";

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

  // With force: true, executes immediately regardless of time window
  const forcedDue = await t.query(internal.agentRunner.getDueAgentsWithRequests, {
    nowIso: "2026-09-21T08:30:00.000Z",
    force: true,
  });
  expect(forcedDue).toHaveLength(1);
  expect(forcedDue[0].requests[0].prompt).toBe("Find immunity boosting soups");
});

test("getDueAgentsWithRequests skips agents belonging to inactive or disputed users", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await seedAgentWithPendingRequest(t, "23:00");
  await t.run((ctx) => ctx.db.patch(userId, { isActive: false }));

  const due = await t.query(internal.agentRunner.getDueAgentsWithRequests, {
    nowIso: "2026-09-21T18:00:00.000Z",
  });
  expect(due).toHaveLength(0);
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

test("triggerScheduledWakes starts workflow executions for due agents", async () => {
  const t = convexTest(schema, modules);
  const startSpy = vi.spyOn(workflow, "start").mockResolvedValue("mock_workflow_id" as any);
  const { userId, agentId, requestId } = await seedAgentWithPendingRequest(t, "23:00");

  // 18:00 UTC == 23:30 IST -> due
  const result = await t.action(internal.agentRunner.triggerScheduledWakes, {
    targetUserId: userId,
    nowIso: "2026-09-21T18:00:00.000Z",
  });

  expect(result.triggeredCount).toBe(1);
  expect(startSpy).toHaveBeenCalledWith(
    expect.anything(),
    internal.agentRunner.userWakeWorkflow,
    {
      userId,
      agentId,
      requestIds: [requestId],
    }
  );
  startSpy.mockRestore();
});

test("researchAndSynthesizeStep produces offline fallback guide with sources", async () => {
  const t = convexTest(schema, modules);
  const guide = await t.action(internal.agentRunner.researchAndSynthesizeStep, {
    prompt: "Quick morning yoga stretches for back relief",
    category: "Wellness",
    language: "en",
  });

  expect(guide.title).toBeDefined();
  expect(guide.takeaways).toBeInstanceOf(Array);
  expect(guide.takeaways.length).toBeGreaterThan(0);
  expect(guide.sources).toBeInstanceOf(Array);
  expect(guide.sources.length).toBeGreaterThan(0);
  expect(guide.sources[0].url).toMatch(/^https?:\/\//);
});

test("narrationStep safely handles offline execution without OpenAI keys", async () => {
  const t = convexTest(schema, modules);
  const audio = await t.action(internal.agentRunner.narrationStep, {
    text: "Daily mindfulness practice helps maintain a calm mind.",
  });

  expect(audio).toBeDefined();
});

test("notifyCompletionStep runs cleanly with fallback mailer", async () => {
  const t = convexTest(schema, modules);
  const { requestId } = await seedAgentWithPendingRequest(t, "23:00");
  const res = await t.action(internal.agentRunner.notifyCompletionStep, {
    agentName: "Moitrii Companion",
    agentEmail: "companion@moitrii.ai",
    userEmail: "test@example.com",
    userName: "Test User",
    deliverables: [
      {
        requestId,
        title: "Morning Yoga Stretches",
        isReused: false,
      },
    ],
  });

  expect(res.success).toBe(true);
});

test("markAgentWorking, revertAgentWorking, and completeAgentTask safely handle deleted request records", async () => {
  const t = convexTest(schema, modules);
  const { agentId, requestId } = await seedAgentWithPendingRequest(t, "23:00");

  // Delete the request record to simulate TTL cleanup between steps
  await t.run((ctx) => ctx.db.delete(requestId));

  // Should not throw even with missing request ID
  await expect(
    t.mutation(internal.agentRunner.markAgentWorking, {
      agentId,
      requestIds: [requestId],
    })
  ).resolves.not.toThrow();

  await expect(
    t.mutation(internal.agentRunner.revertAgentWorking, {
      agentId,
      requestIds: [requestId],
    })
  ).resolves.not.toThrow();

  await expect(
    t.mutation(internal.agentRunner.completeAgentTask, {
      agentId,
      deliverables: [
        {
          requestId,
          contentTitle: "Missing Doc Guide",
          isReused: false,
        },
      ],
    })
  ).resolves.not.toThrow();

  const agent = await t.run((ctx) => ctx.db.get(agentId));
  expect(agent?.status).toBe("SLEEPING");
});
