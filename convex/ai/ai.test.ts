/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import schema from "../schema";
import { evaluateContentReuse } from "./reuseEngine";
import { synthesizeLifestyleGuide, extractResponseContent, parseJsonSafely } from "./synthesizer";
import { renderEditorialNotificationEmail, renderEditorialNotificationText, sendAgentCompletionNotification } from "./agentMail";
import {
  discoverVideoCompanion,
  recommendYouTubeCompanion,
  decodeHtmlEntities,
  searchYouTubeLive,
  resolveVideoCompanionAsync,
} from "./youtubeRecommender";
import { searchWebWithFirecrawl, firecrawlSearchTool, firecrawlToolDefinition } from "./tools";
import { buildSystemPrompt, MOITRII_SYSTEM_PROMPT_TEMPLATE } from "./prompts";
import { INFOGRAPHIC_PROMPT_TEMPLATE, CATEGORY_COVERS, getKeywordUnsplashCover, base64ToUint8Array } from "./imagegen";

const modules = import.meta.glob("../**/*.ts");

test("buildSystemPrompt dynamically injects current date and language instructions", () => {
  expect(MOITRII_SYSTEM_PROMPT_TEMPLATE).toContain("{CURRENT_DATE}");
  expect(MOITRII_SYSTEM_PROMPT_TEMPLATE).toContain("{LANGUAGE_INSTRUCTIONS}");

  const customDate = "Tuesday, September 22, 2026";
  const enPrompt = buildSystemPrompt("en", customDate);
  expect(enPrompt).toContain("You are executing this task on: Tuesday, September 22, 2026.");
  expect(enPrompt).toContain("editorial English");
  expect(enPrompt).toContain("AT LEAST 500 words");
  expect(enPrompt).not.toContain("{CURRENT_DATE}");
  expect(enPrompt).not.toContain("{LANGUAGE_INSTRUCTIONS}");

  const bnPrompt = buildSystemPrompt("bn", customDate);
  expect(bnPrompt).toContain("You are executing this task on: Tuesday, September 22, 2026.");
  expect(bnPrompt).toContain("Bengali (বাংলা)");

  const hiPrompt = buildSystemPrompt("hi");
  expect(hiPrompt).toContain("Hindi (हिन्दी)");
  expect(hiPrompt).toContain("You are executing this task on:");
});

test("searchWebWithFirecrawl provides verified fallback sources when API key is unset", async () => {
  const sources = await searchWebWithFirecrawl("Immunity boosting herbal kadha", "wellness");
  expect(sources.length).toBeGreaterThanOrEqual(1);
  expect(sources[0].url).toContain("http");
  expect(sources[0].title).toBeDefined();
});

test("firecrawlToolDefinition conforms to Convex AI Agent tool specifications", () => {
  expect(firecrawlToolDefinition.name).toBe("firecrawlWebSearch");
  expect(firecrawlToolDefinition.description).toContain("Searches the live web");
  expect(firecrawlToolDefinition.args).toBeDefined();
  expect(firecrawlToolDefinition.handler).toBeDefined();
  expect(firecrawlSearchTool).toBeDefined();
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

test("INFOGRAPHIC_PROMPT_TEMPLATE contains clean pictorial rules, strict no text with watermark exception, horizontal layout, and safety ethics", () => {
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("{image_topic}");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("pictorial");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("STRICTLY NO TEXT");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("WATERMARK (SOLE TEXT EXCEPTION)");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("horizontal landscape");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("NO vulgarity");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("family-safe");
  expect(INFOGRAPHIC_PROMPT_TEMPLATE).toContain("Moitrii");
});

test("getKeywordUnsplashCover extracts keywords from topic and category with resilient fallbacks", () => {
  expect(CATEGORY_COVERS.wellness).toContain("images.unsplash.com");
  expect(CATEGORY_COVERS.food).toContain("images.unsplash.com");
  expect(CATEGORY_COVERS.beauty).toContain("images.unsplash.com");

  // Topic keywords match
  const teaCover = getKeywordUnsplashCover("Ayurvedic kadha recipe and herbal drink", "general");
  expect(teaCover).toBe(CATEGORY_COVERS.food);

  const glowCover = getKeywordUnsplashCover("Daily facial skincare routine for glow", "general");
  expect(glowCover).toBe(CATEGORY_COVERS.beauty);

  const yogaCover = getKeywordUnsplashCover("Morning meditation routine", "wellness");
  expect(yogaCover).toBe(CATEGORY_COVERS.wellness);

  const unknownCatCover = getKeywordUnsplashCover("Mindful reflection", "unknown_category");
  expect(unknownCatCover).toBe(CATEGORY_COVERS.default);
});

test("base64ToUint8Array accurately decodes base64 strings into Blobs without Node Buffer", () => {
  // Test with standard base64 sample string ("Hello Convex" in base64: "SGVsbG8gQ29udmV4")
  const sampleBase64 = "SGVsbG8gQ29udmV4";
  const bytes = base64ToUint8Array(sampleBase64);
  expect(bytes).toBeInstanceOf(Uint8Array);
  expect(bytes.length).toBe(12);

  const decodedText = new TextDecoder().decode(bytes);
  expect(decodedText).toBe("Hello Convex");

  // Verify Blob creation is fully compatible
  const audioBlob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/wav" });
  expect(audioBlob.size).toBe(12);
  expect(audioBlob.type).toBe("audio/wav");

  const imageBlob = new Blob([bytes.buffer as ArrayBuffer], { type: "image/webp" });
  expect(imageBlob.size).toBe(12);
  expect(imageBlob.type).toBe("image/webp");
});

test("extractResponseContent extracts JSON text from both Responses API and Chat Completions API shapes", () => {
  // 1. Responses API output_text
  expect(extractResponseContent({ output_text: '{"title":"Test Responses"}' })).toBe('{"title":"Test Responses"}');

  // 2. Responses API output array
  expect(extractResponseContent({ output: [{ content: [{ text: '{"title":"Test Output Array"}' }] }] })).toBe('{"title":"Test Output Array"}');

  // 3. Chat completions choices array
  expect(extractResponseContent({ choices: [{ message: { content: '{"title":"Test Chat Choices"}' } }] })).toBe('{"title":"Test Chat Choices"}');

  // 4. Null / empty safety
  expect(extractResponseContent(null)).toBeNull();
  expect(extractResponseContent({})).toBeNull();
});

test("parseJsonSafely parses plain JSON and markdown-fenced JSON cleanly", () => {
  const plain = parseJsonSafely('{"title":"Plain Title"}');
  expect(plain.title).toBe("Plain Title");

  const fenced = parseJsonSafely('```json\n{"title":"Fenced Title"}\n```');
  expect(fenced.title).toBe("Fenced Title");

  const genericFenced = parseJsonSafely('```\n{"title":"Generic Fenced"}\n```');
  expect(genericFenced.title).toBe("Generic Fenced");
});

test("discoverVideoCompanion and recommendYouTubeCompanion accurately match contextual YouTube companions", () => {
  const teaCompanion = discoverVideoCompanion("wellness", "Ayurvedic herbal kadha for immunity");
  expect(teaCompanion.youtubeId).toBe("t_4rKqgq7gI");
  expect(teaCompanion.youtubeTitle).toContain("Herbal Teas");

  const sleepCompanion = recommendYouTubeCompanion("lifestyle", "restorative sleep and circadian rhythm");
  expect(sleepCompanion.youtubeId).toBe("1ZYbU82GVz4");
  expect(sleepCompanion.youtubeTitle).toContain("Sleep");

  const beautyCompanion = discoverVideoCompanion("beauty", "facial glow massage");
  expect(beautyCompanion.youtubeId).toBe("bO1fR3Hn6d4");

  const yogaCompanion = discoverVideoCompanion("yoga", "morning stretch asanas");
  expect(yogaCompanion.youtubeId).toBe("v7AYKMP6rOE");

  const defaultCompanion = discoverVideoCompanion("unmatched_category", "something arbitrary");
  expect(defaultCompanion.youtubeId).toBe("v7AYKMP6rOE");
});

test("decodeHtmlEntities properly decodes named, numeric NBSP, and astral plane emoji entities", () => {
  expect(decodeHtmlEntities("Herbal &amp; Green Teas &gt; Coffee")).toBe("Herbal & Green Teas > Coffee");
  expect(decodeHtmlEntities("Women&#39;s Wellness &quot;Guide&quot;")).toBe("Women's Wellness \"Guide\"");
  expect(decodeHtmlEntities("Yoga &amp; Ayurveda: 10&#160;Tips")).toBe("Yoga & Ayurveda: 10 Tips");
  expect(decodeHtmlEntities("Herbal Kadha&#xA0;Ritual")).toBe("Herbal Kadha Ritual");
  expect(decodeHtmlEntities("Mindful Morning &#128512; &amp; Botanical Glow &#x1F33F;")).toBe("Mindful Morning 😀 & Botanical Glow 🌿");
  expect(decodeHtmlEntities("")).toBe("");
});

test("searchYouTubeLive returns null if API key is unset or query is blank", async () => {
  const unsetResult = await searchYouTubeLive("morning yoga", "");
  expect(unsetResult).toBeNull();

  const emptyQueryResult = await searchYouTubeLive("", "dummy_key");
  expect(emptyQueryResult).toBeNull();
});

test("searchYouTubeLive handles 200 OK responses with entity and emoji decoding", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: { videoId: "liveVideo123" },
            snippet: { title: "Morning Kadha &amp; Tea Rituals 10&#160;Tips &#128512;" },
          },
        ],
      }),
    } as any);

    const result = await searchYouTubeLive("morning kadha", "test_api_key");
    expect(result).not.toBeNull();
    expect(result?.youtubeId).toBe("liveVideo123");
    expect(result?.youtubeTitle).toBe("Morning Kadha & Tea Rituals 10 Tips 😀");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("searchYouTubeLive returns null gracefully on HTTP 403 quota exceeded or empty results", async () => {
  const originalFetch = globalThis.fetch;
  try {
    // 1. Quota exceeded HTTP 403
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden: Quota Exceeded",
    } as any);

    const quotaResult = await searchYouTubeLive("morning yoga", "test_api_key");
    expect(quotaResult).toBeNull();

    // 2. Empty items array
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    } as any);

    const emptyResult = await searchYouTubeLive("super rare query with no match", "test_api_key");
    expect(emptyResult).toBeNull();

    // 3. Network fetch rejection
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));
    const networkErrorResult = await searchYouTubeLive("morning yoga", "test_api_key");
    expect(networkErrorResult).toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("resolveVideoCompanionAsync uses live result when available and falls back cleanly when key is unset", async () => {
  const originalFetch = globalThis.fetch;
  try {
    // When live search succeeds
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: { videoId: "dynamicVid789" },
            snippet: { title: "Dynamic Live Herbal Tea Guide" },
          },
        ],
      }),
    } as any);

    const liveResolved = await resolveVideoCompanionAsync("wellness", "Ayurvedic herbal kadha", "test_api_key");
    expect(liveResolved.youtubeId).toBe("dynamicVid789");
    expect(liveResolved.youtubeTitle).toBe("Dynamic Live Herbal Tea Guide");

    // When API key is unset, seamlessly falls back to catalog
    const fallbackResolved = await resolveVideoCompanionAsync("wellness", "Ayurvedic herbal kadha for immunity", "");
    expect(fallbackResolved.youtubeId).toBe("t_4rKqgq7gI");
    expect(fallbackResolved.youtubeTitle).toContain("Herbal Teas");
  } finally {
    globalThis.fetch = originalFetch;
  }
});





