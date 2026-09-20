import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Autonomous hourly cron job that evaluates due wake cycles, checks for queued
 * user research requests, and dispatches wake execution webhooks to the Python agent backend.
 */
crons.hourly(
  "autonomous-agent-wake-cycle",
  { minuteUTC: 30 }, // 30 mins offset aligns with IST (:30) boundaries e.g. 23:00 IST = 17:30 UTC
  internal.agentRunner.triggerScheduledWakes,
  {}
);

export default crons;
