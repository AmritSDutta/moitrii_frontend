import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_CONTENT_LIMIT = 24;
const FALLBACK_COVER_IMAGE =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop";

/**
 * Card-facing projection for list views. Resolves storage URLs and ensures stable cover image fallback.
 */
async function toContentCard(ctx: any, doc: Doc<"content">) {
  let coverImage = doc.coverImage;
  if (doc.coverImageStorageId) {
    const storageUrl = await ctx.storage.getUrl(doc.coverImageStorageId);
    if (storageUrl) {
      coverImage = storageUrl;
    }
  }
  if (!coverImage || coverImage.startsWith("blob:")) {
    coverImage = FALLBACK_COVER_IMAGE;
  }

  return {
    _id: doc._id,
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle,
    category: doc.category,
    author: doc.author,
    authorType: doc.authorType,
    readTime: doc.readTime,
    publishedAt: doc.publishedAt,
    coverImage,
    reusedCount: doc.reusedCount,
    isReused: doc.isReused,
    youtubeId: doc.youtubeId,
    youtubeTitle: doc.youtubeTitle,
  };
}

/**
 * Lists published articles with optional category filtering and limit.
 * Bounded read returning card metadata with resolved CDN image URLs.
 */
export const getPublishedContent = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? DEFAULT_CONTENT_LIMIT, DEFAULT_CONTENT_LIMIT);

    const results =
      args.category && args.category !== "all"
        ? await ctx.db
            .query("content")
            .withIndex("by_category", (q) => q.eq("category", args.category!))
            .order("desc")
            .take(limit)
        : await ctx.db.query("content").order("desc").take(limit);

    return await Promise.all(results.map((doc) => toContentCard(ctx, doc)));
  },
});

/**
 * Returns trending / popular articles (highest reusedCount) via index order.
 */
export const getWhatsHot = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 4, DEFAULT_CONTENT_LIMIT);

    const results = await ctx.db
      .query("content")
      .withIndex("by_reused_count")
      .order("desc")
      .take(limit);

    return await Promise.all(results.map((doc) => toContentCard(ctx, doc)));
  },
});

/**
 * Retrieves a single article by its URL slug or ID, resolving storage CDN URLs.
 */
export const getContentBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    let article = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!article) {
      try {
        const byId = await ctx.db.get(args.slug as any);
        if (byId && "title" in byId && "slug" in byId) {
          article = byId as Doc<"content">;
        }
      } catch {
        // not a valid Convex ID
      }
    }

    if (article) {
      let coverImage = article.coverImage;
      if (article.coverImageStorageId) {
        const storageUrl = await ctx.storage.getUrl(article.coverImageStorageId);
        if (storageUrl) {
          coverImage = storageUrl;
        }
      }
      if (!coverImage || coverImage.startsWith("blob:")) {
        coverImage = FALLBACK_COVER_IMAGE;
      }

      let audioUrl = article.audioUrl;
      if (article.audioStorageId) {
        const storageAudioUrl = await ctx.storage.getUrl(article.audioStorageId);
        if (storageAudioUrl) {
          audioUrl = storageAudioUrl;
        }
      }

      return {
        ...article,
        coverImage,
        audioUrl,
      };
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
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
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

    let resolvedCover = args.coverImage;
    if (args.coverImageStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.coverImageStorageId);
      if (storageUrl) {
        resolvedCover = storageUrl;
      }
    }
    if (!resolvedCover || resolvedCover.startsWith("blob:")) {
      resolvedCover = FALLBACK_COVER_IMAGE;
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
      coverImage: resolvedCover,
      coverImageStorageId: args.coverImageStorageId,
      audioUrl: args.audioUrl,
      audioStorageId: args.audioStorageId,
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

/**
 * Autonomous publisher for personal AI agents executing scheduled wakes.
 */
export const internalPublishGuide = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    slug: v.string(),
    subtitle: v.string(),
    category: v.string(),
    author: v.string(),
    readTime: v.string(),
    coverImage: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
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
    let targetSlug = args.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!targetSlug) {
      targetSlug = `guide-${Date.now()}`;
    }

    const existing = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", targetSlug))
      .first();

    if (existing) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    let resolvedCover = args.coverImage;
    if (args.coverImageStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.coverImageStorageId);
      if (storageUrl) {
        resolvedCover = storageUrl;
      }
    }
    if (!resolvedCover || resolvedCover.startsWith("blob:")) {
      resolvedCover = FALLBACK_COVER_IMAGE;
    }

    const contentId = await ctx.db.insert("content", {
      title: args.title,
      slug: targetSlug,
      subtitle: args.subtitle,
      category: args.category,
      author: args.author,
      authorId: args.userId,
      authorType: "agent",
      readTime: args.readTime,
      publishedAt: new Date().toISOString(),
      coverImage: resolvedCover,
      coverImageStorageId: args.coverImageStorageId,
      audioUrl: args.audioUrl,
      audioStorageId: args.audioStorageId,
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
