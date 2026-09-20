import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Finds all agents that have pending user requests queued for processing.
 */
export const getDueAgentsWithRequests = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    if (pendingRequests.length === 0) {
      return [];
    }

    // Group pending requests by userId
    const requestsByUser = new Map<string, typeof pendingRequests>();
    for (const req of pendingRequests) {
      const userReqs = requestsByUser.get(req.userId) ?? [];
      userReqs.push(req);
      requestsByUser.set(req.userId, userReqs);
    }

    const dueList = [];
    for (const [userId, reqs] of requestsByUser.entries()) {
      const user = await ctx.db.get(userId as any);
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", userId as any))
        .first();

      if (agent) {
        dueList.push({
          userId,
          userEmail: (user as any)?.email ?? "user@moitrii.ai",
          userName: (user as any)?.name ?? "User",
          preferredLanguage: (user as any)?.preferredLanguage ?? "en",
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
  userId: string;
  userEmail: string;
  userName: string;
  preferredLanguage: string;
  agentId: any;
  wakeTimeOfDay: string;
  timezone: string;
  requests: Array<{ id: any; prompt: string; category: string }>;
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
    const dueAgents: DueAgent[] = await ctx.runQuery(internal.agentRunner.getDueAgentsWithRequests, {});

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
      const requestIds = target.requests.map((r: { id: any }) => r.id);

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
        }
      } catch (err) {
        console.error(`Failed to reach Python agent service at ${pythonEndpoint}:`, err);
      }
    }

    return { triggeredCount: targets.length, successCount };
  },
});
