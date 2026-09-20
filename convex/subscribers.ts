import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Subscribes an email address (anonymous or authenticated) to the weekly intentional lifestyle digest.
 */
export const subscribeDigest = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error("Invalid email address format");
    }

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", trimmed))
      .first();

    if (!existing) {
      await ctx.db.insert("subscribers", {
        email: trimmed,
        subscribedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});
