import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendSubscriberWelcomeEmail } from "./emails/brevo";

/**
 * Sends welcome confirmation email via Brevo in the background.
 */
export const sendWelcomeNotification = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (_ctx, args) => {
    await sendSubscriberWelcomeEmail(args.email, process.env.BREVO_API_KEY);
  },
});

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

      // Trigger Brevo welcome confirmation in production/dev runtime
      if (typeof process === "undefined" || !process.env?.VITEST) {
        await ctx.scheduler.runAfter(0, internal.subscribers.sendWelcomeNotification, {
          email: trimmed,
        });
      }
    }

    return { success: true };
  },
});
