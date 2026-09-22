export interface VideoCompanion {
  youtubeId: string;
  youtubeTitle: string;
}

const TOPIC_RULES: Array<{ pattern: RegExp; companion: VideoCompanion }> = [
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
 * Finds a matching video companion embed for a guide topic by analyzing both prompt text and category.
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
