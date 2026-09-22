import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface CompletionDeliverable {
  requestId: string;
  contentId?: string;
  contentTitle?: string;
  isReused: boolean;
  reuseNote?: string;
}

interface CompletionBody {
  agentId: string;
  deliverables: CompletionDeliverable[];
}

/**
 * Narrows the untrusted webhook JSON body field by field.
 * Returns null when the payload does not match the completion shape.
 */
export function parseCompletionBody(body: unknown): CompletionBody | null {
  if (typeof body !== "object" || body === null) return null;
  const { agentId, deliverables } = body as Record<string, unknown>;
  if (typeof agentId !== "string" || agentId.length === 0) return null;
  if (!Array.isArray(deliverables)) return null;

  const parsed: CompletionDeliverable[] = [];
  for (const item of deliverables) {
    if (typeof item !== "object" || item === null) return null;
    const d = item as Record<string, unknown>;
    if (typeof d.requestId !== "string" || d.requestId.length === 0) return null;
    if (typeof d.isReused !== "boolean") return null;
    if (d.contentId !== undefined && typeof d.contentId !== "string") return null;
    if (d.contentTitle !== undefined && typeof d.contentTitle !== "string") return null;
    if (d.reuseNote !== undefined && typeof d.reuseNote !== "string") return null;
    parsed.push({
      requestId: d.requestId,
      contentId: d.contentId,
      contentTitle: d.contentTitle,
      isReused: d.isReused,
      reuseNote: d.reuseNote,
    });
  }

  return { agentId, deliverables: parsed };
}

/**
 * Callback endpoint for the Python AI Agent service to report completed research
 * deliverables and transition agent back to SLEEPING state.
 */
http.route({
  path: "/api/agent/complete",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const configuredSecret = process.env.AGENT_SERVICE_SECRET;

      // Fail closed: without a configured secret the mutating webhook stays locked
      // instead of accepting unauthenticated completion reports.
      if (!configuredSecret) {
        return json({ error: "Webhook not configured: AGENT_SERVICE_SECRET is not set." }, 503);
      }

      const authHeader = req.headers.get("authorization") || req.headers.get("x-agent-secret") || "";
      if (authHeader !== configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
        return json({ error: "Unauthorized" }, 401);
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON body." }, 400);
      }

      const parsed = parseCompletionBody(body);
      if (!parsed) {
        return json(
          { error: "Invalid payload: agentId (string) and deliverables (array) required." },
          400
        );
      }

      // Shape-checked above; the mutation's v.id() validators enforce ID format.
      await ctx.runMutation(internal.agentRunner.completeAgentTask, {
        agentId: parsed.agentId as Id<"agents">,
        deliverables: parsed.deliverables.map((d) => ({
          ...d,
          requestId: d.requestId as Id<"requests">,
        })),
      });

      return json({ success: true, message: "Agent task marked completed." }, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return json({ error: message }, 500);
    }
  }),
});

/**
 * Standard /llms.txt endpoint for LLM crawlers and search agents.
 */
http.route({
  path: "/llms.txt",
  method: "GET",
  handler: httpAction(async () => {
    const content = `# Moitrii

> An intentional, calm AI companion and lifestyle magazine platform designed for modern Indian women's holistic well-being, mindful vitality, and daily intentional living.

Moitrii pairs every user with a dedicated, persistent AI agent companion that sleeps, wakes at scheduled hours, conducts verified web research, generates localized editorial guides, synthesizes audio narrations in Indian languages via Sarvam AI, and delivers personalized takeaways.

## Core Features & Interfaces

- [Explore Lifestyle Stories & Knowledge Library](https://moitrii-frontend.pages.dev/explore): Browsable curated guides across Ayurvedic health, nutrition, skincare, yoga, mindful parenting, and Gen-Z culture.
- [Personal Agent Dashboard](https://moitrii-frontend.pages.dev/dashboard): Manage dedicated personal AI companion state, calm-tech sleep/wake schedule countdowns, and real-time request tracking.
- [Topic Onboarding & Preferences](https://moitrii-frontend.pages.dev/onboarding): Interactive interest selection across 10 core lifestyle and wellness categories.
- [Request Center](https://moitrii-frontend.pages.dev/requests): Durable request submission queue with automatic content reuse matching and lifecycle states.
- [Publisher Studio](https://moitrii-frontend.pages.dev/publisher): Community-driven editorial publisher suite with live markdown preview and media upload.
- [Weekly & Daily Digests](https://moitrii-frontend.pages.dev/unsubscribe): Weekly top 10 subscriber digests and personalized daily category insights delivered via Brevo.

## Architecture & Documentation

- [System Architecture](https://moitrii-frontend.pages.dev/docs/architecture): Reactive Single Page Application on React 18 / Vite backed by Convex Cloud realtime database and Edge actions.
- [Convex Best Practices](https://moitrii-frontend.pages.dev/docs/convex-best-practices): Deterministic clock-agnostic queries, off-peak cron distribution, atomic mutations, and binary edge decoding.
- [AI Voice & Audio Generation](https://moitrii-frontend.pages.dev/docs/audio-generation): Sarvam AI Bulbul v3 Indian TTS integration with female voice synthesis and fallback cascade.
- [AI Infographic & Cover Generation](https://moitrii-frontend.pages.dev/docs/image-generation): WebP 16:9 banner generation via OpenAI gpt-image-1 stored directly in Convex File Storage CDN.
- [Manual Testing & Verification](https://moitrii-frontend.pages.dev/docs/manual-testing): Cross-shell CLI commands and test workflows for autonomous agent dispatches.

## Optional & Comprehensive Documentation

- [Complete Technical Specification (llms-full.txt)](https://moitrii-frontend.pages.dev/llms-full.txt): Comprehensive deep-dive specification for LLMs, crawlers, and AI agents.
`;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }),
});

/**
 * Standard /llms-full.txt endpoint for LLM crawlers.
 */
http.route({
  path: "/llms-full.txt",
  method: "GET",
  handler: httpAction(async () => {
    const content = `# Moitrii — Comprehensive LLM Specification & Context

> An intentional, calm AI companion and lifestyle magazine platform designed for modern Indian women's holistic well-being, mindful vitality, and daily intentional living.

## 1. System Overview
Moitrii operates on a "Calm Technology" philosophy. Instead of endless notifications and dark-pattern SaaS feeds, each user has a dedicated personal AI companion that runs on a predictable schedule (e.g. 11:00 PM IST or customized morning/evening cycles).

- Frontend: React 18 + Vite SPA, Tailwind CSS with warm editorial palette (#FAF7F2, #2D4A34).
- Backend: Convex Cloud (realtime database, server functions, scheduled crons, file storage CDN, and HTTP actions).
- Multi-Agent & Workflow Orchestration: @convex-dev/workflow for durable step journaling and failure recovery.
- AI Integrations:
  - Synthesis: OpenAI gpt-5.6-luna (Responses API) with gpt-4o-mini and offline localized templates fallback.
  - Search & Grounding: Firecrawl Web Search API.
  - Voice / Audio: Sarvam AI Bulbul v3 (hi-IN, bn-IN, en-IN, speaker ritu) with OpenAI tts-1 fallback.
  - Media & Infographics: OpenAI gpt-image-1 16:9 WebP generation stored directly in Convex File Storage.
  - Email Notifications: Brevo for subscriber and daily user category digests; AgentMail for dedicated virtual inbox deliverable dispatches.

## 2. Core Lifestyle Topics & Categories
1. Health & Nutrition: Ayurvedic nutrition, hormone balance, immunity, and wholesome everyday meals.
2. Cooking & Recipes: Quick 20-minute dinners, traditional delicacies, and healthy meal preps.
3. Beauty & Skincare: Clean beauty, DIY ubtans, minimalist morning routines, dermat-tested care.
4. Yoga & Fitness: Calm morning flow, posture correction, postpartum recovery, gentle strength.
5. Mindful Wellness: Sleep hygiene, pranayama basics, meditation rituals, digital detox.
6. Kids & Education: Positive parenting, screen-time balance, cognitive development.
7. Home & Living: Warm interior styling, vastu principles, plant care, decluttering.
8. Travel & Escapes: Curated weekend getaways, serene homestays, solo travel tips.
9. Gen-Z Trends: Internet culture, teen communication, social media safety.
10. Anime & Manga: Studio Ghibli guides, age-appropriate anime recommendations for families.

## 3. Email Pipelines
- Pipeline 1 (Weekly Subscriber Digest): Dispatches every Sunday at 12:00 UTC (17:30 IST) to subscribers table via Brevo, featuring top 10 articles by popularity with 0 LLM cost.
- Pipeline 2 (Daily Agent Wake Deliverable): Dispatches to active users when their dedicated agent wakes and completes research on queued user prompts, delivering via AgentMail.
- Pipeline 3 (Daily User Category Digest): Dispatches daily at 02:00 UTC (07:30 AM IST) via Brevo, pre-fetching articles published in the last 24 hours and sending up to top 5 articles in each category selected in user preferences.
`;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }),
});

export default http;

