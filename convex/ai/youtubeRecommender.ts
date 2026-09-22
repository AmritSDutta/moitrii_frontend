export interface VideoCompanion {
  youtubeId: string;
  youtubeTitle: string;
}

export const TOPIC_RULES: Array<{ pattern: RegExp; companion: VideoCompanion }> = [
  {
    pattern: /\b(tea|drink|juice|smoothie|kadha|infusion|beverage|herbal|chai)\b/i,
    companion: {
      youtubeId: "t_4rKqgq7gI",
      youtubeTitle: "Herbal Teas, Warm Kadhas & Healing Infusions Guide",
    },
  },
  {
    pattern: /\b(cook|food|recipe|diet|nutrition|meal|kitchen|spice|curry|breakfast|lunch|dinner|snack|gut|digestion)\b/i,
    companion: {
      youtubeId: "t_4rKqgq7gI",
      youtubeTitle: "Mindful Ayurvedic Cooking & Seasonal Nourishment",
    },
  },
  {
    pattern: /\b(sleep|night|insomnia|bedtime|rest|evening|circadian|melatonin)\b/i,
    companion: {
      youtubeId: "1ZYbU82GVz4",
      youtubeTitle: "Restorative Sleep Hygiene & Evening Wind-Down Rituals",
    },
  },
  {
    pattern: /\b(skin|beauty|face|facial|massage|glow|hair|oil|dermatology|complexion)\b/i,
    companion: {
      youtubeId: "bO1fR3Hn6d4",
      youtubeTitle: "Holistic Skin Care & Gentle Facial Massage Rituals",
    },
  },
  {
    pattern: /\b(breath|pranayama|stress|calm|anxiety|meditat|relax|mindful|mental|burnout|peace)\b/i,
    companion: {
      youtubeId: "inpok4MKVLM",
      youtubeTitle: "5-Minute Guided Breathing Exercise for Stress Relief",
    },
  },
  {
    pattern: /\b(yoga|stretch|asana|morning|posture|flexib|pilates|movement|energy)\b/i,
    companion: {
      youtubeId: "v7AYKMP6rOE",
      youtubeTitle: "15-Minute Daily Morning Yoga for Energy & Clarity",
    },
  },
  {
    pattern: /\b(parent|kid|child|teen|baby|family|education|maternal|mother)\b/i,
    companion: {
      youtubeId: "inpok4MKVLM",
      youtubeTitle: "Mindful Parenting & Emotional Co-Regulation Practices",
    },
  },
  {
    pattern: /\b(travel|explore|trip|vacation|heritage|culture|nature|destination|flight)\b/i,
    companion: {
      youtubeId: "LXb3EKWsInQ",
      youtubeTitle: "Slow Travel & Cultural Explorations",
    },
  },
  {
    pattern: /\b(home|decor|plant|space|organi|declutter|minimal|living|room)\b/i,
    companion: {
      youtubeId: "LXb3EKWsInQ",
      youtubeTitle: "Creating Calming Living Spaces & Mindful Home Organization",
    },
  },
];

export const CURATED_COMPANIONS: Record<string, VideoCompanion> = {
  wellness: {
    youtubeId: "v7AYKMP6rOE",
    youtubeTitle: "15-Minute Daily Morning Yoga for Energy & Clarity",
  },
  food: {
    youtubeId: "t_4rKqgq7gI",
    youtubeTitle: "Mindful Ayurvedic Cooking & Seasonal Nourishment",
  },
  beauty: {
    youtubeId: "bO1fR3Hn6d4",
    youtubeTitle: "Holistic Skin Care & Gentle Facial Massage Rituals",
  },
  travel: {
    youtubeId: "LXb3EKWsInQ",
    youtubeTitle: "Slow Travel & Cultural Explorations",
  },
  health: {
    youtubeId: "inpok4MKVLM",
    youtubeTitle: "5-Minute Guided Breathing Exercise for Stress Relief",
  },
  parenting: {
    youtubeId: "inpok4MKVLM",
    youtubeTitle: "Mindful Parenting & Emotional Resilience",
  },
  default: {
    youtubeId: "v7AYKMP6rOE",
    youtubeTitle: "Mindful Living & Daily Grounding Practices",
  },
};

/**
 * Decodes HTML entities returned by YouTube API snippet titles.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10);
        return code === 160 ? " " : String.fromCodePoint(code);
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        const code = parseInt(hex, 16);
        return code === 0xa0 ? " " : String.fromCodePoint(code);
      } catch {
        return _;
      }
    });
}

/**
 * Searches the live YouTube Data API v3 for the most relevant embeddable lifestyle video.
 * Enforces YouTube Developer Policies: videoEmbeddable=true, videoSyndicated=true, safeSearch=moderate.
 * Returns null if API key is not configured, quota is exhausted, or search fails.
 */
export async function searchYouTubeLive(
  query: string,
  apiKey?: string
): Promise<VideoCompanion | null> {
  const key = apiKey || (typeof process !== "undefined" ? process.env.YOUTUBE_API_KEY : undefined);
  if (!key || !query || query.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("videoSyndicated", "true");
    url.searchParams.set("safeSearch", "moderate");
    url.searchParams.set("order", "relevance");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("q", query.trim());
    url.searchParams.set("key", key);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[youtubeRecommender] YouTube search HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string };
      }>;
    };

    const firstItem = data.items?.[0];
    const videoId = firstItem?.id?.videoId;
    const title = firstItem?.snippet?.title;

    if (videoId && title) {
      return {
        youtubeId: videoId,
        youtubeTitle: decodeHtmlEntities(title),
      };
    }

    return null;
  } catch (err) {
    console.warn("[youtubeRecommender] YouTube search network/abort error:", err);
    return null;
  }
}

/**
 * Finds a matching video companion embed for a guide topic by analyzing both prompt text and category.
 * Synchronous deterministic fallback catalog.
 */
export function discoverVideoCompanion(category: string, prompt?: string): VideoCompanion {
  const combinedText = `${category} ${prompt || ""}`.toLowerCase();

  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(combinedText)) {
      return rule.companion;
    }
  }

  const normCat = category.toLowerCase().trim();
  return CURATED_COMPANIONS[normCat] || CURATED_COMPANIONS.default;
}

/**
 * Resolves a video companion with live YouTube Data API search and seamless fallback.
 */
export async function resolveVideoCompanionAsync(
  category: string,
  prompt?: string,
  apiKey?: string
): Promise<VideoCompanion> {
  const query = (prompt ? `${prompt} ${category}` : category).trim();
  const liveResult = await searchYouTubeLive(query, apiKey);
  if (liveResult) {
    return liveResult;
  }
  return discoverVideoCompanion(category, prompt);
}

export const recommendYouTubeCompanion = discoverVideoCompanion;
export const resolveVideoCompanion = resolveVideoCompanionAsync;
