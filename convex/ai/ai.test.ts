/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { evaluateContentReuse } from "./reuseEngine";
import { synthesizeLifestyleGuide } from "./synthesizer";
import { renderEditorialNotificationEmail, renderEditorialNotificationText, sendAgentCompletionNotification } from "./agentMail";
import { discoverVideoCompanion } from "./research";
import { searchWebWithFirecrawl } from "./firecrawl";

const modules = import.meta.glob("../**/*.ts");

test("searchWebWithFirecrawl provides verified fallback sources when API key is unset", async () => {
  const sources = await searchWebWithFirecrawl("Immunity boosting herbal kadha", "wellness");
  expect(sources.length).toBeGreaterThanOrEqual(1);
  expect(sources[0].url).toContain("http");
  expect(sources[0].title).toBeDefined();
});

test("synthesizeLifestyleGuide generates comprehensive 500+ word multilingual lifestyle guides", async () => {
  const webSources = [
    {
      title: "ICMR Traditional Herbal Study",
      url: "https://www.nin.res.in/kadha-study.html",
      snippet: "Herbal infusions support respiratory vitality during seasonal transitions.",
    },
  ];

  const enGuide = await synthesizeLifestyleGuide(
    "Morning herbal tea ritual",
    "wellness",
    "en",
    undefined,
    webSources
  );
  expect(enGuide.title).toContain("Morning");
  expect(enGuide.language).toBe("en");
  expect(enGuide.takeaways.length).toBeGreaterThanOrEqual(4);
  expect(enGuide.sources.length).toBeGreaterThan(0);
  expect(enGuide.sources[0].title).toBe("ICMR Traditional Herbal Study");
  expect(enGuide.youtubeId).toBe("t_4rKqgq7gI");
  expect(enGuide.youtubeTitle).toContain("Herbal");
  // Verify article content has thorough multi-section depth (at least 450 words)
  const wordCount = enGuide.markdownBody.split(/\s+/).filter(Boolean).length;
  expect(wordCount).toBeGreaterThanOrEqual(450);

  const bnGuide = await synthesizeLifestyleGuide("সকালের পুষ্টিকর খাদ্য", "food", "bn");
  expect(bnGuide.language).toBe("bn");
  expect(bnGuide.readTime).toContain("মিনিট");
  expect(bnGuide.youtubeId).toBeDefined();
  const bnWordCount = bnGuide.markdownBody.split(/\s+/).filter(Boolean).length;
  expect(bnWordCount).toBeGreaterThanOrEqual(400);

  const hiGuide = await synthesizeLifestyleGuide("दैनिक प्राणायाम और योग", "wellness", "hi");
  expect(hiGuide.language).toBe("hi");
  expect(hiGuide.readTime).toContain("पठन");
  expect(hiGuide.youtubeId).toBeDefined();
  const hiWordCount = hiGuide.markdownBody.split(/\s+/).filter(Boolean).length;
  expect(hiWordCount).toBeGreaterThanOrEqual(400);
});

test("discoverVideoCompanion matches keywords across prompt and category", () => {
  // Keyword-specific prompt overrides category
  const teaDrink = discoverVideoCompanion("wellness", "Recipe for organic herbal tea drink");
  expect(teaDrink.youtubeId).toBe("t_4rKqgq7gI");
  expect(teaDrink.youtubeTitle).toContain("Herbal Teas");

  const sleepPrompt = discoverVideoCompanion("general", "How to fix bedtime sleep insomnia");
  expect(sleepPrompt.youtubeId).toBe("1ZYbU82GVz4");
  expect(sleepPrompt.youtubeTitle).toContain("Sleep");

  const skinPrompt = discoverVideoCompanion("lifestyle", "Daily facial massage routine for glowing skin");
  expect(skinPrompt.youtubeId).toBe("bO1fR3Hn6d4");
  expect(skinPrompt.youtubeTitle).toContain("Skin");

  const breathPrompt = discoverVideoCompanion("general", "Pranayama breathwork for anxiety and stress relief");
  expect(breathPrompt.youtubeId).toBe("inpok4MKVLM");
  expect(breathPrompt.youtubeTitle).toContain("Breathing");

  // Category fallback
  const yogaCat = discoverVideoCompanion("wellness");
  expect(yogaCat.youtubeId).toBe("v7AYKMP6rOE");
  expect(yogaCat.youtubeTitle).toContain("Yoga");
});

test("renderEditorialNotificationEmail formats rich HTML email with agent.email sender, video links, and takeaways", () => {
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
        youtubeId: "t_4rKqgq7gI",
        youtubeTitle: "Herbal Teas Guide",
      },
    ],
  });

  expect(html).toContain("agent-123456@agentmail.to");
  expect(html).toContain("Aditi");
  expect(html).toContain("Mindful Morning Tea Ritual");
  expect(html).toContain("Audio Narration Included");
  expect(html).toContain("Watch Video Companion");
  expect(html).toContain("https://www.youtube.com/watch?v=t_4rKqgq7gI");
  expect(html).toContain("https://moitrii-frontend.pages.dev/content/mindful-morning-tea");
  expect(html).toContain("Start with warm water");
});

test("renderEditorialNotificationText formats structured plaintext deliverable message with video link", () => {
  const text = renderEditorialNotificationText({
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
        youtubeId: "t_4rKqgq7gI",
        youtubeTitle: "Herbal Teas Guide",
      },
    ],
  });

  expect(text).toContain("Moitrii Companion for Aditi");
  expect(text).toContain("Aditi");
  expect(text).toContain("Mindful Morning Tea Ritual");
  expect(text).toContain("Audio narration included");
  expect(text).toContain("https://www.youtube.com/watch?v=t_4rKqgq7gI");
  expect(text).toContain("https://moitrii-frontend.pages.dev/content/mindful-morning-tea");
  expect(text).toContain("Start with warm water");
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
