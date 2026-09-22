import { beforeEach } from "vitest";

beforeEach(() => {
  // Guarantee external API keys are strictly blanked during tests so no dev/prod keys are ever used
  process.env.YOUTUBE_API_KEY = "";
  process.env.OPENAI_API_KEY = "";
  process.env.FIRECRAWL_API_KEY = "";
  process.env.AGENTMAIL_API_KEY = "";
  process.env.SARVAM_API_KEY = "";
});
