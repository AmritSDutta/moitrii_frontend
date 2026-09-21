import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Returns the currently authenticated user document or null if unauthenticated.
 * Defaults preferredLanguage to "en" and isActive to true if not yet set.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      ...user,
      preferredLanguage: (user as any).preferredLanguage ?? "en",
      isActive: (user as any).isActive ?? true,
    };
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

    const user = await ctx.db.get(userId);
    if (user && (user as any).isActive === false) {
      throw new Error("Account is inactive or under review");
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

/**
 * Updates the preferred language for AI agent outputs (English, Bengali, Hindi).
 */
export const updatePreferredLanguage = mutation({
  args: {
    language: v.union(v.literal("en"), v.literal("bn"), v.literal("hi")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to update language preferences");
    }

    const user = await ctx.db.get(userId);
    if (user && (user as any).isActive === false) {
      throw new Error("Account is inactive or under review");
    }

    await ctx.db.patch(userId, {
      preferredLanguage: args.language,
    });

    return {
      success: true,
      preferredLanguage: args.language,
    };
  },
});

/**
 * Sets active/inactive status for user account moderation and dispute resolution.
 */
export const setUserActiveStatus = internalMutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.userId, {
      isActive: args.isActive,
    });
    return { success: true, userId: args.userId, isActive: args.isActive };
  },
});
