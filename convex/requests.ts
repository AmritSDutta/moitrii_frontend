import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/** Maximum allowed pending research requests per user at any given time. */
export const MAX_PENDING_REQUESTS_PER_USER = 5;

/** Time-to-live retention window: 3 days in milliseconds. */
export const REQUEST_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Lists all research requests for the currently authenticated user.
 * Clock-agnostic: filters out expired requests older than nowMs when provided.
 */
export const listUserRequests = query({
  args: {
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.nowMs !== undefined) {
      const cutoff = args.nowMs;
      return requests.filter((r) => r.expiresAt === undefined || r.expiresAt > cutoff);
    }

    return requests;
  },
});

/**
 * Creates a new research request in the agent's queue.
 * Rejects if user already has 5 pending requests or if account is inactive.
 * Automatically applies a 3-day TTL expiration timestamp.
 */
export const createRequest = mutation({
  args: {
    prompt: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"))),
    scheduledFor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to create a request");
    }

    const user = await ctx.db.get(userId);
    if (user && (user as any).isActive === false) {
      throw new Error("Account is inactive or under review");
    }

    const trimmedPrompt = args.prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt cannot be empty");
    }

    // Enforce 5-message pending queue cap
    const pendingList = await ctx.db
      .query("requests")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "PENDING")
      )
      .take(MAX_PENDING_REQUESTS_PER_USER + 1);

    if (pendingList.length >= MAX_PENDING_REQUESTS_PER_USER) {
      throw new Error(
        `Queue limit reached: You can have at most ${MAX_PENDING_REQUESTS_PER_USER} pending research requests. Please wait for your agent's next wake cycle to complete them.`
      );
    }

    const now = new Date();
    const nowMs = now.getTime();
    const submittedAtFormatted = `${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const requestId = await ctx.db.insert("requests", {
      userId,
      prompt: trimmedPrompt,
      category: args.category ?? "General Wellness",
      priority: args.priority ?? "normal",
      status: "PENDING",
      submittedAt: submittedAtFormatted,
      scheduledFor: args.scheduledFor ?? "Next Wake-Up Cycle",
      isReused: false,
      expiresAt: nowMs + REQUEST_TTL_MS,
    });

    return requestId;
  },
});

/**
 * Internal batch cleanup mutation executed by the daily cron.
 * Deletes expired requests/todos older than 3 days.
 */
export const cleanupExpiredRequests = internalMutation({
  args: {
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.nowMs ?? Date.now();
    const expired = await ctx.db
      .query("requests")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", cutoff))
      .take(100);

    let deletedCount = 0;
    for (const req of expired) {
      await ctx.db.delete(req._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});
