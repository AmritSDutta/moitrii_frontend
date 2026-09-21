/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { evaluateContentReuse } from "./reuseEngine";
import { synthesizeLifestyleGuide } from "./synthesizer";
import { renderEditorialNotificationEmail, sendAgentCompletionNotification } from "./agentMail";
import { discoverVideoCompanion } from "./research";

const modules = import.meta.glob("../**/*.ts");

test("synthesizeLifestyleGuide generates multilingual lifestyle guides in EN, BN, HI", async () => {
  const enGuide = await synthesizeLifestyleGuide("Morning herbal tea ritual", "wellness", "en");
  expect(enGuide.title).toContain("Morning");
  expect(enGuide.language).toBe("en");
  expect(enGuide.takeaways.length).toBeGreaterThan(0);
  expect(enGuide.sources.length).toBeGreaterThan(0);

  const bnGuide = await synthesizeLifestyleGuide("সকালের পুষ্টিকর খাদ্য", "food", "bn");
  expect(bnGuide.language).toBe("bn");
  expect(bnGuide.readTime).toContain("মিনিট");

  const hiGuide = await synthesizeLifestyleGuide("दैनिक प्राणायाम और योग", "wellness", "hi");
  expect(hiGuide.language).toBe("hi");
  expect(hiGuide.readTime).toContain("पठन");
});

test("discoverVideoCompanion returns contextual companion videos", () => {
  const yoga = discoverVideoCompanion("wellness");
  expect(yoga.youtubeId).toBeDefined();
  expect(yoga.youtubeTitle).toContain("Yoga");

  const food = discoverVideoCompanion("food");
  expect(food.youtubeTitle).toContain("Ayurvedic");
});

test("renderEditorialNotificationEmail formats rich HTML email with agent.email sender and takeaways", () => {
  const html = renderEditorialNotificationEmail({
    agentName: "Moitrii Companion for Aditi",
    agentEmail: "agent-123456@agentmail.to",
    userEmail: "aditi@example.com",
    userName: "Aditi",
    deliverables: [
      {
        requestId: "dummy" as any,
        title: "Mindful Morning Tea Ritual",
        slug: "mindful-morning-tea",
        takeaways: ["Start with warm water", "Avoid notifications for 20 minutes"],
        isReused: false,
        audioUrl: "https://example.com/audio.wav",
      },
    ],
  });

  expect(html).toContain("agent-123456@agentmail.to");
  expect(html).toContain("Aditi");
  expect(html).toContain("Mindful Morning Tea Ritual");
  expect(html).toContain("Audio Narration Included");
  expect(html).toContain("Start with warm water");
});

test("sendAgentCompletionNotification handles delivery gracefully", async () => {
  const delivered = await sendAgentCompletionNotification({
    agentName: "Moitrii Companion for Aditi",
    agentEmail: "agent-123456@agentmail.to",
    userEmail: "aditi@example.com",
    userName: "Aditi",
    deliverables: [
      {
        requestId: "dummy" as any,
        title: "Mindful Morning Tea Ritual",
        slug: "mindful-morning-tea",
        isReused: false,
      },
    ],
  });
  expect(delivered).toBe(true);
});

test("evaluateContentReuse detects existing guide and increments reusedCount", async () => {
  const t = convexTest(schema, modules);

  // Insert existing verified guide
  const contentId = await t.run((ctx) =>
    ctx.db.insert("content", {
      title: "Ayurvedic Golden Turmeric Milk for Restful Sleep",
      slug: "ayurvedic-turmeric-milk",
      subtitle: "Ancient evening elixir for deep restorative rest.",
      category: "wellness",
      author: "Moitrii Curators",
      readTime: "3 min read",
      publishedAt: new Date().toISOString(),
      coverImage: "https://images.unsplash.com/photo-1545205597-3d9d02c29597",
      reusedCount: 0,
      isReused: false,
      takeaways: ["Drink warm 30 minutes before sleep", "Include a pinch of black pepper"],
      content: "Turmeric milk has been used for centuries...",
      sources: [{ title: "Ayurveda Studies", url: "https://example.com" }],
    })
  );

  // Test reuse evaluation with matching prompt
  const matchResult = await t.run((ctx) =>
    evaluateContentReuse(ctx, "How to make turmeric milk for sleep?", "wellness")
  );

  expect(matchResult.isReused).toBe(true);
  expect(matchResult.contentId).toBe(contentId);
  expect(matchResult.contentTitle).toContain("Turmeric Milk");

  // Verify reusedCount incremented in database
  const updatedDoc = await t.run((ctx) => ctx.db.get(contentId));
  expect(updatedDoc?.reusedCount).toBe(1);
  expect(updatedDoc?.isReused).toBe(true);

  // Test non-matching prompt
  const noMatchResult = await t.run((ctx) =>
    evaluateContentReuse(ctx, "Quantum computing algorithms for cryptography", "tech")
  );
  expect(noMatchResult.isReused).toBe(false);
});
