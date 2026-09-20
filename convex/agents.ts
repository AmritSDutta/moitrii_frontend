import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Validates that the requested wake time falls in the calm night/morning window:
 * between 9:00 PM and 9:00 AM IST (i.e. outside 09:01 - 20:59).
 */
export function validateWakeTime(timeStr: string): { hour: number; minute: number; formatted12h: string; normalized24h: string } {
  const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(timeStr.trim());
  if (!match) {
    throw new Error("Invalid time format. Please provide time in HH:mm format (e.g. '23:00').");
  }
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  // Reject daytime hours: between 9:01 AM and 8:59 PM (09:01 to 20:59)
  const isDaytime = (hour > 9 && hour < 21) || (hour === 9 && minute > 0);
  if (isDaytime) {
    throw new Error("Wake time must be scheduled between 9:00 PM and 9:00 AM IST. Agents rest during daytime hours (9:00 AM - 9:00 PM) for calm background processing.");
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  const formatted12h = `${hour12}:${minStr} ${period}`;
  const normalized24h = `${hour < 10 ? "0" + hour : hour}:${minStr}`;

  return { hour, minute, formatted12h, normalized24h };
}

/**
 * Computes a human-readable next wake timestamp string in IST.
 */
export function computeNextWakeString(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  return `Tomorrow, ${hour12}:${minStr} ${period} IST`;
}

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

    // Default fallback representation (11:00 PM IST) if not yet written by mutation
    return {
      userId,
      status: "SLEEPING" as const,
      statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
      nextWakeTime: "Tonight, 11:00 PM IST",
      lastActiveTime: "Today, 11:30 PM IST",
      wakeFrequency: "Daily (11:00 PM IST)",
      wakeTimeOfDay: "23:00",
      timezone: "Asia/Kolkata",
      subscriptionTier: "Starter",
      activeTask: undefined,
    };
  },
});

/**
 * Ensures an agent record exists in the database for the authenticated user,
 * defaulting to 11:00 PM IST on first setup.
 */
export const initializeAgent = mutation({
  args: {
    wakeFrequency: v.optional(v.string()),
    wakeTimeOfDay: v.optional(v.string()),
    timezone: v.optional(v.string()),
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

    const defaultTime = args.wakeTimeOfDay ?? "23:00";
    const validated = validateWakeTime(defaultTime);
    const timezone = args.timezone ?? "Asia/Kolkata";
    const wakeFrequency = args.wakeFrequency ?? `Daily (${validated.formatted12h} IST)`;
    const nextWakeTime = computeNextWakeString(validated.hour, validated.minute);

    return await ctx.db.insert("agents", {
      userId,
      status: "SLEEPING",
      statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
      nextWakeTime,
      lastActiveTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      wakeFrequency,
      wakeTimeOfDay: validated.normalized24h,
      timezone,
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
        nextWakeTime: "Tonight, 11:00 PM IST",
        lastActiveTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        wakeFrequency: args.wakeFrequency,
        wakeTimeOfDay: "23:00",
        timezone: "Asia/Kolkata",
        subscriptionTier: "Starter",
      });
    }
  },
});

/**
 * Updates the wake schedule time for the authenticated user.
 * Validates that the requested time falls strictly between 9:00 PM and 9:00 AM IST.
 */
export const updateWakeSchedule = mutation({
  args: {
    wakeTimeOfDay: v.string(), // e.g. "23:00", "22:30", "07:00"
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to update wake schedule");
    }

    const validated = validateWakeTime(args.wakeTimeOfDay);
    const timezone = args.timezone ?? "Asia/Kolkata";
    const wakeFrequency = `Daily (${validated.formatted12h} IST)`;
    const nextWakeTime = computeNextWakeString(validated.hour, validated.minute);

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        wakeTimeOfDay: validated.normalized24h,
        timezone,
        wakeFrequency,
        nextWakeTime,
      });
      return {
        agentId: agent._id,
        wakeTimeOfDay: validated.normalized24h,
        wakeFrequency,
        nextWakeTime,
      };
    } else {
      const newId = await ctx.db.insert("agents", {
        userId,
        status: "SLEEPING",
        statusMessage: "Your agent is resting and preparing for the next scheduled research cycle.",
        nextWakeTime,
        lastActiveTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        wakeFrequency,
        wakeTimeOfDay: validated.normalized24h,
        timezone,
        subscriptionTier: "Starter",
      });
      return {
        agentId: newId,
        wakeTimeOfDay: validated.normalized24h,
        wakeFrequency,
        nextWakeTime,
      };
    }
  },
});
