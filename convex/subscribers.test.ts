/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("subscribeDigest validates and persists subscriber email for anonymous visitors", async () => {
  const t = convexTest(schema, modules);

  const res = await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });
  expect(res.success).toBe(true);

  const rows = await t.run((ctx) => ctx.db.query("subscribers").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].email).toBe("visitor@example.com");
  expect(rows[0].status).toBe("ACTIVE");
});

test("subscribeDigest rejects duplicate insertions gracefully", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });
  await t.mutation(api.subscribers.subscribeDigest, { email: "visitor@example.com" });

  const rows = await t.run((ctx) => ctx.db.query("subscribers").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("ACTIVE");
});

test("subscribeDigest rejects malformed email addresses", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.subscribers.subscribeDigest, { email: "invalid-email" })).rejects.toThrow(
    /Invalid email address format/
  );
});

test("unsubscribeDigest transitions status to UNSUBSCRIBED and records unsubscribedAt", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.subscribers.subscribeDigest, { email: "subscriber@example.com" });
  await t.mutation(api.subscribers.unsubscribeDigest, { email: "subscriber@example.com" });

  const status = await t.query(api.subscribers.getSubscriberStatus, { email: "subscriber@example.com" });
  expect(status.isSubscribed).toBe(false);
  expect(status.status).toBe("UNSUBSCRIBED");

  const active = await t.run((ctx) => ctx.db.query("subscribers").filter((q) => q.eq(q.field("status"), "ACTIVE")).collect());
  expect(active).toHaveLength(0);
});

test("subscribeDigest reactivates an unsubscribed account cleanly", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.subscribers.subscribeDigest, { email: "rejoin@example.com" });
  await t.mutation(api.subscribers.unsubscribeDigest, { email: "rejoin@example.com" });

  let status = await t.query(api.subscribers.getSubscriberStatus, { email: "rejoin@example.com" });
  expect(status.isSubscribed).toBe(false);

  // Resubscribe
  await t.mutation(api.subscribers.subscribeDigest, { email: "rejoin@example.com" });
  status = await t.query(api.subscribers.getSubscriberStatus, { email: "rejoin@example.com" });
  expect(status.isSubscribed).toBe(true);
  expect(status.status).toBe("ACTIVE");
});

test("getTopWeeklyDigestArticles returns top articles ordered by reusedCount without LLM overhead", async () => {
  const t = convexTest(schema, modules);

  // Seed sample content
  await t.run(async (ctx) => {
    await ctx.db.insert("content", {
      title: "Ancient Ayurveda for Modern Mornings",
      subtitle: "Simple herbal rituals for vitality",
      slug: "ancient-ayurveda-mornings",
      category: "wellness",
      author: "Moitrii AI",
      authorType: "agent",
      readTime: "4 min read",
      publishedAt: new Date().toISOString(),
      coverImage: "https://example.com/cover1.jpg",
      reusedCount: 15,
      isReused: false,
      takeaways: ["Drink warm water with ginger", "5 minutes of breathwork"],
      content: "Full guide content here...",
      sources: [{ title: "Ayurvedic Journal", url: "https://example.com" }],
    });

    await ctx.db.insert("content", {
      title: "Mindful Workspace Organization",
      subtitle: "Calm desks for clear minds",
      slug: "mindful-workspace-org",
      category: "home",
      author: "Moitrii AI",
      authorType: "agent",
      readTime: "3 min read",
      publishedAt: new Date().toISOString(),
      coverImage: "https://example.com/cover2.jpg",
      reusedCount: 42,
      isReused: false,
      takeaways: [
        "Keep only essentials in sight",
        "One inbox, processed twice daily",
        "Natural light over overheads",
        "A single plant, honestly watered",
        "Cables hidden, mind uncluttered",
        "Sixth takeaway that must be dropped",
      ],
      content: "Workspace guide...",
      sources: [{ title: "Calm Living", url: "https://example.com" }],
    });
  });

  // Exercise the real internal query, not a re-implementation of it
  const articles = await t.query(internal.subscribers.getTopWeeklyDigestArticles, {});

  expect(articles).toHaveLength(2);
  // Highest reusedCount first
  expect(articles[0].title).toBe("Mindful Workspace Organization");
  expect(articles[0].slug).toBe("mindful-workspace-org");
  expect(articles[0].readTime).toBe("3 min read");
  // Projection caps takeaways at 5
  expect(articles[0].takeaways).toHaveLength(5);
  expect(articles[0].takeaways).not.toContain("Sixth takeaway that must be dropped");
  expect(articles[1].title).toBe("Ancient Ayurveda for Modern Mornings");
});
