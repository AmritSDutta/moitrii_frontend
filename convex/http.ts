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

export default http;
