/// <reference types="vite/client" />
import { expect, test } from "vitest";
import {
  renderSubscriberWelcomeHtml,
  renderWeeklyDigestHtml,
  sendSubscriberWelcomeEmail,
  sendWeeklyDigestBroadcast,
} from "./brevo";

test("renderSubscriberWelcomeHtml formats warm editorial welcome email", () => {
  const html = renderSubscriberWelcomeHtml("subscriber@example.com");
  expect(html).toContain("subscriber@example.com");
  expect(html).toContain("Welcome to your weekly intentional digest");
  expect(html).toContain("Moitrii Platform • Powered by Brevo Delivery");
});

test("renderWeeklyDigestHtml formats weekly digest with article cards", () => {
  const html = renderWeeklyDigestHtml([
    {
      title: "Mindful Morning Herbal Infusions",
      subtitle: "Ancient Ayurvedic blends for morning clarity",
      slug: "morning-herbal-infusions",
      category: "wellness",
    },
  ]);
  expect(html).toContain("Mindful Morning Herbal Infusions");
  expect(html).toContain("morning-herbal-infusions");
  expect(html).toContain("wellness");
});

test("sendSubscriberWelcomeEmail handles delivery gracefully in mock mode", async () => {
  const sent = await sendSubscriberWelcomeEmail("subscriber@example.com");
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
    ]
  );
  expect(result.sentCount).toBe(2);
});
