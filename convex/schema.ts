import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Custom user profile extensions (preferred language for AI agent outputs)
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    preferredLanguage: v.optional(
      v.union(v.literal("en"), v.literal("bn"), v.literal("hi"))
    ),
    isActive: v.optional(v.boolean()), // Account status: defaults to true; false blocks wake/requests during disputes
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Persistent personal agent states
  agents: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),         // e.g. "Moitrii Companion for Priya"
    email: v.optional(v.string()),        // Dedicated AgentMail inbox: agent-...@agentmail.to
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
    wakeTimeOfDay: v.optional(v.string()), // 24h format in user timezone, e.g. "23:00"
    timezone: v.optional(v.string()),      // e.g. "Asia/Kolkata"
    subscriptionTier: v.string(),
    activeTask: v.optional(v.string()),
    lastRunAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_wake_time", ["wakeTimeOfDay"]),

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
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"))),
    submittedAt: v.string(),
    scheduledFor: v.string(),
    completedAt: v.optional(v.string()),
    contentId: v.optional(v.string()),
    contentTitle: v.optional(v.string()),
    isReused: v.boolean(),
    reuseNote: v.optional(v.string()),
    expiresAt: v.optional(v.number()), // TTL in epoch ms (3 days from creation)
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_expires_at", ["expiresAt"]),

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
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
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
    .index("by_reused_count", ["reusedCount"])
    .index("by_category_and_reused_count", ["category", "reusedCount"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),

  // Newsletter & intentional weekly digest subscribers
  subscribers: defineTable({
    email: v.string(),
    status: v.optional(v.union(v.literal("ACTIVE"), v.literal("UNSUBSCRIBED"))),
    source: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("bn"), v.literal("hi"))),
    subscribedAt: v.string(),
    unsubscribedAt: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
});


