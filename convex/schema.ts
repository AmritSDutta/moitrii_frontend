import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Persistent personal agent states
  agents: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("SLEEPING"),
      v.literal("ACTIVE"),
      v.literal("WORKING"),
      v.literal("WAITING"),
      v.literal("ERROR")
    ),
    statusMessage: v.string(),
    nextWakeTime: v.string(),
    lastActiveTime: v.string(),
    wakeFrequency: v.string(),
    subscriptionTier: v.string(),
    activeTask: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // User topic subscriptions and preferences
  userInterests: defineTable({
    userId: v.id("users"),
    topicIds: v.array(v.string()),
  }).index("by_user", ["userId"]),

  // User research requests queue & lifecycle
  requests: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    category: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED")
    ),
    submittedAt: v.string(),
    scheduledFor: v.string(),
    completedAt: v.optional(v.string()),
    contentId: v.optional(v.string()),
    contentTitle: v.optional(v.string()),
    isReused: v.boolean(),
    reuseNote: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Shared knowledge library & publisher/agent content
  content: defineTable({
    title: v.string(),
    slug: v.string(),
    subtitle: v.string(),
    category: v.string(),
    author: v.string(),
    authorId: v.optional(v.id("users")),
    authorType: v.optional(v.union(v.literal("human"), v.literal("agent"))),
    readTime: v.string(),
    publishedAt: v.string(),
    coverImage: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    reusedCount: v.number(),
    isReused: v.boolean(),
    takeaways: v.array(v.string()),
    content: v.string(),
    youtubeId: v.optional(v.string()),
    youtubeTitle: v.optional(v.string()),
    sources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
    generatedFromPrompt: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),
});

