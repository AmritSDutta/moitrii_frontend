import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Returns the personal agent state for the currently authenticated user.
 * Auto-initializes an agent document if this is the user's first session.
 */
export const getAgentState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (agent) {
      return agent;
    }

    // Default fallback representation if not yet written by mutation
    return {
      userId,
      status: "SLEEPING" as const,
      statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
      nextWakeTime: "Tomorrow, 08:00 AM",
      lastActiveTime: "Today, 08:30 AM",
      wakeFrequency: "Daily (08:00 AM)",
      subscriptionTier: "Starter",
      activeTask: undefined,
    };
  },
});

/**
 * Ensures an agent record exists in the database for the authenticated user.
 */
export const initializeAgent = mutation({
  args: {
    wakeFrequency: v.optional(v.string()),
    subscriptionTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to initialize agent");
    }

    const existing = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      userId,
      status: "SLEEPING",
      statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
      nextWakeTime: "Tomorrow, 08:00 AM",
      lastActiveTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      wakeFrequency: args.wakeFrequency ?? "Daily (08:00 AM)",
      subscriptionTier: args.subscriptionTier ?? "Starter",
    });
  },
});

/**
 * Updates the agent wake frequency for the authenticated user.
 */
export const updateAgentFrequency = mutation({
  args: {
    wakeFrequency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to update agent frequency");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        wakeFrequency: args.wakeFrequency,
      });
      return agent._id;
    } else {
      return await ctx.db.insert("agents", {
        userId,
        status: "SLEEPING",
        statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
        nextWakeTime: "Tomorrow, 08:00 AM",
        lastActiveTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        wakeFrequency: args.wakeFrequency,
        subscriptionTier: "Starter",
      });
    }
  },
});
