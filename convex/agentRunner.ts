import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * How long after an agent's scheduled wake time (IST) the hourly cron keeps
 * considering it due. Matches the cron's hourly cadence.
 */
export const DISPATCH_WINDOW_MINUTES = 60;

/** Minutes since midnight in IST for an ISO 8601 instant, or -1 if unparseable. */
export function istMinutesNow(nowIso: string): number {
  const ms = Date.parse(nowIso);
  if (Number.isNaN(ms)) return -1;
  const ist = new Date(ms + IST_OFFSET_MINUTES * 60_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

/**
 * True when the agent's daily wake time (normalized IST "HH:mm") falls inside
 * the dispatch window that just elapsed — i.e. the agent is due to wake now.
 */
export function isWakeDue(wakeTimeOfDay: string, nowIstMinutes: number): boolean {
  const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(wakeTimeOfDay.trim());
  if (!match) return false;
  const wakeMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const minutesSinceWake = (nowIstMinutes - wakeMinutes + 1440) % 1440;
  return minutesSinceWake < DISPATCH_WINDOW_MINUTES;
}

/**
 * Finds agents that have pending user requests queued for processing AND whose
 * scheduled wake time (IST) falls inside the elapsed dispatch window.
 */
export const getDueAgentsWithRequests = internalQuery({
  args: {
    nowIso: v.string(),
  },
  handler: async (ctx, args) => {
    const nowIstMinutes = istMinutesNow(args.nowIso);
    if (nowIstMinutes < 0) {
      return [];
    }

    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    if (pendingRequests.length === 0) {
      return [];
    }

    // Group pending requests by userId
    const requestsByUser = new Map<Id<"users">, typeof pendingRequests>();
    for (const req of pendingRequests) {
      const userReqs = requestsByUser.get(req.userId) ?? [];
      userReqs.push(req);
      requestsByUser.set(req.userId, userReqs);
    }

    const dueList = [];
    for (const [userId, reqs] of requestsByUser.entries()) {
      const user = await ctx.db.get(userId);
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!agent) continue;
      if (!isWakeDue(agent.wakeTimeOfDay ?? "23:00", nowIstMinutes)) continue;

      dueList.push({
        userId,
        userEmail: user?.email ?? "user@moitrii.ai",
        userName: user?.name ?? "User",
        preferredLanguage: user?.preferredLanguage ?? "en",
        agentId: agent._id,
        wakeTimeOfDay: agent.wakeTimeOfDay ?? "23:00",
        timezone: agent.timezone ?? "Asia/Kolkata",
        requests: reqs.map((r) => ({
          id: r._id,
          prompt: r.prompt,
          category: r.category,
        })),
      });
    }

    return dueList;
  },
});

/**
 * Marks an agent as WORKING and its pending requests as PROCESSING.
 */
export const markAgentWorking = internalMutation({
  args: {
    agentId: v.id("agents"),
    requestIds: v.array(v.id("requests")),
    activeTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      status: "WORKING",
      statusMessage: "Agent is actively researching and synthesizing lifestyle insights in the background.",
      activeTask: args.activeTask ?? "Synthesizing research requests",
      lastRunAt: new Date().toISOString(),
    });

    for (const reqId of args.requestIds) {
      await ctx.db.patch(reqId, {
        status: "PROCESSING",
      });
    }
  },
});

/**
 * Reverts a dispatch that could not reach the agent service: requests go back
 * to PENDING so the next wake cycle retries them, and the agent goes back to
 * SLEEPING instead of being stranded in WORKING forever.
 */
export const revertAgentWorking = internalMutation({
  args: {
    agentId: v.id("agents"),
    requestIds: v.array(v.id("requests")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      status: "SLEEPING",
      statusMessage: "The agent service was unreachable; your queued requests stay safe and will run at the next wake cycle.",
      activeTask: undefined,
    });

    for (const reqId of args.requestIds) {
      await ctx.db.patch(reqId, {
        status: "PENDING",
      });
    }
  },
});

/**
 * Marks an agent back to SLEEPING and its requests as COMPLETED.
 */
export const completeAgentTask = internalMutation({
  args: {
    agentId: v.id("agents"),
    deliverables: v.array(
      v.object({
        requestId: v.id("requests"),
        contentId: v.optional(v.string()),
        contentTitle: v.optional(v.string()),
        isReused: v.boolean(),
        reuseNote: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    for (const deliv of args.deliverables) {
      await ctx.db.patch(deliv.requestId, {
        status: "COMPLETED",
        completedAt: "Just now",
        contentId: deliv.contentId,
        contentTitle: deliv.contentTitle,
        isReused: deliv.isReused,
        reuseNote: deliv.reuseNote,
      });
    }

    await ctx.db.patch(args.agentId, {
      status: "SLEEPING",
      statusMessage: "Your agent finished research and is resting until the next scheduled cycle.",
      lastActiveTime: `Today, ${now}`,
      activeTask: undefined,
    });
  },
});

export interface DueAgent {
  userId: Id<"users">;
  userEmail: string;
  userName: string;
  preferredLanguage: string;
  agentId: Id<"agents">;
  wakeTimeOfDay: string;
  timezone: string;
  requests: Array<{ id: Id<"requests">; prompt: string; category: string }>;
}

/**
 * Autonomous action triggered on schedule to query due requests and dispatch
 * an HTTPS POST webhook call to the Python agent backend.
 */
export const triggerScheduledWakes = internalAction({
  args: {
    targetUserId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ triggeredCount: number; successCount?: number }> => {
    // Actions may read the wall clock; the query must not, so pass it in.
    const dueAgents: DueAgent[] = await ctx.runQuery(internal.agentRunner.getDueAgentsWithRequests, {
      nowIso: new Date().toISOString(),
    });

    const targets: DueAgent[] = args.targetUserId
      ? dueAgents.filter((d: DueAgent) => d.userId === args.targetUserId)
      : dueAgents;

    if (targets.length === 0) {
      console.log("Autonomous scheduler: No due agents with pending requests found.");
      return { triggeredCount: 0 };
    }

    const pythonEndpoint =
      process.env.PYTHON_AGENT_ENDPOINT || "http://localhost:8000/api/agent/wake";
    const agentSecret = process.env.AGENT_SERVICE_SECRET;

    let successCount = 0;

    for (const target of targets) {
      const requestIds = target.requests.map((r) => r.id);

      // Transition agent and requests to in-progress
      await ctx.runMutation(internal.agentRunner.markAgentWorking, {
        agentId: target.agentId,
        requestIds,
        activeTask: `Researching ${target.requests.length} prompt(s)`,
      });

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (agentSecret) {
          headers["Authorization"] = `Bearer ${agentSecret}`;
          headers["x-agent-secret"] = agentSecret;
        }

        const response = await fetch(pythonEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: target.userId,
            userEmail: target.userEmail,
            userName: target.userName,
            preferredLanguage: target.preferredLanguage,
            agentId: target.agentId,
            wakeTimeOfDay: target.wakeTimeOfDay,
            timezone: target.timezone,
            requests: target.requests,
          }),
        });

        if (response.ok) {
          successCount++;
          console.log(`Dispatched agent wake to Python service for user ${target.userId}`);
        } else {
          console.warn(`Python agent service responded with HTTP ${response.status} for user ${target.userId}`);
          await ctx.runMutation(internal.agentRunner.revertAgentWorking, {
            agentId: target.agentId,
            requestIds,
          });
        }
      } catch (err) {
        console.error(`Failed to reach Python agent service at ${pythonEndpoint}:`, err);
        await ctx
          .runMutation(internal.agentRunner.revertAgentWorking, {
            agentId: target.agentId,
            requestIds,
          })
          .catch((revertErr) =>
            console.error(`Failed to revert agent state for user ${target.userId}:`, revertErr)
          );
      }
    }

    return { triggeredCount: targets.length, successCount };
  },
});
