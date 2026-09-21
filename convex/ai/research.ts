export interface VideoCompanion {
  youtubeId: string;
  youtubeTitle: string;
}

const CURATED_COMPANIONS: Record<string, VideoCompanion> = {
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
 * Finds a matching video companion embed for a guide topic.
 */
export function discoverVideoCompanion(category: string, _prompt?: string): VideoCompanion {
  const normCat = category.toLowerCase().trim();
  return CURATED_COMPANIONS[normCat] || CURATED_COMPANIONS.default;
}
