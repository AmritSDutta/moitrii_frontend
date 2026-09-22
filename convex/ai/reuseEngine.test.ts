/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { detectScriptLanguage } from "./language";
import { evaluateContentReuse } from "./reuseEngine";

const modules = import.meta.glob("../**/*.ts");

type Tester = TestConvex<typeof schema>;

interface GuideOverrides {
  title?: string;
  slug?: string;
  subtitle?: string;
  takeaways?: string[];
}

const seedGuide = (t: Tester, overrides: GuideOverrides = {}) =>
  t.run((ctx) =>
    ctx.db.insert("content", {
      title: "Unveiling Hidden Gems: Budget Hotels in Darjeeling",
      slug: "darjeeling-budget-hotels",
      subtitle: "Mist-covered tea estates and affordable heritage stays.",
      category: "Travel & Escapes",
      author: "Moitrii Companion",
      readTime: "5 min read",
      publishedAt: new Date().toISOString(),
      coverImage: "https://example.com/cover.jpg",
      reusedCount: 0,
      isReused: false,
      takeaways: [
        "Book estate homestays directly with local cooperatives.",
        "Visit between October and December for clear mountain views.",
      ],
      content: "## Darjeeling\n\nA slow-travel guide to affordable heritage stays.",
      sources: [{ title: "Tea Board of India", url: "https://example.com/tea" }],
      ...overrides,
    })
  );

test("detectScriptLanguage is failsafe and defaults to English", () => {
  expect(detectScriptLanguage(undefined)).toBe("en");
  expect(detectScriptLanguage(null)).toBe("en");
  expect(detectScriptLanguage("")).toBe("en");
  expect(detectScriptLanguage("12345")).toBe("en");
  expect(detectScriptLanguage("Budget Hotels in Digha")).toBe("en");
  // Loose input must never throw — this runs inside the wake workflow.
  expect(detectScriptLanguage(42 as unknown as string)).toBe("en");
  expect(detectScriptLanguage({} as unknown as string)).toBe("en");
});

test("detectScriptLanguage recognizes Devanagari and Bengali titles", () => {
  expect(detectScriptLanguage("दैनिक स्वास्थ्य और संतुलन")).toBe("hi");
  expect(detectScriptLanguage("দৈনন্দিন সুস্থতা ও প্রশান্ত জীবন")).toBe("bn");
  // An English title quoting a Hindi term stays English.
  expect(detectScriptLanguage("Ayurveda and the meaning of दिनचर्या")).toBe("en");
});

test("reuse does not match on generic words alone (Digha vs Darjeeling)", async () => {
  const t = convexTest(schema, modules);
  await seedGuide(t);

  // Regression: this prompt used to reuse the Darjeeling guide at 2/5 = 0.40
  // because the old score divided by min(|prompt|, |candidate|).
  const result = await t.run((ctx) =>
    evaluateContentReuse(ctx, "Budget Hotels in Digha, west Bengal", "Travel & Escapes", "en")
  );

  expect(result.isReused).toBe(false);
});

test("reuse matches a genuinely equivalent prompt", async () => {
  const t = convexTest(schema, modules);
  await seedGuide(t);

  const result = await t.run((ctx) =>
    evaluateContentReuse(ctx, "Budget Hotels in Darjeeling travel", "Travel & Escapes", "en")
  );

  expect(result.isReused).toBe(true);
  expect(result.contentTitle).toContain("Darjeeling");
});

test("a Hindi request never reuses an English guide", async () => {
  const t = convexTest(schema, modules);
  await seedGuide(t);

  // Identical prompt to the passing case above, but the user prefers Hindi.
  const result = await t.run((ctx) =>
    evaluateContentReuse(ctx, "Budget Hotels in Darjeeling travel", "Travel & Escapes", "hi")
  );

  expect(result.isReused).toBe(false);
});

test("a Hindi request reuses a Devanagari guide", async () => {
  const t = convexTest(schema, modules);
  await seedGuide(t, {
    title: "दार्जिलिंग में बजट होटल और होमस्टे की पूरी मार्गदर्शिका",
    slug: "darjeeling-budget-hotels-hi",
  });

  const result = await t.run((ctx) =>
    evaluateContentReuse(ctx, "दार्जिलिंग में बजट होटल और होमस्टे", "Travel & Escapes", "hi")
  );

  expect(result.isReused).toBe(true);
});

test("legacy rows without a stored language are classified from their title", async () => {
  const t = convexTest(schema, modules);
  // No `language` field is written — exactly the shape of pre-existing rows.
  await seedGuide(t);
  await seedGuide(t, {
    title: "দার্জিলিংয়ে বাজেট হোটেল ও হোমস্টে",
    slug: "darjeeling-budget-hotels-bn",
  });

  const bengaliPrompt = await t.run((ctx) =>
    evaluateContentReuse(ctx, "বাজেট হোটেল এবং হোমস্টে দার্জিলিং", "Travel & Escapes", "bn")
  );
  const englishForBengaliUser = await t.run((ctx) =>
    evaluateContentReuse(ctx, "Budget Hotels in Darjeeling travel", "Travel & Escapes", "bn")
  );

  expect(bengaliPrompt.isReused).toBe(true);
  expect(englishForBengaliUser.isReused).toBe(false);
});
