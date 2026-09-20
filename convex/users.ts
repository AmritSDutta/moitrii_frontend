import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Returns the currently authenticated user document or null if unauthenticated.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

/**
 * Returns the topic interests for the authenticated user.
 */
export const getInterests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const record = await ctx.db
      .query("userInterests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return record?.topicIds ?? [];
  },
});

/**
 * Updates or sets the topic interests for the authenticated user.
 */
export const updateInterests = mutation({
  args: {
    topicIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to update interests");
    }

    const existing = await ctx.db
      .query("userInterests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { topicIds: args.topicIds });
    } else {
      await ctx.db.insert("userInterests", {
        userId,
        topicIds: args.topicIds,
      });
    }
  },
});
