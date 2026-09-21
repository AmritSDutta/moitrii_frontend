/// <reference types="vite/client" />
import { expect, test } from "vitest";
import {
  renderSubscriberWelcomeHtml,
  renderWeeklyDigestHtml,
  sendSubscriberWelcomeEmail,
  sendWeeklyDigestBroadcast,
} from "./brevo";

test("renderSubscriberWelcomeHtml formats warm editorial welcome email with unsubscribe link and filestore logo", () => {
  const html = renderSubscriberWelcomeHtml(
    "subscriber@example.com",
    "https://moitrii.ai",
    "https://brazen-rook-983.convex.site/api/storage/kg27f12h6g3hjmskn5s251hw7x8erg7k"
  );
  expect(html).toContain("subscriber@example.com");
  expect(html).toContain("Welcome to your weekly intentional digest");
  expect(html).toContain("https://moitrii.ai/unsubscribe?email=subscriber%40example.com");
  expect(html).toContain("https://brazen-rook-983.convex.site/api/storage/kg27f12h6g3hjmskn5s251hw7x8erg7k");
  expect(html).toContain("Our Editorial Promise:");
  expect(html).toContain("Moitrii Platform • Powered by Brevo Delivery");
});

test("renderWeeklyDigestHtml formats weekly digest with top article cards, takeaways, unsubscribe link, and logo", () => {
  const html = renderWeeklyDigestHtml(
    [
      {
        title: "Mindful Morning Herbal Infusions",
        subtitle: "Ancient Ayurvedic blends for morning clarity",
        slug: "morning-herbal-infusions",
        category: "wellness",
        readTime: "4 min read",
        takeaways: ["Drink warm ginger water", "Breathe deeply for 5 minutes"],
      },
    ],
    "reader@example.com",
    "https://moitrii.ai",
    "https://brazen-rook-983.convex.site/api/storage/kg27f12h6g3hjmskn5s251hw7x8erg7k"
  );

  expect(html).toContain("Mindful Morning Herbal Infusions");
  expect(html).toContain("Ancient Ayurvedic blends for morning clarity");
  expect(html).toContain("https://moitrii.ai/content/morning-herbal-infusions");
  expect(html).toContain("Drink warm ginger water");
  expect(html).toContain("https://moitrii.ai/unsubscribe?email=reader%40example.com");
  expect(html).toContain("https://brazen-rook-983.convex.site/api/storage/kg27f12h6g3hjmskn5s251hw7x8erg7k");
  expect(html).toContain("4 min read");
});

test("sendSubscriberWelcomeEmail handles delivery gracefully in mock mode", async () => {
  const sent = await sendSubscriberWelcomeEmail(
    "subscriber@example.com",
    undefined,
    undefined,
    "https://example.com/logo.jpg"
  );
  expect(sent).toBe(true);
});

test("sendWeeklyDigestBroadcast delivers batch gracefully in mock mode", async () => {
  const result = await sendWeeklyDigestBroadcast(
    ["sub1@example.com", "sub2@example.com"],
    [
      {
        title: "Mindful Living Guide",
        subtitle: "Gentle daily habits",
        slug: "mindful-living-guide",
        category: "wellness",
      },
    ],
    undefined,
    undefined,
    "https://example.com/logo.jpg"
  );
  expect(result.sentCount).toBe(2);
});
