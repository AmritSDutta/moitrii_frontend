import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Lists all research requests for the currently authenticated user.
 */
export const listUserRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return requests;
  },
});

/**
 * Creates a new research request in the agent's queue.
 */
export const createRequest = mutation({
  args: {
    prompt: v.string(),
    category: v.optional(v.string()),
    scheduledFor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Must be logged in to create a request");
    }

    const user = await ctx.db.get(userId);
    if (user && (user as any).isActive === false) {
      throw new Error("Account is inactive or under review");
    }

    const trimmedPrompt = args.prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt cannot be empty");
    }

    const now = new Date();
    const submittedAtFormatted = `${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const requestId = await ctx.db.insert("requests", {
      userId,
      prompt: trimmedPrompt,
      category: args.category ?? "General Wellness",
      status: "PENDING",
      submittedAt: submittedAtFormatted,
      scheduledFor: args.scheduledFor ?? "Next Wake-Up Cycle (Tomorrow, 08:00 AM)",
      isReused: false,
    });

    return requestId;
  },
});
