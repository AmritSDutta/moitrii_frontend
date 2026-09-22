/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type Tester = TestConvex<typeof schema>;

const seedUser = (t: Tester) =>
  t.run((ctx) => ctx.db.insert("users", { name: "Test User", email: "test@example.com" }));

const baseContent = (slug: string) => ({
  title: "A Shared Guide",
  slug,
  subtitle: "How to live well",
  category: "Wellness",
  author: "Test Author",
  readTime: "4 min read",
  coverImage: "https://example.com/cover.jpg",
  takeaways: ["Drink water"],
  content: "## Body\n\nSome content.",
  sources: [{ title: "Source", url: "https://example.com" }],
});

test("publishContent rejects an unauthenticated caller", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.content.publishContent, baseContent("guide"))).rejects.toThrow(
    /Unauthorized/
  );
});

test("publishContent slugifies the slug and getContentBySlug finds it", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const result = await asUser.mutation(api.content.publishContent, baseContent("Hello World!"));

  expect(result.slug).toBe("hello-world");

  const article = await asUser.query(api.content.getContentBySlug, { slug: "hello-world" });
  expect(article).toMatchObject({ title: "A Shared Guide", slug: "hello-world" });
});

test("publishing the same slug twice yields a distinct slug", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const first = await asUser.mutation(api.content.publishContent, baseContent("shared-guide"));
  const second = await asUser.mutation(api.content.publishContent, baseContent("shared-guide"));

  expect(first.slug).toBe("shared-guide");
  expect(second.slug).not.toBe(first.slug);
  expect(second.slug.startsWith("shared-guide")).toBe(true);
});

test("publishContent persists optional audioUrl and authorType", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const res = await asUser.mutation(api.content.publishContent, {
    ...baseContent("audio-guide"),
    authorType: "agent",
    audioUrl: "https://example.com/narration.mp3",
  });

  const article = await asUser.query(api.content.getContentBySlug, { slug: res.slug });
  expect(article).not.toBeNull();
  expect((article as any)?.authorType).toBe("agent");
  expect((article as any)?.audioUrl).toBe("https://example.com/narration.mp3");
});

test("getPublishedContent performs case-insensitive and alias-aware category filtering", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  await asUser.mutation(api.content.publishContent, {
    ...baseContent("health-guide"),
    title: "Ayurvedic Nutrition",
    category: "Health & Nutrition",
  });

  await asUser.mutation(api.content.publishContent, {
    ...baseContent("yoga-guide"),
    title: "Morning Yoga Flow",
    category: "Yoga & Fitness",
  });

  // Query with topic ID "health"
  const healthResults = await t.query(api.content.getPublishedContent, { category: "health" });
  expect(healthResults.length).toBe(1);
  expect(healthResults[0].title).toBe("Ayurvedic Nutrition");

  // Query with exact title "Health & Nutrition"
  const exactResults = await t.query(api.content.getPublishedContent, { category: "Health & Nutrition" });
  expect(exactResults.length).toBe(1);
  expect(exactResults[0].title).toBe("Ayurvedic Nutrition");

  // Query with lowercase "yoga & fitness"
  const yogaResults = await t.query(api.content.getPublishedContent, { category: "yoga & fitness" });
  expect(yogaResults.length).toBe(1);
  expect(yogaResults[0].title).toBe("Morning Yoga Flow");

  // Query with "all" returns both
  const allResults = await t.query(api.content.getPublishedContent, { category: "all" });
  expect(allResults.length).toBe(2);
});

test("getPaginatedContent correctly paginates and filters published articles", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Insert 5 test articles
  for (let i = 1; i <= 5; i++) {
    await asUser.mutation(api.content.publishContent, {
      ...baseContent(`guide-${i}`),
      title: `Guide ${i}`,
      category: i % 2 === 0 ? "Cooking & Recipes" : "Mindful Wellness",
      reusedCount: i * 10,
    });
  }

  // Page 1 with pageSize 2 (should get top 2 by reusedCount: Guide 5, Guide 4)
  const page1 = await t.query(api.content.getPaginatedContent, {
    page: 1,
    pageSize: 2,
    category: "all",
  });
  expect(page1.totalCount).toBe(5);
  expect(page1.totalPages).toBe(3);
  expect(page1.articles.length).toBe(2);
  expect(page1.hasMore).toBe(true);
  expect(page1.articles[0].title).toBe("Guide 5");
  expect(page1.articles[1].title).toBe("Guide 4");

  // Page 3 with pageSize 2 (should get 1 remaining: Guide 1)
  const page3 = await t.query(api.content.getPaginatedContent, {
    page: 3,
    pageSize: 2,
    category: "all",
  });
  expect(page3.articles.length).toBe(1);
  expect(page3.hasMore).toBe(false);
  expect(page3.articles[0].title).toBe("Guide 1");

  // Filter by category "cooking"
  const cookingPage = await t.query(api.content.getPaginatedContent, {
    page: 1,
    pageSize: 10,
    category: "cooking",
  });
  expect(cookingPage.totalCount).toBe(2);
  expect(cookingPage.articles.length).toBe(2);

  // Search filter
  const searchResult = await t.query(api.content.getPaginatedContent, {
    page: 1,
    pageSize: 10,
    search: "Guide 3",
  });
  expect(searchResult.totalCount).toBe(1);
  expect(searchResult.articles[0].title).toBe("Guide 3");
});

test("getPublishedContent returns bounded top popular items ordered by reusedCount desc", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Insert 3 items in Cooking with different reused counts
  await asUser.mutation(api.content.publishContent, {
    ...baseContent("cooking-low"),
    title: "Cooking Low",
    category: "Cooking & Recipes",
    reusedCount: 5,
  });
  await asUser.mutation(api.content.publishContent, {
    ...baseContent("cooking-high"),
    title: "Cooking High",
    category: "Cooking & Recipes",
    reusedCount: 50,
  });
  await asUser.mutation(api.content.publishContent, {
    ...baseContent("cooking-mid"),
    title: "Cooking Mid",
    category: "Cooking & Recipes",
    reusedCount: 20,
  });

  // Query with limit 2 for topic "cooking"
  const topCooking = await t.query(api.content.getPublishedContent, {
    category: "cooking",
    limit: 2,
  });

  expect(topCooking.length).toBe(2);
  expect(topCooking[0].title).toBe("Cooking High");
  expect(topCooking[1].title).toBe("Cooking Mid");
});


