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
