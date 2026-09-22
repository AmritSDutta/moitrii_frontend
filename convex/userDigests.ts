import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendUserDailyDigestEmail, type DigestArticle } from "./emails/brevo";
import { STATIC_STORAGE_IDS } from "./files";

/**
 * Standard topic ID to canonical category name mapping dictionary.
 */
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
 * Normalizes and checks whether an article category matches any of the user's selected topic IDs or categories.
 */
export function matchesTopicCategory(articleCategory: string, userTopicIds: string[]): boolean {
  if (!userTopicIds || userTopicIds.length === 0) {
    return true;
  }
  const normArt = articleCategory.toLowerCase().trim();
  return userTopicIds.some((tid) => {
    const normTid = tid.toLowerCase().trim();
    if (normArt === normTid) return true;
    const catName = TOPIC_ID_TO_CATEGORY[normTid]?.toLowerCase();
    if (catName && (normArt === catName || normArt.includes(normTid) || catName.includes(normArt))) {
      return true;
    }
    return false;
  });
}

export interface UserWithInterests {
  userId: string;
  email: string;
  name: string;
  preferredLanguage: string;
  topicIds: string[];
}

export interface UserDailyDigestDispatchResult {
  totalUsers: number;
  sentCount: number;
  skippedCount: number;
  categoriesCount: number;
}

/**
 * Internal query to collect all articles published in the last 24 hours (publishedAt >= cutoffIso)
 * grouped by category, with strictly the top 5 articles per category ordered by popularity (reusedCount desc).
 */
export const getArticlesGroupedByCategorySince = internalQuery({
  args: {
    cutoffIso: v.string(),
  },
  handler: async (ctx, args): Promise<Record<string, DigestArticle[]>> => {
    const allArticles = await ctx.db.query("content").collect();

    // Filter strictly for articles published on or after the cutoff ISO timestamp (last 24 hours)
    const recentArticles = allArticles.filter((doc) => doc.publishedAt >= args.cutoffIso);

    const grouped: Record<string, typeof recentArticles> = {};
    for (const doc of recentArticles) {
      const cat = doc.category?.trim() || "Mindful Wellness";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(doc);
    }

    const result: Record<string, DigestArticle[]> = {};
    for (const [category, articles] of Object.entries(grouped)) {
      // Sort by popularity / reusedCount descending, then take strictly top 5
      const top5 = articles
        .sort((a, b) => (b.reusedCount ?? 0) - (a.reusedCount ?? 0))
        .slice(0, 5)
        .map((doc) => ({
          title: doc.title,
          subtitle: doc.subtitle,
          slug: doc.slug,
          category: doc.category,
          takeaways: doc.takeaways?.slice(0, 5) ?? [],
          readTime: doc.readTime,
        }));

      if (top5.length > 0) {
        result[category] = top5;
      }
    }

    return result;
  },
});

/**
 * Internal query to list active users and their registered topic interests.
 */
export const listUsersWithInterests = internalQuery({
  args: {},
  handler: async (ctx): Promise<UserWithInterests[]> => {
    const users = await ctx.db.query("users").collect();
    const activeUsers = users.filter((u) => (u as any).isActive !== false && u.email && u.email.trim().length > 0);

    const usersWithInterests: UserWithInterests[] = [];
    for (const user of activeUsers) {
      const interestDoc = await ctx.db
        .query("userInterests")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      usersWithInterests.push({
        userId: user._id,
        email: user.email!.trim().toLowerCase(),
        name: user.name || user.email!.split("@")[0] || "Friend",
        preferredLanguage: (user as any).preferredLanguage ?? "en",
        topicIds: interestDoc?.topicIds ?? [],
      });
    }

    return usersWithInterests;
  },
});

/**
 * Autonomous daily personalized digest dispatcher triggered by morning cron (Pipeline 3).
 * Collects articles published in the last 24 hours, filters up to 5 articles per opted category for each user,
 * and delivers via Brevo.
 */
export const dispatchUserDailyDigestCron = internalAction({
  args: {
    sinceHours: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<UserDailyDigestDispatchResult> => {
    const hours = args.sinceHours ?? 24;
    const cutoffIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const groupedArticles: Record<string, DigestArticle[]> = await ctx.runQuery(
      internal.userDigests.getArticlesGroupedByCategorySince,
      { cutoffIso }
    );

    const categoriesFound = Object.keys(groupedArticles);
    if (categoriesFound.length === 0) {
      console.log(`[UserDailyDigest] No articles published in the last ${hours} hours. Skipping dispatch.`);
      return { totalUsers: 0, sentCount: 0, skippedCount: 0, categoriesCount: 0 };
    }

    const users: UserWithInterests[] = await ctx.runQuery(internal.userDigests.listUsersWithInterests, {});
    if (users.length === 0) {
      console.log("[UserDailyDigest] No active users found. Skipping dispatch.");
      return { totalUsers: 0, sentCount: 0, skippedCount: 0, categoriesCount: categoriesFound.length };
    }

    console.log(
      `[UserDailyDigest] Processing daily digest for ${users.length} active user(s) across ${categoriesFound.length} 24h category group(s).`
    );

    const logoUrl = await ctx.storage.getUrl(STATIC_STORAGE_IDS.logo);

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const userCategoryMap: Record<string, DigestArticle[]> = {};

      for (const [category, articles] of Object.entries(groupedArticles)) {
        if (matchesTopicCategory(category, user.topicIds)) {
          // Take strictly top 5 in this category
          userCategoryMap[category] = articles.slice(0, 5);
        }
      }

      const totalMatched = Object.values(userCategoryMap).reduce((sum, arr) => sum + arr.length, 0);

      if (totalMatched === 0) {
        // User has no new 24h articles in their opted categories; skip sending today
        skippedCount++;
        continue;
      }

      await sendUserDailyDigestEmail(
        user.email,
        user.name,
        userCategoryMap,
        process.env.BREVO_API_KEY,
        process.env.APP_ORIGIN,
        logoUrl ?? undefined
      );
      sentCount++;
    }

    console.log(
      `[UserDailyDigest] Completed daily broadcast: ${sentCount} sent, ${skippedCount} skipped (no new 24h articles).`
    );

    return {
      totalUsers: users.length,
      sentCount,
      skippedCount,
      categoriesCount: categoriesFound.length,
    };
  },
});

/**
 * Manual testing trigger for developers/admins to test daily user category digest on demand.
 */
export const triggerUserDailyDigestManual = internalAction({
  args: {
    sinceHours: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<UserDailyDigestDispatchResult> => {
    return await ctx.runAction(internal.userDigests.dispatchUserDailyDigestCron, {
      sinceHours: args.sinceHours ?? 24,
    });
  },
});
