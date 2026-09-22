/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { matchesTopicCategory, type UserWithInterests } from "./userDigests";
import type { DigestArticle } from "./emails/brevo";

const modules = import.meta.glob("./**/*.ts");

test("matchesTopicCategory checks topic ID and category name equivalence correctly", () => {
  expect(matchesTopicCategory("Health & Nutrition", ["health"])).toBe(true);
  expect(matchesTopicCategory("health", ["health"])).toBe(true);
  expect(matchesTopicCategory("Yoga & Fitness", ["yoga"])).toBe(true);
  expect(matchesTopicCategory("Cooking & Recipes", ["cooking"])).toBe(true);
  expect(matchesTopicCategory("Mindful Wellness", ["travel"])).toBe(false);
  expect(matchesTopicCategory("Random Category", [])).toBe(true); // Empty preferences matches all
});

test("getArticlesGroupedByCategorySince collects only articles from last 24h and caps at top 5 per category", async () => {
  const t = convexTest(schema, modules);

  const nowMs = Date.now();
  const cutoffIso = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
  const oldIso = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();
  const recentIso = new Date(nowMs - 2 * 60 * 60 * 1000).toISOString();

  await t.run(async (ctx) => {
    // 6 articles in "Health & Nutrition" published in last 24h
    for (let i = 1; i <= 6; i++) {
      await ctx.db.insert("content", {
        title: `Health Guide ${i}`,
        subtitle: `Subtitle ${i}`,
        slug: `health-guide-${i}`,
        category: "Health & Nutrition",
        author: "Moitrii AI",
        readTime: "3 min read",
        publishedAt: recentIso,
        coverImage: "https://example.com/image.jpg",
        reusedCount: i * 10, // Article 6 has highest reusedCount
        isReused: false,
        takeaways: [`Takeaway ${i}`],
        content: "Content...",
        sources: [{ title: "Source", url: "https://example.com" }],
      });
    }

    // 1 old article in "Health & Nutrition" (older than 24h)
    await ctx.db.insert("content", {
      title: "Old Health Guide",
      subtitle: "Old subtitle",
      slug: "old-health-guide",
      category: "Health & Nutrition",
      author: "Moitrii AI",
      readTime: "3 min read",
      publishedAt: oldIso,
      coverImage: "https://example.com/image.jpg",
      reusedCount: 999,
      isReused: false,
      takeaways: ["Old takeaway"],
      content: "Old content...",
      sources: [{ title: "Source", url: "https://example.com" }],
    });

    // 2 articles in "Yoga & Fitness" published in last 24h
    for (let i = 1; i <= 2; i++) {
      await ctx.db.insert("content", {
        title: `Yoga Guide ${i}`,
        subtitle: `Yoga Subtitle ${i}`,
        slug: `yoga-guide-${i}`,
        category: "Yoga & Fitness",
        author: "Moitrii AI",
        readTime: "4 min read",
        publishedAt: recentIso,
        coverImage: "https://example.com/yoga.jpg",
        reusedCount: i * 5,
        isReused: false,
        takeaways: [`Yoga takeaway ${i}`],
        content: "Yoga content...",
        sources: [{ title: "Source", url: "https://example.com" }],
      });
    }
  });

  const grouped: Record<string, DigestArticle[]> = await t.query(
    internal.userDigests.getArticlesGroupedByCategorySince,
    { cutoffIso }
  );

  // Health & Nutrition should have strictly top 5 (out of 6 recent ones, excluding old one)
  expect(grouped["Health & Nutrition"]).toBeDefined();
  expect(grouped["Health & Nutrition"]).toHaveLength(5);
  // Old article must not be present
  expect(grouped["Health & Nutrition"].some((a: DigestArticle) => a.slug === "old-health-guide")).toBe(false);
  // Highest reusedCount first
  expect(grouped["Health & Nutrition"][0].title).toBe("Health Guide 6");

  // Yoga & Fitness should have 2 articles
  expect(grouped["Yoga & Fitness"]).toBeDefined();
  expect(grouped["Yoga & Fitness"]).toHaveLength(2);
});

test("listUsersWithInterests retrieves active users and their selected topic interests", async () => {
  const t = convexTest(schema, modules);

  await t.run(async (ctx) => {
    const user1Id = await ctx.db.insert("users", {
      name: "Priya Sharma",
      email: "priya@example.com",
      preferredLanguage: "en",
      isActive: true,
    });
    await ctx.db.insert("userInterests", {
      userId: user1Id,
      topicIds: ["health", "yoga"],
    });

    const user2Id = await ctx.db.insert("users", {
      name: "Ananya Roy",
      email: "ananya@example.com",
      preferredLanguage: "bn",
      isActive: true,
    });
    await ctx.db.insert("userInterests", {
      userId: user2Id,
      topicIds: ["cooking"],
    });

    // Inactive user
    await ctx.db.insert("users", {
      name: "Inactive User",
      email: "inactive@example.com",
      isActive: false,
    });
  });

  const users: UserWithInterests[] = await t.query(internal.userDigests.listUsersWithInterests, {});

  expect(users).toHaveLength(2);
  const priya = users.find((u: UserWithInterests) => u.email === "priya@example.com");
  expect(priya).toBeDefined();
  expect(priya?.name).toBe("Priya Sharma");
  expect(priya?.topicIds).toEqual(["health", "yoga"]);

  const ananya = users.find((u: UserWithInterests) => u.email === "ananya@example.com");
  expect(ananya).toBeDefined();
  expect(ananya?.topicIds).toEqual(["cooking"]);
});
