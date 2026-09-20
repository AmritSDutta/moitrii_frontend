import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Autonomous hourly cron job that evaluates due wake cycles (gated by each
 * agent's IST wakeTimeOfDay), checks for queued user research requests, and
 * dispatches wake execution webhooks to the Python agent backend.
 */
crons.cron(
  "autonomous-agent-wake-cycle",
  "30 * * * *", // 30 mins past each hour; IST offset is +5:30, so this aligns with :00 IST boundaries
  internal.agentRunner.triggerScheduledWakes,
  {}
);

export default crons;
