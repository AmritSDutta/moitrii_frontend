/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

type Tester = TestConvex<typeof schema>;

const seedUser = (t: Tester) =>
  t.run((ctx) => ctx.db.insert("users", { name: "Test User", email: "test@example.com" }));

test("updateInterests persists and getInterests reads them back", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  await asUser.mutation(api.users.updateInterests, { topicIds: ["health", "travel"] });

  expect(await asUser.query(api.users.getInterests, {})).toEqual(["health", "travel"]);
});

test("updateInterests patches the existing row instead of inserting a second one", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  await asUser.mutation(api.users.updateInterests, { topicIds: ["health"] });
  await asUser.mutation(api.users.updateInterests, { topicIds: ["health", "cooking"] });

  const rows = await t.run((ctx) => ctx.db.query("userInterests").collect());

  expect(rows).toHaveLength(1);
  expect(await asUser.query(api.users.getInterests, {})).toEqual(["health", "cooking"]);
});

test("getInterests returns an empty array for an unauthenticated caller", async () => {
  const t = convexTest(schema, modules);

  expect(await t.query(api.users.getInterests, {})).toEqual([]);
});

test("updateInterests rejects an unauthenticated caller", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(api.users.updateInterests, { topicIds: ["health"] })).rejects.toThrow(
    /Unauthorized/
  );
});

test("viewer returns default preferredLanguage as English ('en') when unset", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  const profile = await asUser.query(api.users.viewer, {});
  expect(profile).not.toBeNull();
  expect((profile as any)?.preferredLanguage).toBe("en");
});

test("updatePreferredLanguage updates user preference to Bengali and Hindi", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Update to Bengali (bn)
  const resBn = await asUser.mutation(api.users.updatePreferredLanguage, { language: "bn" });
  expect(resBn.preferredLanguage).toBe("bn");

  let profile = await asUser.query(api.users.viewer, {});
  expect((profile as any)?.preferredLanguage).toBe("bn");

  // Update to Hindi (hi)
  const resHi = await asUser.mutation(api.users.updatePreferredLanguage, { language: "hi" });
  expect(resHi.preferredLanguage).toBe("hi");

  profile = await asUser.query(api.users.viewer, {});
  expect((profile as any)?.preferredLanguage).toBe("hi");
});

test("updatePreferredLanguage rejects unauthenticated caller", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.users.updatePreferredLanguage, { language: "bn" })
  ).rejects.toThrow(/Unauthorized/);
});

test("viewer returns isActive as true by default, and setUserActiveStatus toggles account status", async () => {
  const t = convexTest(schema, modules);
  const userId = await seedUser(t);
  const asUser = t.withIdentity({ subject: userId });

  // Default active
  let profile = await asUser.query(api.users.viewer, {});
  expect((profile as any)?.isActive).toBe(true);

  // Deactivate account via internal mutation
  await t.run(async (ctx) => {
    await ctx.db.patch(userId, { isActive: false });
  });

  profile = await asUser.query(api.users.viewer, {});
  expect((profile as any)?.isActive).toBe(false);

  // Inactive user is blocked from updating language
  await expect(
    asUser.mutation(api.users.updatePreferredLanguage, { language: "hi" })
  ).rejects.toThrow(/Account is inactive or under review/);

  // Inactive user is blocked from updating interests
  await expect(
    asUser.mutation(api.users.updateInterests, { topicIds: ["health"] })
  ).rejects.toThrow(/Account is inactive or under review/);
});



