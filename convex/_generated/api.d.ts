/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentRunner from "../agentRunner.js";
import type * as agents from "../agents.js";
import type * as ai_agentMail from "../ai/agentMail.js";
import type * as ai_imagePrompts from "../ai/imagePrompts.js";
import type * as ai_imagegen from "../ai/imagegen.js";
import type * as ai_language from "../ai/language.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_reuseEngine from "../ai/reuseEngine.js";
import type * as ai_synthesizer from "../ai/synthesizer.js";
import type * as ai_tools_firecrawl from "../ai/tools/firecrawl.js";
import type * as ai_tools_index from "../ai/tools/index.js";
import type * as ai_tts from "../ai/tts.js";
import type * as ai_types from "../ai/types.js";
import type * as ai_youtubeRecommender from "../ai/youtubeRecommender.js";
import type * as auth from "../auth.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as emails_brevo from "../emails/brevo.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as requests from "../requests.js";
import type * as subscribers from "../subscribers.js";
import type * as userDigests from "../userDigests.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentRunner: typeof agentRunner;
  agents: typeof agents;
  "ai/agentMail": typeof ai_agentMail;
  "ai/imagePrompts": typeof ai_imagePrompts;
  "ai/imagegen": typeof ai_imagegen;
  "ai/language": typeof ai_language;
  "ai/prompts": typeof ai_prompts;
  "ai/reuseEngine": typeof ai_reuseEngine;
  "ai/synthesizer": typeof ai_synthesizer;
  "ai/tools/firecrawl": typeof ai_tools_firecrawl;
  "ai/tools/index": typeof ai_tools_index;
  "ai/tts": typeof ai_tts;
  "ai/types": typeof ai_types;
  "ai/youtubeRecommender": typeof ai_youtubeRecommender;
  auth: typeof auth;
  content: typeof content;
  crons: typeof crons;
  "emails/brevo": typeof emails_brevo;
  files: typeof files;
  http: typeof http;
  requests: typeof requests;
  subscribers: typeof subscribers;
  userDigests: typeof userDigests;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
