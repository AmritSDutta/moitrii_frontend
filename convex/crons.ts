import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Autonomous hourly cron job that evaluates due wake cycles (gated by each
 * agent's IST wakeTimeOfDay) and processes queued user research requests.
 * Uses crons.hourly without minuteUTC so Convex automatically selects an
 * off-peak minute and spreads execution away from the top of the hour.
 */
crons.hourly(
  "autonomous-agent-wake-cycle",
  {},
  internal.agentRunner.triggerScheduledWakes,
  {}
);

/**
 * Daily retention cleanup cron job that purges expired research requests/todos
 * older than the 3-day TTL window.
 */
crons.interval(
  "daily-todo-retention-cleanup",
  { hours: 24 },
  internal.requests.cleanupExpiredRequests,
  {}
);

export default crons;
