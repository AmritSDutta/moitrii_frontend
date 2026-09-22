export interface Topic {
  id: string;
  name: string;
  category: "lifestyle" | "parenting" | "wellness";
  icon: string;
  description: string;
  popularSearches: string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  author: string;
  authorType?: "human" | "agent";
  readTime: string;
  publishedAt: string;
  coverImage: string;
  audioUrl?: string;
  reusedCount: number;
  isReused?: boolean;
  takeaways: string[];
  content: string;
  youtubeId?: string;
  youtubeTitle?: string;
  sources: { title: string; url: string }[];
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  category: string;
  duration: string;
  thumbnail: string;
}

export interface AgentRequest {
  id: string;
  prompt: string;
  category: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  submittedAt: string;
  scheduledFor: string;
  completedAt?: string;
  contentId?: string;
  contentTitle?: string;
  isReused: boolean;
  reuseNote?: string;
}

export interface AgentState {
  status: "SLEEPING" | "ACTIVE" | "WORKING" | "WAITING" | "ERROR";
  statusMessage: string;
  nextWakeTime: string;
  lastActiveTime: string;
  wakeFrequency: "Daily (08:00 AM)" | "Every 12 Hours" | "3x a Week" | string;
  wakeTimeOfDay?: string;
  email?: string;
  timezone?: string;
  subscriptionTier: "Starter" | "Plus" | "Daily Companion" | string;
  activeTask?: string;
}

export const INITIAL_TOPICS: Topic[] = [
  {
    id: "health",
    name: "Health & Nutrition",
    category: "wellness",
    icon: "Heart",
    description: "Ayurvedic nutrition, hormone balance, immunity, and everyday wholesome meals.",
    popularSearches: ["Keto Indian Meal", "Thyroid Diet", "Immunity Boosters", "PCOD Guides"]
  },
  {
    id: "cooking",
    name: "Cooking & Recipes",
    category: "lifestyle",
    icon: "Utensils",
    description: "Quick 20-minute dinners, traditional regional delicacies, and healthy meal preps.",
    popularSearches: ["Instant Pot Biryani", "Millet Dosa", "Low Oil Curries", "Quick Snack Ideas"]
  },
  {
    id: "beauty",
    name: "Beauty & Skincare",
    category: "lifestyle",
    icon: "Sparkles",
    description: "Clean beauty, DIY ubtans, minimalist morning routines, and dermat-tested care.",
    popularSearches: ["Glass Skin Routine", "Sunscreen for Indian Skin", "Hair Fall Remedies", "Minimalist Makeup"]
  },
  {
    id: "yoga",
    name: "Yoga & Fitness",
    category: "wellness",
    icon: "Activity",
    description: "Calm morning flow, posture correction, postpartum recovery, and gentle strength training.",
    popularSearches: ["Desk Yoga", "Surya Namaskar Guide", "Back Pain Relief", "Morning Stretches"]
  },
  {
    id: "wellness",
    name: "Mindful Wellness",
    category: "wellness",
    icon: "Sun",
    description: "Sleep hygiene, mindfulness breathing, meditation rituals, and stress relief for busy minds.",
    popularSearches: ["Sound Sleep Rituals", "Pranayama Basics", "Burnout Recovery", "Digital Detox"]
  },
  {
    id: "kids",
    name: "Kids & Education",
    category: "parenting",
    icon: "GraduationCap",
    description: "Positive parenting, screen-time balance, cognitive development games, and school readiness.",
    popularSearches: ["Healthy Tiffin Ideas", "Montessori Activities", "Screen-Free Weekends", "Kids Reading Habits"]
  },
  {
    id: "home",
    name: "Home & Living",
    category: "lifestyle",
    icon: "Home",
    description: "Warm interior styling, vastu principles, plant care, and minimalist decluttering hacks.",
    popularSearches: ["Balcony Garden Setup", "Kitchen Organization", "Natural Room Scents", "Cozy Corner Decor"]
  },
  {
    id: "travel",
    name: "Travel & Escapes",
    category: "lifestyle",
    icon: "Compass",
    description: "Curated weekend getaways, serene hill-station stays, and family travel itineraries.",
    popularSearches: ["Monsoon in Coorg", "Quiet Darjeeling Homestays", "Solo Travel Tips", "Weekend Road Trips"]
  },
  {
    id: "genz",
    name: "Gen-Z Trends",
    category: "parenting",
    icon: "Zap",
    description: "Bridge the generation gap: internet slang, aesthetic culture, and teenage conversations.",
    popularSearches: ["Understanding Gen-Z Slang", "Social Media Safety", "Teen Mental Well-being", "Pop Culture Trends"]
  },
  {
    id: "anime",
    name: "Anime & Manga",
    category: "parenting",
    icon: "Smile",
    description: "A parent's friendly guide to Studio Ghibli, Shonen anime, and age-appropriate series.",
    popularSearches: ["Ghibli Movies Guide", "Safe Anime for Pre-Teens", "Anime Explained for Parents", "Manga vs Anime"]
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "healthy-drinks-kids",
    title: "5 Wholesome Ayurvedic Drinks Your Children Will Actually Love",
    slug: "healthy-ayurvedic-drinks-kids",
    subtitle: "Delicious, naturally sweet blends packed with roasted almond milk, sattu, and cooling vetiver to replace sugary sodas.",
    category: "Health & Nutrition",
    author: "Moitrii Lifestyle Agent (Verified Nutritionist Model)",
    authorType: "agent",
    readTime: "4 min read",
    publishedAt: "Today, 08:30 AM",
    coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop",
    audioUrl: "https://actions.google.com/sounds/v1/water/rain_on_roof.ogg",
    reusedCount: 24,
    isReused: true,
    takeaways: [
      "Roasted Sattu Cooler provides instant prebiotic fiber and plant protein for active school days.",
      "Badam-Kesar milk with a pinch of nutmeg calms the nervous system before bedtime.",
      "Bael & Mint sherbet naturally regulates gut flora and protects against hot weather fatigue."
    ],
    content: `
### Why Traditional Refreshers Beat Packaged Juices

When children return from school or sports practice, their natural inclination is to seek something cool, flavorful, and invigorating. Most commercially packaged fruit juices contain upwards of 24 grams of added sugar per serving, resulting in rapid glucose spikes followed by mid-afternoon energy crashes.

By incorporating traditional Indian ingredients—such as lightly roasted barley (*sattu*), soaked sweet basil seeds (*sabja*), and raw organic jaggery—you provide steady, sustained cellular nourishment.

#### 1. The Power-Packed Sattu & Roasted Cumin Cooler
- **Ingredients:** 2 tbsp chana sattu, 1 glass chilled water, 1/4 tsp roasted jeera powder, black salt, a squeeze of fresh lime, and fresh mint leaves.
- **Why it works:** Sattu has a low glycemic index and cools the pitta dosha immediately.

#### 2. Soothing Almond, Cardamom & Nutmeg Night Elixir
- **Ingredients:** Warm almond milk, crushed green cardamom pods, saffron strands, a microscopic grating of organic nutmeg, raw honey.
- **Why it works:** Magnesium in almonds combined with the essential oils in nutmeg helps activate melatonin synthesis.
    `,
    youtubeId: "aU88VzD2Q0M",
    youtubeTitle: "Nutritious Homemade Smoothies & Summer Coolers for Kids",
    sources: [
      { title: "Journal of Traditional and Complementary Medicine: Nutritional Value of Roasted Legumes", url: "https://example.com/sattu-study" },
      { title: "National Institute of Ayurveda: Pediatric Dietary Guidelines", url: "https://example.com/ayurveda-pediatrics" }
    ]
  },
  {
    id: "understanding-anime-ghibli",
    title: "A Parent's Guide to Anime: Why Your Teen Loves Studio Ghibli and Shonen",
    slug: "understanding-anime-for-parents",
    subtitle: "Demystifying themes, emotional depth, and safe viewing recommendations to connect with your child's passions.",
    category: "Anime & Manga",
    author: "Rhea Mukherjee, Cultural Researcher",
    authorType: "human",
    readTime: "6 min read",
    publishedAt: "Yesterday",
    coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop",
    reusedCount: 42,
    isReused: false,
    takeaways: [
      "Anime is an expansive artistic medium spanning complex coming-of-age storytelling, not mere cartoons.",
      "Studio Ghibli films like 'My Neighbor Totoro' and 'Spirited Away' offer timeless lessons in resilience and environmental reverence.",
      "Watching together creates effortless conversation bridges around teenage autonomy, friendship, and ambition."
    ],
    content: `
### Beyond the Animation: The Cultural Landscape

For many Indian parents, discovering that their 13-year-old is spending hours watching Japanese animation can feel disorienting. Is it suitable? What values does it impart?

Unlike Western animated cartoons that were traditionally aimed at toddlers or pure comedy, Japanese *anime* is a versatile literary medium. It tackles themes of sacrifice, belonging, perseverance (*ganbaru*), and emotional vulnerability with remarkable nuance.

#### Recommended Starting Points for Families:
1. **My Neighbor Totoro:** A gentle exploration of childhood wonder and family healing.
2. **Haikyu!!:** A high-spirited sports anime that teaches dedication, teamwork, and accepting failure with grace.
3. **A Silent Voice:** A poignant exploration of empathy, redemption, and overcoming school bullying.
    `,
    youtubeId: "ByXuk9QqQkk",
    youtubeTitle: "The Philosophy and Art of Hayao Miyazaki",
    sources: [
      { title: "Cultural Studies in Media & Youth Engagement, 2024", url: "https://example.com/anime-youth-study" },
      { title: "Common Sense Media: Age-based Anime Guidance", url: "https://example.com/commonsense-anime" }
    ]
  },
  {
    id: "darjeeling-quiet-escapes",
    title: "3 Undiscovered Tea Estate Homestays in Darjeeling for Slow Travel",
    slug: "darjeeling-tea-estate-homestays",
    subtitle: "Escape the tourist hubs and immerse in mist-covered organic plantations, colonial verandas, and freshly brewed first-flush teas.",
    category: "Travel & Escapes",
    author: "Tanvi Roy, Travel Essayist",
    readTime: "5 min read",
    publishedAt: "2 days ago",
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
    reusedCount: 17,
    isReused: true,
    takeaways: [
      "Tukvar and Sourenee estates offer serene heritage bungalows far from Mall Road traffic.",
      "Best visited between mid-October to early December for crisp Kanchenjunga panoramas.",
      "Direct bookings with local estate cooperatives ensure authentic Himalayan hospitality."
    ],
    content: `
### Slowing Down in the Queen of the Hills

Most visitors to Darjeeling follow the crowded triangle of Chowrasta, Tiger Hill, and Glenary's. While undeniably charming, the true magic of the Eastern Himalayas reveals itself only when you venture down into the slopes where morning mist clings to heirloom tea bushes.

#### 1. Sourenee Tea Estate & Heritage Retreat
Tucked in the Mirik valley, this 100-year-old planter's bungalow offers floor-to-ceiling wooden windows overlooking terraced hillsides. Wake up to the aroma of freshly hand-rolled Muscatel tea.

#### 2. Singtom Tea Estate Resort
Dating back to 1862, Singtom is one of Darjeeling's oldest active plantations. Guests can join tea pluckers at dawn and learn the sensory art of tea tasting.
    `,
    youtubeId: "eYq7WapuDLU",
    youtubeTitle: "Walking through Darjeeling's Serene Tea Valleys",
    sources: [
      { title: "Tea Board of India: Heritage Estate Tourism", url: "https://example.com/teaboard-heritage" }
    ]
  },
  {
    id: "ayurvedic-morning-rituals",
    title: "A Calm 15-Minute Morning Routine for Intentional Energy",
    slug: "calm-ayurvedic-morning-routine",
    subtitle: "Simple Dinacharya rituals—tongue scraping, warm copper-infused water, and five sun salutations—to start your day centered.",
    category: "Mindful Wellness",
    author: "Pooja Hegde, Holistic Practitioner",
    readTime: "4 min read",
    publishedAt: "3 days ago",
    coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop",
    reusedCount: 31,
    isReused: false,
    takeaways: [
      "Drinking warm water with ginger kickstarts Agni (digestive fire) without adrenal spikes.",
      "10 minutes of gentle Ujjayi breathwork reduces cortisol levels before checking phones.",
      "A five-minute gratitude journaling ritual anchors daily emotional clarity."
    ],
    content: `
### Reclaiming Your First Morning Hour

How we spend the first twenty minutes of our waking state sets the emotional resonance for the entire day. Rather than reaching for digital screens and instant email notifications, classical Ayurveda emphasizes *Dinacharya* (rhythmic daily living).

1. **Jala Neti & Ushapan:** Drink two glasses of lukewarm water stored in a pure copper vessel to awaken digestive metabolism.
2. **Abhyanga Face & Scalp Massage:** Warm sesame or kumkumadi oil gently massaged onto temple points to ease overnight tension.
3. **Centering Breath:** Five cycles of box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s).
    `,
    youtubeId: "v7AYKMP6rOE",
    youtubeTitle: "10-Minute Morning Yoga Flow for Gentle Energy",
    sources: [
      { title: "Charaka Samhita: Principles of Dinacharya", url: "https://example.com/charaka-dinacharya" }
    ]
  }
];

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: "vid-1",
    title: "10-Minute Everyday Morning Stretch for Flexibility & Ease",
    channel: "Mindful Movement India",
    youtubeId: "g_tea8ZNk5A",
    category: "Yoga & Fitness",
    duration: "10:24",
    thumbnail: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "vid-2",
    title: "Authentic Bengali Five-Spice Roast Vegetables (Panch Phoron Tarkari)",
    channel: "Heritage Kitchens",
    youtubeId: "Wj6_vOQnL8E",
    category: "Cooking & Recipes",
    duration: "14:15",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "vid-3",
    title: "Gentle Decluttering: Transforming Your Living Room into a Sanctuary",
    channel: "Calm Living Spaces",
    youtubeId: "2vLz8g8jH_o",
    category: "Home & Living",
    duration: "12:08",
    thumbnail: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop"
  }
];

export const INITIAL_AGENT_STATE: AgentState = {
  status: "SLEEPING",
  statusMessage: "Your agent is currently resting. All submitted requests are queued safely and will be processed during the next wake window.",
  nextWakeTime: "Tonight, 11:00 PM IST",
  lastActiveTime: "Today, 11:30 PM IST",
  wakeFrequency: "Daily (11:00 PM IST)",
  wakeTimeOfDay: "23:00",
  subscriptionTier: "Daily Companion",
  activeTask: "Scheduled: Digesting latest kids nutrition guides"
};

export const INITIAL_REQUESTS: AgentRequest[] = [
  {
    id: "req-1",
    prompt: "Find some healthy homemade drinks my children will actually like without added sugar.",
    category: "Health & Nutrition",
    status: "COMPLETED",
    submittedAt: "Today, 07:15 AM",
    scheduledFor: "Today, 08:00 AM",
    completedAt: "Today, 08:30 AM",
    contentId: "healthy-drinks-kids",
    contentTitle: "5 Wholesome Ayurvedic Drinks Your Children Will Actually Love",
    isReused: true,
    reuseNote: "Matched with existing verified clinical nutrition guide from Shared Knowledge Ecosystem (Saved ~3 min generation time)."
  },
  {
    id: "req-2",
    prompt: "Explain Studio Ghibli and anime trends so I can understand what my 14-year-old is talking about.",
    category: "Anime & Manga",
    status: "COMPLETED",
    submittedAt: "Yesterday, 06:40 PM",
    scheduledFor: "Today, 08:00 AM",
    completedAt: "Today, 08:30 AM",
    contentId: "understanding-anime-ghibli",
    contentTitle: "A Parent's Guide to Anime: Why Your Teen Loves Studio Ghibli and Shonen",
    isReused: false,
    reuseNote: "Researched and generated with YouTube cultural analysis and age-appropriate recommendations."
  },
  {
    id: "req-3",
    prompt: "Plan a serene 3-day slow travel weekend in Darjeeling tea estates with budget homestays.",
    category: "Travel & Escapes",
    status: "COMPLETED",
    submittedAt: "Sep 18, 09:10 PM",
    scheduledFor: "Sep 19, 08:00 AM",
    completedAt: "Sep 19, 08:24 AM",
    contentId: "darjeeling-quiet-escapes",
    contentTitle: "3 Undiscovered Tea Estate Homestays in Darjeeling for Slow Travel",
    isReused: true,
    reuseNote: "Found curated guide from verified travel researcher in the Shared Knowledge Library."
  },
  {
    id: "req-4",
    prompt: "Create a 15-minute morning yoga and breathing routine for desk back-pain relief.",
    category: "Yoga & Fitness",
    status: "PENDING",
    submittedAt: "Today, 04:15 PM",
    scheduledFor: "Tomorrow, 08:00 AM",
    isReused: false
  }
];
