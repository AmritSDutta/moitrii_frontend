import type { Id } from "../_generated/dataModel";

export type SupportedLanguage = "en" | "bn" | "hi";

export interface ArticleSource {
  title: string;
  url: string;
}

export interface SynthesizedGuide {
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  readTime: string;
  coverImage: string;
  takeaways: string[];
  markdownBody: string;
  youtubeId?: string;
  youtubeTitle?: string;
  sources: ArticleSource[];
  language: SupportedLanguage;
}

export interface ReuseEvaluationResult {
  isReused: boolean;
  contentId?: string;
  contentTitle?: string;
  reuseNote?: string;
  matchedSlug?: string;
}

export interface AgentDeliverableSummary {
  requestId: Id<"requests">;
  title: string;
  slug?: string;
  takeaways?: string[];
  isReused: boolean;
  contentId?: string;
  audioUrl?: string;
}

export interface AgentNotificationPayload {
  agentName: string;
  agentEmail: string;
  userEmail: string;
  userName: string;
  preferredLanguage?: string;
  deliverables: AgentDeliverableSummary[];
}
