import { mutation, query, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendSubscriberWelcomeEmail, sendWeeklyDigestBroadcast, type DigestArticle } from "./emails/brevo";
import { STATIC_STORAGE_IDS } from "./files";

/**
 * Sends welcome confirmation email via Brevo in the background.
 */
export const sendWelcomeNotification = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const logoUrl = await ctx.storage.getUrl(STATIC_STORAGE_IDS.logo);
    await sendSubscriberWelcomeEmail(
      args.email,
      process.env.BREVO_API_KEY,
      process.env.APP_ORIGIN,
      logoUrl ?? undefined
    );
  },
});

/**
 * Subscribes an email address (anonymous or authenticated) to the weekly intentional lifestyle digest.
 * Idempotently reactivates unsubscribed addresses.
 */
export const subscribeDigest = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("bn"), v.literal("hi"))),
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

    let shouldSendWelcome = false;

    if (!existing) {
      await ctx.db.insert("subscribers", {
        email: trimmed,
        status: "ACTIVE",
        source: args.source ?? "footer",
        preferredLanguage: args.preferredLanguage ?? "en",
        subscribedAt: new Date().toISOString(),
      });
      shouldSendWelcome = true;
    } else if (existing.status === "UNSUBSCRIBED") {
      await ctx.db.patch(existing._id, {
        status: "ACTIVE",
        source: args.source ?? existing.source ?? "footer",
        preferredLanguage: args.preferredLanguage ?? existing.preferredLanguage ?? "en",
        subscribedAt: new Date().toISOString(),
        unsubscribedAt: undefined,
      });
      shouldSendWelcome = true;
    }

    // Trigger Brevo welcome confirmation in production/dev runtime
    if (shouldSendWelcome && (typeof process === "undefined" || !process.env?.VITEST)) {
      await ctx.scheduler.runAfter(0, internal.subscribers.sendWelcomeNotification, {
        email: trimmed,
      });
    }

    return { success: true };
  },
});

/**
 * Unsubscribes an email address from the weekly digest.
 */
export const unsubscribeDigest = mutation({
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

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

/**
 * Checks current subscription status for a given email address.
 */
export const getSubscriberStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", trimmed))
      .first();

    if (!existing) {
      return { isSubscribed: false, status: null };
    }

    const isActive = existing.status !== "UNSUBSCRIBED";
    return { isSubscribed: isActive, status: existing.status ?? "ACTIVE" };
  },
});

/**
 * Internal query to list all active subscriber email addresses for weekly digest broadcasting.
 */
export const listActiveSubscribers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("subscribers").collect();
    return all
      .filter((s) => s.status !== "UNSUBSCRIBED")
      .map((s) => s.email);
  },
});

/**
 * Internal query to retrieve the top 10 published articles for the weekly digest (0 LLM token cost).
 * Selects highest reusedCount guides ordered descending.
 */
export const getTopWeeklyDigestArticles = internalQuery({
  args: {},
  handler: async (ctx): Promise<DigestArticle[]> => {
    const articles = await ctx.db
      .query("content")
      .withIndex("by_reused_count")
      .order("desc")
      .take(10);

    return articles.map((doc) => ({
      title: doc.title,
      subtitle: doc.subtitle,
      slug: doc.slug,
      category: doc.category,
      takeaways: doc.takeaways?.slice(0, 5) ?? [],
      readTime: doc.readTime,
    }));
  },
});

/**
 * Autonomous weekly digest dispatcher triggered by Sunday cron.
 * Gathers active subscribers and top 10 content cards, then dispatches via Brevo.
 */
export const dispatchWeeklyDigestCron = internalAction({
  args: {},
  handler: async (ctx) => {
    const subscriberEmails = await ctx.runQuery(internal.subscribers.listActiveSubscribers, {});
    if (subscriberEmails.length === 0) {
      console.log("[WeeklyDigest] No active subscribers found. Skipping broadcast.");
      return { sentCount: 0 };
    }

    const topArticles = await ctx.runQuery(internal.subscribers.getTopWeeklyDigestArticles, {});
    if (topArticles.length === 0) {
      console.log("[WeeklyDigest] No published articles found. Skipping broadcast.");
      return { sentCount: 0 };
    }

    console.log(
      `[WeeklyDigest] Dispatching top ${topArticles.length} guides to ${subscriberEmails.length} active subscriber(s).`
    );

    const logoUrl = await ctx.storage.getUrl(STATIC_STORAGE_IDS.logo);

    const result = await sendWeeklyDigestBroadcast(
      subscriberEmails,
      topArticles,
      process.env.BREVO_API_KEY,
      process.env.APP_ORIGIN,
      logoUrl ?? undefined
    );

    return result;
  },
});
