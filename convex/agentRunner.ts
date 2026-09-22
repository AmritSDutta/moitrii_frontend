import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal, components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { WorkflowManager } from "@convex-dev/workflow";
import { computeAgentEmail, computeAgentName } from "./agents";
import { evaluateContentReuse } from "./ai/reuseEngine";
import { synthesizeLifestyleGuide } from "./ai/synthesizer";
import { generateAndStoreAudioNarration } from "./ai/tts";
import { discoverVideoCompanion } from "./ai/research";
import { searchWebWithFirecrawl } from "./ai/firecrawl";
import { sendAgentCompletionNotification } from "./ai/agentMail";
import type { SupportedLanguage, SynthesizedGuide } from "./ai/types";

export const workflow = new WorkflowManager((components as any).workflow);

const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * How long after an agent's scheduled wake time (IST) the hourly cron keeps
 * considering it due. Matches the cron's hourly cadence.
 */
export const DISPATCH_WINDOW_MINUTES = 60;

/** Minutes since midnight in IST for an ISO 8601 instant, or -1 if unparseable. */
export function istMinutesNow(nowIso: string): number {
  const ms = Date.parse(nowIso);
  if (Number.isNaN(ms)) return -1;
  const ist = new Date(ms + IST_OFFSET_MINUTES * 60_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

/**
 * True when the agent's daily wake time (normalized IST "HH:mm") falls inside
 * the dispatch window that just elapsed — i.e. the agent is due to wake now.
 */
export function isWakeDue(wakeTimeOfDay: string, nowIstMinutes: number): boolean {
  const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(wakeTimeOfDay.trim());
  if (!match) return false;
  const wakeMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const minutesSinceWake = (nowIstMinutes - wakeMinutes + 1440) % 1440;
  return minutesSinceWake < DISPATCH_WINDOW_MINUTES;
}

/**
 * Finds agents that have pending user requests queued for processing AND whose
 * scheduled wake time (IST) falls inside the elapsed dispatch window.
 */
export const getDueAgentsWithRequests = internalQuery({
  args: {
    nowIso: v.string(),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const nowIstMinutes = istMinutesNow(args.nowIso);
    if (!args.force && nowIstMinutes < 0) {
      return [];
    }

    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .collect();

    if (pendingRequests.length === 0) {
      return [];
    }

    // Group pending requests by userId
    const requestsByUser = new Map<Id<"users">, typeof pendingRequests>();
    for (const req of pendingRequests) {
      const userReqs = requestsByUser.get(req.userId) ?? [];
      userReqs.push(req);
      requestsByUser.set(req.userId, userReqs);
    }

    const dueList = [];
    for (const [userId, reqs] of requestsByUser.entries()) {
      const user = await ctx.db.get(userId);
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!agent) continue;
      if (user && (user as any).isActive === false) continue;
      if (!args.force && !isWakeDue(agent.wakeTimeOfDay ?? "23:00", nowIstMinutes)) continue;

      const agentName = agent.name ?? computeAgentName();
      const agentEmail = agent.email ?? computeAgentEmail(userId);

      dueList.push({
        userId,
        userEmail: user?.email ?? "user@moitrii.ai",
        userName: user?.name ?? "User",
        preferredLanguage: user?.preferredLanguage ?? "en",
        agentId: agent._id,
        agentName,
        agentEmail,
        wakeTimeOfDay: agent.wakeTimeOfDay ?? "23:00",
        timezone: agent.timezone ?? "Asia/Kolkata",
        requests: reqs.map((r) => ({
          id: r._id,
          prompt: r.prompt,
          category: r.category,
        })),
      });
    }

    return dueList;
  },
});

/**
 * Retrieves user profile & agent details for wake orchestration.
 */
export const getUserAndAgentForWake = internalQuery({
  args: {
    userId: v.id("users"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const agent = await ctx.db.get(args.agentId);
    return {
      userId: args.userId,
      userEmail: user?.email ?? "user@moitrii.ai",
      userName: user?.name ?? "User",
      preferredLanguage: user?.preferredLanguage ?? "en",
      agentId: args.agentId,
      agentName: agent?.name ?? computeAgentName(),
      agentEmail: agent?.email ?? computeAgentEmail(args.userId),
    };
  },
});

/**
 * Retrieves a single request record by ID.
 */
export const getRequestById = internalQuery({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

/**
 * Evaluates whether a prompt matches an existing guide in the shared knowledge ecosystem.
 */
export const checkContentReuse = internalMutation({
  args: {
    prompt: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await evaluateContentReuse(ctx, args.prompt, args.category);
  },
});

/**
 * Marks an agent as WORKING and its pending requests as PROCESSING.
 */
export const markAgentWorking = internalMutation({
  args: {
    agentId: v.id("agents"),
    requestIds: v.array(v.id("requests")),
    activeTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (agent) {
      await ctx.db.patch(args.agentId, {
        status: "WORKING",
        statusMessage: "Agent is actively researching and synthesizing lifestyle insights in the background.",
        activeTask: args.activeTask ?? "Synthesizing research requests",
        lastRunAt: new Date().toISOString(),
      });
    }

    for (const reqId of args.requestIds) {
      const doc = await ctx.db.get(reqId);
      if (doc) {
        await ctx.db.patch(reqId, {
          status: "PROCESSING",
        });
      }
    }
  },
});

/**
 * Reverts a dispatch that could not reach the agent service: requests go back
 * to PENDING so the next wake cycle retries them, and the agent goes back to
 * SLEEPING instead of being stranded in WORKING forever.
 */
export const revertAgentWorking = internalMutation({
  args: {
    agentId: v.id("agents"),
    requestIds: v.array(v.id("requests")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (agent) {
      await ctx.db.patch(args.agentId, {
        status: "SLEEPING",
        statusMessage: "The agent service encountered an issue; your queued requests stay safe and will run at the next wake cycle.",
        activeTask: undefined,
      });
    }

    for (const reqId of args.requestIds) {
      const doc = await ctx.db.get(reqId);
      if (doc) {
        await ctx.db.patch(reqId, {
          status: "PENDING",
        });
      }
    }
  },
});

/**
 * Marks an agent back to SLEEPING and its requests as COMPLETED.
 */
export const completeAgentTask = internalMutation({
  args: {
    agentId: v.id("agents"),
    deliverables: v.array(
      v.object({
        requestId: v.id("requests"),
        contentId: v.optional(v.string()),
        contentTitle: v.optional(v.string()),
        isReused: v.boolean(),
        reuseNote: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    for (const deliv of args.deliverables) {
      const doc = await ctx.db.get(deliv.requestId);
      if (doc) {
        await ctx.db.patch(deliv.requestId, {
          status: "COMPLETED",
          completedAt: "Just now",
          contentId: deliv.contentId,
          contentTitle: deliv.contentTitle,
          isReused: deliv.isReused,
          reuseNote: deliv.reuseNote,
        });
      }
    }

    const agent = await ctx.db.get(args.agentId);
    if (agent) {
      await ctx.db.patch(args.agentId, {
        status: "SLEEPING",
        statusMessage: "Your agent finished research and is resting until the next scheduled cycle.",
        lastActiveTime: `Today, ${now}`,
        activeTask: undefined,
      });
    }
  },
});

/**
 * Isolated workflow action step: Web research via Firecrawl & LLM synthesis.
 */
export const researchAndSynthesizeStep = internalAction({
  args: {
    prompt: v.string(),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<SynthesizedGuide> => {
    const webSources = await searchWebWithFirecrawl(
      args.prompt,
      args.category,
      process.env.FIRECRAWL_API_KEY
    );

    const guide = await synthesizeLifestyleGuide(
      args.prompt,
      args.category ?? "wellness",
      (args.language as SupportedLanguage) || "en",
      process.env.OPENAI_API_KEY,
      webSources
    );

    const companion = discoverVideoCompanion(args.category ?? "wellness", args.prompt);
    guide.youtubeId = companion.youtubeId;
    guide.youtubeTitle = companion.youtubeTitle;

    return guide;
  },
});

/**
 * Isolated workflow action step: Audio narration generation & storage.
 */
export const narrationStep = internalAction({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<{ audioUrl?: string; audioStorageId?: Id<"_storage"> }> => {
    return await generateAndStoreAudioNarration(
      ctx,
      args.text,
      process.env.OPENAI_API_KEY
    );
  },
});

/**
 * Isolated workflow action step: Notification dispatch via AgentMail.
 */
export const notifyCompletionStep = internalAction({
  args: {
    agentName: v.string(),
    agentEmail: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    preferredLanguage: v.optional(v.string()),
    deliverables: v.array(
      v.object({
        requestId: v.id("requests"),
        title: v.string(),
        slug: v.optional(v.string()),
        takeaways: v.optional(v.array(v.string())),
        isReused: v.boolean(),
        contentId: v.optional(v.string()),
        audioUrl: v.optional(v.string()),
        youtubeId: v.optional(v.string()),
        youtubeTitle: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args): Promise<{ success: boolean }> => {
    await sendAgentCompletionNotification(
      {
        agentName: args.agentName,
        agentEmail: args.agentEmail,
        userEmail: args.userEmail,
        userName: args.userName,
        preferredLanguage: args.preferredLanguage,
        deliverables: args.deliverables,
      },
      process.env.AGENTMAIL_API_KEY
    );
    return { success: true };
  },
});

/**
 * Durable multi-step autonomous user wake workflow orchestrated with @convex-dev/workflow.
 * Features automatic step journaling, per-step backoff retries, and idempotency guarantees.
 */
export const userWakeWorkflow = workflow.define({
  args: {
    userId: v.id("users"),
    agentId: v.id("agents"),
    requestIds: v.array(v.id("requests")),
  },
  handler: async (step, args): Promise<void> => {
    try {
      // Step 1: Mark agent WORKING and requests PROCESSING
      await step.runMutation(internal.agentRunner.markAgentWorking, {
        agentId: args.agentId,
        requestIds: args.requestIds,
        activeTask: `Researching ${args.requestIds.length} lifestyle prompt(s)`,
      });

      const userInfo = await step.runQuery(internal.agentRunner.getUserAndAgentForWake, {
        userId: args.userId,
        agentId: args.agentId,
      });

      const deliverables: Array<{
        requestId: Id<"requests">;
        contentId?: string;
        contentTitle?: string;
        isReused: boolean;
        reuseNote?: string;
        slug?: string;
        takeaways?: string[];
        audioUrl?: string;
        youtubeId?: string;
        youtubeTitle?: string;
      }> = [];

      for (const reqId of args.requestIds) {
        const req = await step.runQuery(internal.agentRunner.getRequestById, { requestId: reqId });
        if (!req) continue;

        const reuseResult = await step.runMutation(internal.agentRunner.checkContentReuse, {
          prompt: req.prompt,
          category: req.category,
        });

        if (reuseResult.isReused && reuseResult.contentId) {
          deliverables.push({
            requestId: req._id,
            contentId: reuseResult.contentId,
            contentTitle: reuseResult.contentTitle,
            isReused: true,
            reuseNote: reuseResult.reuseNote,
            slug: reuseResult.matchedSlug,
          });
        } else {
          const guide = await step.runAction(
            internal.agentRunner.researchAndSynthesizeStep,
            {
              prompt: req.prompt,
              category: req.category,
              language: userInfo.preferredLanguage,
            },
            {
              retry: {
                maxAttempts: 3,
                initialBackoffMs: 1000,
                base: 2,
              },
            }
          );

          const audio = await step.runAction(
            internal.agentRunner.narrationStep,
            {
              text: guide.takeaways.join(". "),
            },
            {
              retry: {
                maxAttempts: 3,
                initialBackoffMs: 1000,
                base: 2,
              },
            }
          );

          const published = await step.runMutation(internal.content.internalPublishGuide, {
            userId: args.userId,
            title: guide.title,
            slug: guide.slug,
            subtitle: guide.subtitle,
            category: guide.category,
            author: userInfo.agentName,
            readTime: guide.readTime,
            coverImage: guide.coverImage,
            audioUrl: audio.audioUrl,
            audioStorageId: audio.audioStorageId as any,
            takeaways: guide.takeaways,
            content: guide.markdownBody,
            youtubeId: guide.youtubeId,
            youtubeTitle: guide.youtubeTitle,
            sources: guide.sources,
            generatedFromPrompt: req.prompt,
          });

          deliverables.push({
            requestId: req._id,
            contentId: published.contentId,
            contentTitle: guide.title,
            isReused: false,
            slug: published.slug,
            takeaways: guide.takeaways,
            audioUrl: audio.audioUrl,
            youtubeId: guide.youtubeId,
            youtubeTitle: guide.youtubeTitle,
          });
        }
      }

      // Step 4: Atomically complete deliverables and transition agent to SLEEPING
      await step.runMutation(internal.agentRunner.completeAgentTask, {
        agentId: args.agentId,
        deliverables: deliverables.map((d) => ({
          requestId: d.requestId,
          contentId: d.contentId,
          contentTitle: d.contentTitle,
          isReused: d.isReused,
          reuseNote: d.reuseNote,
        })),
      });

      // Step 5: Send editorial AgentMail notification
      await step.runAction(
        internal.agentRunner.notifyCompletionStep,
        {
          agentName: userInfo.agentName,
          agentEmail: userInfo.agentEmail,
          userEmail: userInfo.userEmail,
          userName: userInfo.userName,
          preferredLanguage: userInfo.preferredLanguage,
          deliverables: deliverables.map((d) => ({
            requestId: d.requestId,
            title: d.contentTitle ?? "Lifestyle Guide",
            slug: d.slug,
            takeaways: d.takeaways,
            isReused: d.isReused,
            audioUrl: d.audioUrl,
          })),
        },
        {
          retry: {
            maxAttempts: 2,
            initialBackoffMs: 1000,
            base: 2,
          },
        }
      );
    } catch (err) {
      console.error(`[AgentRunner] Workflow execution failed for agent ${args.agentId}:`, err);
      // Revert agent to SLEEPING and requests to PENDING so the next wake cycle retries them
      await step.runMutation(internal.agentRunner.revertAgentWorking, {
        agentId: args.agentId,
        requestIds: args.requestIds,
      });
      throw err;
    }
  },
});

export interface DueAgent {
  userId: Id<"users">;
  userEmail: string;
  userName: string;
  preferredLanguage: string;
  agentId: Id<"agents">;
  agentName: string;
  agentEmail: string;
  wakeTimeOfDay: string;
  timezone: string;
  requests: Array<{ id: Id<"requests">; prompt: string; category: string }>;
}

/**
 * Autonomous Dispatcher action triggered by crons or simulation.
 * Queries due agents with pending requests and starts an isolated @convex-dev/workflow
 * for each user.
 */
export const triggerScheduledWakes = internalAction({
  args: {
    targetUserId: v.optional(v.string()),
    nowIso: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ triggeredCount: number }> => {
    // Actions may read the wall clock; the query must not, so pass it in.
    const dueAgents: DueAgent[] = await ctx.runQuery(internal.agentRunner.getDueAgentsWithRequests, {
      nowIso: args.nowIso ?? new Date().toISOString(),
      force: args.force,
    });

    const targets: DueAgent[] = args.targetUserId
      ? dueAgents.filter((d: DueAgent) => d.userId === args.targetUserId)
      : dueAgents;

    if (targets.length === 0) {
      console.log("Autonomous dispatcher: No due agents with pending requests found.");
      return { triggeredCount: 0 };
    }

    // Fan-out: Start an isolated workflow execution for each due user
    for (const target of targets) {
      const requestIds = target.requests.map((r) => r.id);
      await workflow.start(ctx, internal.agentRunner.userWakeWorkflow, {
        userId: target.userId,
        agentId: target.agentId,
        requestIds,
      });
    }

    console.log(`Autonomous dispatcher: Started ${targets.length} user wake workflow(s).`);
    return { triggeredCount: targets.length };
  },
});
