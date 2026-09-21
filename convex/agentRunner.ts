import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { computeAgentEmail, computeAgentName } from "./agents";
import { evaluateContentReuse } from "./ai/reuseEngine";
import { synthesizeLifestyleGuide } from "./ai/synthesizer";
import { generateAndStoreAudioNarration } from "./ai/tts";
import { discoverVideoCompanion } from "./ai/research";
import { sendAgentCompletionNotification } from "./ai/agentMail";
import type { SupportedLanguage } from "./ai/types";

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
  },
  handler: async (ctx, args) => {
    const nowIstMinutes = istMinutesNow(args.nowIso);
    if (nowIstMinutes < 0) {
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
      if (!isWakeDue(agent.wakeTimeOfDay ?? "23:00", nowIstMinutes)) continue;

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
    await ctx.db.patch(args.agentId, {
      status: "WORKING",
      statusMessage: "Agent is actively researching and synthesizing lifestyle insights in the background.",
      activeTask: args.activeTask ?? "Synthesizing research requests",
      lastRunAt: new Date().toISOString(),
    });

    for (const reqId of args.requestIds) {
      await ctx.db.patch(reqId, {
        status: "PROCESSING",
      });
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
    await ctx.db.patch(args.agentId, {
      status: "SLEEPING",
      statusMessage: "The agent service encountered an issue; your queued requests stay safe and will run at the next wake cycle.",
      activeTask: undefined,
    });

    for (const reqId of args.requestIds) {
      await ctx.db.patch(reqId, {
        status: "PENDING",
      });
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
      await ctx.db.patch(deliv.requestId, {
        status: "COMPLETED",
        completedAt: "Just now",
        contentId: deliv.contentId,
        contentTitle: deliv.contentTitle,
        isReused: deliv.isReused,
        reuseNote: deliv.reuseNote,
      });
    }

    await ctx.db.patch(args.agentId, {
      status: "SLEEPING",
      statusMessage: "Your agent finished research and is resting until the next scheduled cycle.",
      lastActiveTime: `Today, ${now}`,
      activeTask: undefined,
    });
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
 * Autonomous action triggered on schedule or manual simulation to execute
 * the native modular Convex AI pipeline for due agents.
 */
export const triggerScheduledWakes = internalAction({
  args: {
    targetUserId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ triggeredCount: number; successCount?: number }> => {
    // Actions may read the wall clock; the query must not, so pass it in.
    const dueAgents: DueAgent[] = await ctx.runQuery(internal.agentRunner.getDueAgentsWithRequests, {
      nowIso: new Date().toISOString(),
    });

    const targets: DueAgent[] = args.targetUserId
      ? dueAgents.filter((d: DueAgent) => d.userId === args.targetUserId)
      : dueAgents;

    if (targets.length === 0) {
      console.log("Autonomous scheduler: No due agents with pending requests found.");
      return { triggeredCount: 0 };
    }

    let successCount = 0;

    for (const target of targets) {
      const requestIds = target.requests.map((r) => r.id);

      // Transition agent and requests to in-progress
      await ctx.runMutation(internal.agentRunner.markAgentWorking, {
        agentId: target.agentId,
        requestIds,
        activeTask: `Researching ${target.requests.length} lifestyle prompt(s)`,
      });

      try {
        const deliverables: Array<{
          requestId: Id<"requests">;
          contentId?: string;
          contentTitle?: string;
          isReused: boolean;
          reuseNote?: string;
          slug?: string;
          takeaways?: string[];
          audioUrl?: string;
        }> = [];

        for (const req of target.requests) {
          // 1. Check knowledge reuse
          const reuseResult = await ctx.runMutation(internal.agentRunner.checkContentReuse, {
            prompt: req.prompt,
            category: req.category,
          });

          if (reuseResult.isReused && reuseResult.contentId) {
            deliverables.push({
              requestId: req.id,
              contentId: reuseResult.contentId,
              contentTitle: reuseResult.contentTitle,
              isReused: true,
              reuseNote: reuseResult.reuseNote,
              slug: reuseResult.matchedSlug,
            });
          } else {
            // 2. Synthesize novel guide in user's preferred language
            const guide = await synthesizeLifestyleGuide(
              req.prompt,
              req.category,
              (target.preferredLanguage as SupportedLanguage) || "en",
              process.env.OPENAI_API_KEY
            );

            // 3. Companion video discovery
            const companion = discoverVideoCompanion(req.category, req.prompt);
            guide.youtubeId = companion.youtubeId;
            guide.youtubeTitle = companion.youtubeTitle;

            // 4. Audio Narration & Convex Storage Upload
            const audio = await generateAndStoreAudioNarration(
              ctx,
              guide.takeaways.join(". "),
              process.env.OPENAI_API_KEY
            );

            // 5. Publish to Shared Knowledge Library
            const published = await ctx.runMutation(internal.content.internalPublishGuide, {
              userId: target.userId,
              title: guide.title,
              slug: guide.slug,
              subtitle: guide.subtitle,
              category: guide.category,
              author: target.agentName,
              readTime: guide.readTime,
              coverImage: guide.coverImage,
              audioUrl: audio.audioUrl,
              audioStorageId: audio.audioStorageId,
              takeaways: guide.takeaways,
              content: guide.markdownBody,
              youtubeId: guide.youtubeId,
              youtubeTitle: guide.youtubeTitle,
              sources: guide.sources,
              generatedFromPrompt: req.prompt,
            });

            deliverables.push({
              requestId: req.id,
              contentId: published.contentId,
              contentTitle: guide.title,
              isReused: false,
              slug: published.slug,
              takeaways: guide.takeaways,
              audioUrl: audio.audioUrl,
            });
          }
        }

        // Atomically complete deliverables and transition agent to SLEEPING
        await ctx.runMutation(internal.agentRunner.completeAgentTask, {
          agentId: target.agentId,
          deliverables: deliverables.map((d) => ({
            requestId: d.requestId,
            contentId: d.contentId,
            contentTitle: d.contentTitle,
            isReused: d.isReused,
            reuseNote: d.reuseNote,
          })),
        });

        // 6. Send AgentMail notification to user from agent.email
        await sendAgentCompletionNotification(
          {
            agentName: target.agentName,
            agentEmail: target.agentEmail,
            userEmail: target.userEmail,
            userName: target.userName,
            preferredLanguage: target.preferredLanguage,
            deliverables: deliverables.map((d) => ({
              requestId: d.requestId,
              title: d.contentTitle ?? "Lifestyle Guide",
              slug: d.slug,
              takeaways: d.takeaways,
              isReused: d.isReused,
              audioUrl: d.audioUrl,
            })),
          },
          process.env.AGENTMAIL_API_KEY
        );

        successCount++;
        console.log(`Completed autonomous agent wake & notification for user ${target.userId}`);
      } catch (err) {
        console.error(`Autonomous agent execution failed for user ${target.userId}:`, err);
        await ctx
          .runMutation(internal.agentRunner.revertAgentWorking, {
            agentId: target.agentId,
            requestIds,
          })
          .catch((revertErr) =>
            console.error(`Failed to revert agent state for user ${target.userId}:`, revertErr)
          );
      }
    }

    return { triggeredCount: targets.length, successCount };
  },
});
