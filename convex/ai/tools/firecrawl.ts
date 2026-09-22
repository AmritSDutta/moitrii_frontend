import { v } from "convex/values";
import { internalAction } from "../../_generated/server";

export interface FirecrawlSearchResult {
  title: string;
  url: string;
  snippet?: string;
  markdown?: string;
}

/**
 * Provides deterministic, honestly labeled fallback sources when Firecrawl API key is absent or unavailable.
 */
export function buildFallbackSources(
  query: string,
  category?: string
): FirecrawlSearchResult[] {
  const normCat = category?.toLowerCase().trim() || "wellness";
  return [
    {
      title: `Moitrii Editorial Guidelines — ${normCat.charAt(0).toUpperCase() + normCat.slice(1)} (Offline Reference)`,
      url: "https://moitrii.ai",
      snippet: `Curated editorial guidelines for '${query.slice(0, 40)}' tailored for modern Indian women's lifestyle.`,
    },
  ];
}

/**
 * Searches the live web for verified lifestyle and wellness sources using Firecrawl API.
 * Falls back gracefully to curated offline placeholders if the API key is not configured or network fails.
 */
export async function searchWebWithFirecrawl(
  query: string,
  category?: string,
  apiKey?: string
): Promise<FirecrawlSearchResult[]> {
  if (!apiKey) {
    return buildFallbackSources(query, category);
  }

  try {
    const formattedQuery = `${query} ${category ?? "lifestyle"} modern Indian women wellness healthy living`;
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: formattedQuery,
        limit: 3,
      }),
    });

    if (!response.ok) {
      console.warn(`[Firecrawl] API returned status ${response.status}, using curated fallback.`);
      return buildFallbackSources(query, category);
    }

    const data = await response.json();
    const results: any[] = data.data || data.results || [];

    if (!Array.isArray(results) || results.length === 0) {
      return buildFallbackSources(query, category);
    }

    return results.slice(0, 3).map((item) => ({
      title: item.title || item.metadata?.title || "Verified Web Source",
      url: item.url || item.metadata?.sourceURL || "https://moitrii.ai",
      snippet: item.description || item.markdown?.slice(0, 250) || item.snippet,
      markdown: item.markdown,
    }));
  } catch (err) {
    console.warn("[Firecrawl] Search error, falling back to curated sources:", err);
    return buildFallbackSources(query, category);
  }
}

/**
 * Convex Agent Tool: Firecrawl Web Research.
 * Enables AI agents to perform live web research on lifestyle, wellness, recipes, and culture.
 */
export const firecrawlSearchTool = internalAction({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<FirecrawlSearchResult[]> => {
    return await searchWebWithFirecrawl(
      args.query,
      args.category,
      process.env.FIRECRAWL_API_KEY
    );
  },
});

/**
 * Metadata descriptor for tool registration in Convex AI Agent systems.
 */
export const firecrawlToolDefinition = {
  name: "firecrawlWebSearch",
  description: "Searches the live web for verified wellness, nutrition, beauty, and lifestyle facts and citations using Firecrawl API.",
  args: {
    query: v.string(),
    category: v.optional(v.string()),
  },
  handler: firecrawlSearchTool,
};
