import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { detectScriptLanguage } from "./ai/language";

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

export const TOPIC_ID_TO_CATEGORY: Record<string, string> = {
  health: "Health & Nutrition",
  cooking: "Cooking & Recipes",
  beauty: "Beauty & Skincare",
  yoga: "Yoga & Fitness",
  wellness: "Mindful Wellness",
  kids: "Kids & Education",
  home: "Home & Living",
  travel: "Travel & Escapes",
  genz: "Gen-Z Trends",
  anime: "Anime & Manga",
};

/**
 * Case-insensitive and alias-aware category matcher.
 */
export function matchesCategory(articleCat: string | undefined, targetCat: string): boolean {
  if (!targetCat || targetCat === "all") return true;
  const a = (articleCat || "").toLowerCase().trim();
  const t = targetCat.toLowerCase().trim();
  if (a === t) return true;
  if (a.includes(t) || t.includes(a)) return true;

  for (const [id, title] of Object.entries(TOPIC_ID_TO_CATEGORY)) {
    const normId = id.toLowerCase();
    const normTitle = title.toLowerCase();
    if (
      (t === normId || t === normTitle) &&
      (a === normId || a === normTitle || a.includes(normId) || normTitle.includes(a))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves a topic ID, alias, or raw category string to its canonical Category title in the database.
 * Returns null if the category is "all", empty, or undefined.
 */
export function resolveCanonicalCategory(inputCategory: string | undefined | null): string | null {
  if (!inputCategory || inputCategory.trim().toLowerCase() === "all") return null;
  const t = inputCategory.trim().toLowerCase();

  if (TOPIC_ID_TO_CATEGORY[t]) {
    return TOPIC_ID_TO_CATEGORY[t];
  }
  for (const [id, title] of Object.entries(TOPIC_ID_TO_CATEGORY)) {
    if (title.toLowerCase() === t || id.toLowerCase() === t) {
      return title;
    }
  }
  for (const [id, title] of Object.entries(TOPIC_ID_TO_CATEGORY)) {
    if (title.toLowerCase().includes(t) || t.includes(id.toLowerCase())) {
      return title;
    }
  }
  return inputCategory.trim();
}

/**
 * Lists published articles with optional category filtering and limit.
 * Bounded index read returning card metadata with resolved CDN image URLs.
 * Uses compound index `by_category_and_reused_count` for O(limit) execution.
 */
export const getPublishedContent = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? DEFAULT_CONTENT_LIMIT, DEFAULT_CONTENT_LIMIT);
    const canonicalCat = resolveCanonicalCategory(args.category);

    let results: Doc<"content">[];
    if (canonicalCat) {
      // Query composite index directly by category and popular reusedCount order (desc)
      results = await ctx.db
        .query("content")
        .withIndex("by_category_and_reused_count", (q) => q.eq("category", canonicalCat))
        .order("desc")
        .take(limit);

      // Fallback: If input category wasn't in canonical list, also check direct category index
      if (results.length === 0 && args.category && args.category !== canonicalCat) {
        results = await ctx.db
          .query("content")
          .withIndex("by_category_and_reused_count", (q) => q.eq("category", args.category!))
          .order("desc")
          .take(limit);
      }
    } else {
      // Bounded index read across all content ordered by popularity (reusedCount desc)
      results = await ctx.db
        .query("content")
        .withIndex("by_reused_count")
        .order("desc")
        .take(limit);
    }

    return await Promise.all(results.map((doc) => toContentCard(ctx, doc)));
  },
});

/**
 * Lists published articles with pagination, category filtering, and search.
 * Returns paginated items with metadata (totalCount, page, totalPages, hasMore).
 */
export const getPaginatedContent = query({
  args: {
    category: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(Math.max(1, args.pageSize ?? 12), 48);
    const canonicalCat = resolveCanonicalCategory(args.category);
    const searchTrim = args.search?.trim().toLowerCase();

    // If search is present, perform search filtering over index-ordered records
    if (searchTrim) {
      let candidateDocs: Doc<"content">[];
      if (canonicalCat) {
        candidateDocs = await ctx.db
          .query("content")
          .withIndex("by_category_and_reused_count", (q) => q.eq("category", canonicalCat))
          .order("desc")
          .collect();
      } else {
        candidateDocs = await ctx.db
          .query("content")
          .withIndex("by_reused_count")
          .order("desc")
          .collect();
      }

      const filtered = candidateDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTrim) ||
          doc.subtitle.toLowerCase().includes(searchTrim) ||
          doc.category.toLowerCase().includes(searchTrim) ||
          doc.author.toLowerCase().includes(searchTrim)
      );

      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const startIndex = (page - 1) * pageSize;
      const pagedDocs = filtered.slice(startIndex, startIndex + pageSize);

      const articles = await Promise.all(pagedDocs.map((doc) => toContentCard(ctx, doc)));
      return {
        articles,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      };
    }

    // Standard pagination without search
    let pagedDocs: Doc<"content">[];
    let totalCount: number;

    if (canonicalCat) {
      const categoryDocs = await ctx.db
        .query("content")
        .withIndex("by_category_and_reused_count", (q) => q.eq("category", canonicalCat))
        .order("desc")
        .collect();

      totalCount = categoryDocs.length;
      const startIndex = (page - 1) * pageSize;
      pagedDocs = categoryDocs.slice(startIndex, startIndex + pageSize);
    } else {
      const allDocs = await ctx.db
        .query("content")
        .withIndex("by_reused_count")
        .order("desc")
        .collect();

      totalCount = allDocs.length;
      const startIndex = (page - 1) * pageSize;
      pagedDocs = allDocs.slice(startIndex, startIndex + pageSize);
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const articles = await Promise.all(pagedDocs.map((doc) => toContentCard(ctx, doc)));

    return {
      articles,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
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

      // Explicit projection: never spread the whole document to the client.
      // `generatedFromPrompt` holds the user's raw request text, and this route
      // is public, so returning the full doc published it at a guessable URL.
      return {
        _id: article._id,
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        category: article.category,
        author: article.author,
        authorType: article.authorType,
        readTime: article.readTime,
        publishedAt: article.publishedAt,
        reusedCount: article.reusedCount,
        isReused: article.isReused,
        takeaways: article.takeaways,
        content: article.content,
        youtubeId: article.youtubeId,
        youtubeTitle: article.youtubeTitle,
        sources: article.sources,
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
      language: detectScriptLanguage(args.title),
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
      language: detectScriptLanguage(args.title),
    });

    return { contentId, slug: targetSlug };
  },
});
