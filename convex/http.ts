import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Callback endpoint for the Python AI Agent service to report completed research
 * deliverables and transition agent back to SLEEPING state.
 */
http.route({
  path: "/api/agent/complete",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const authHeader = req.headers.get("authorization") || req.headers.get("x-agent-secret");
      const configuredSecret = process.env.AGENT_SERVICE_SECRET;

      if (configuredSecret && authHeader !== configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json() as {
        agentId: any;
        deliverables: Array<{
          requestId: any;
          contentId?: string;
          contentTitle?: string;
          isReused: boolean;
          reuseNote?: string;
        }>;
      };

      if (!body.agentId || !Array.isArray(body.deliverables)) {
        return new Response(JSON.stringify({ error: "Invalid payload: agentId and deliverables required." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await ctx.runMutation(internal.agentRunner.completeAgentTask, {
        agentId: body.agentId,
        deliverables: body.deliverables,
      });

      return new Response(JSON.stringify({ success: true, message: "Agent task marked completed." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
