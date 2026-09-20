import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Lists published articles with optional category filtering and limit.
 */
export const getPublishedContent = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("content");

    if (args.category && args.category !== "all") {
      const results = await ctx.db
        .query("content")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .collect();

      if (args.limit) {
        return results.slice(0, args.limit);
      }
      return results;
    }

    const results = await q.order("desc").collect();
    if (args.limit) {
      return results.slice(0, args.limit);
    }
    return results;
  },
});

/**
 * Returns trending / popular articles (highest reusedCount).
 */
export const getWhatsHot = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("content").collect();
    // Sort descending by reusedCount
    results.sort((a, b) => (b.reusedCount ?? 0) - (a.reusedCount ?? 0));
    const limit = args.limit ?? 4;
    return results.slice(0, limit);
  },
});

/**
 * Retrieves a single article by its URL slug.
 */
export const getContentBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (article) {
      return article;
    }

    // Fallback: try finding by document _id if slug was passed as an ID
    try {
      const byId = await ctx.db.get(args.slug as any);
      if (byId) return byId;
    } catch {
      // not a valid Convex ID
    }

    return null;
  },
});

/**
 * Generates a short-lived upload URL for direct photo uploads to Convex File Storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to upload assets");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Publishes a new lifestyle guide or deliverable to the Shared Knowledge Library.
 */
export const publishContent = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    subtitle: v.string(),
    category: v.string(),
    author: v.string(),
    authorType: v.optional(v.union(v.literal("human"), v.literal("agent"))),
    readTime: v.string(),
    coverImage: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    reusedCount: v.optional(v.number()),
    isReused: v.optional(v.boolean()),
    takeaways: v.array(v.string()),
    content: v.string(),
    youtubeId: v.optional(v.string()),
    youtubeTitle: v.optional(v.string()),
    sources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
    generatedFromPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to publish");
    }

    // Ensure unique slug or append timestamp if conflict
    let targetSlug = args.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!targetSlug) {
      targetSlug = `article-${Date.now()}`;
    }

    const existing = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", targetSlug))
      .first();

    if (existing) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    const contentId = await ctx.db.insert("content", {
      title: args.title,
      slug: targetSlug,
      subtitle: args.subtitle,
      category: args.category,
      author: args.author,
      authorId: userId,
      authorType: args.authorType ?? "human",
      readTime: args.readTime,
      publishedAt: new Date().toISOString(),
      coverImage: args.coverImage,
      coverImageStorageId: args.coverImageStorageId,
      reusedCount: args.reusedCount ?? 0,
      isReused: args.isReused ?? false,
      takeaways: args.takeaways,
      content: args.content,
      youtubeId: args.youtubeId,
      youtubeTitle: args.youtubeTitle,
      sources: args.sources,
      generatedFromPrompt: args.generatedFromPrompt,
    });

    return { contentId, slug: targetSlug };
  },
});
