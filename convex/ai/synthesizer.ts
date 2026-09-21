import type { SynthesizedGuide, SupportedLanguage } from "./types";

const CATEGORY_COVERS: Record<string, string> = {
  wellness: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop",
  food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
  beauty: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop",
  travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  health: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop",
  home: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop",
  parenting: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?q=80&w=1200&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop",
};

/**
 * Fallback synthesizer producing rich localized editorial content when LLM API keys are unset.
 */
function buildFallbackGuide(
  prompt: string,
  category: string,
  language: SupportedLanguage
): SynthesizedGuide {
  const normCat = category.toLowerCase().trim() || "wellness";
  const coverImage = CATEGORY_COVERS[normCat] || CATEGORY_COVERS.default;
  const slugBase = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/(^-|-$)/g, "") || "mindful-guide";
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  if (language === "bn") {
    return {
      title: `দৈনন্দিন সুস্থতা এবং পুষ্টির সহজ সহায়িকা: ${prompt.slice(0, 35)}`,
      slug,
      subtitle: "আধুনিক ব্যস্ত জীবনে শান্ত মন ও স্বাস্থ্যকর অভ্যাসের জন্য ব্যক্তিগত এআই গাইড।",
      category: normCat,
      readTime: "৪ মিনিট পাঠ",
      coverImage,
      takeaways: [
        "প্রতিদিন নির্দিষ্ট সময়ে হালকা মেডিটেশন ও গভীর শ্বাস-প্রশ্বাসের অভ্যাস তৈরি করুন।",
        "ঋতুভিত্তিক দেশীয় পুষ্টিকর খাবার ও পর্যাপ্ত পানি পান বজায় রাখুন।",
        "রাতের ঘুমের আগে স্ক্রিন-মুক্ত শান্ত পরিবেশ বজায় রাখুন।"
      ],
      markdownBody: `## শান্ত জীবনযাপন ও স্বাস্থ্যকর অভ্যাসের মূলনীতি\n\nব্যস্ত জীবনে নিজের জন্য কিছুটা শান্ত সময় বের করা অত্যন্ত প্রয়োজনীয়। এই গাইডে আমরা দেখে নেব কিভাবে সহজ কয়েকটি পরিবর্তনের মাধ্যমে শরীর ও মনকে সতেজ রাখা যায়।\n\n### ১. সকালের প্রশান্ত রুটিন\nঘুম থেকে ওঠার পর অন্তত ১৫ মিনিট ফোন থেকে দূরে থাকুন। এক গ্লাস কুসুম গরম পানি ও হালকা স্ট্রেচিং দিয়ে দিন শুরু করুন।\n\n### ২. পুষ্টিকর খাদ্যতালিকা\nপ্রাকৃতিক শাকসবজি, বাদাম এবং পর্যাপ্ত প্রোটিন যুক্ত খাবার রাখুন। অতিরিক্ত প্রক্রিয়াজাত খাবার এড়িয়ে চলুন।\n\n### ৩. সান্ধ্যকালীন প্রস্তুতি\nঘুমানোর অন্তত এক ঘণ্টা আগে সকল ডিজিটাল স্ক্রিন বন্ধ করুন এবং বই পড়া বা হালকা গানের মাধ্যমে মনকে শিথিল করুন।`,
      sources: [
        { title: "Moitrii Holistic Living Research", url: "https://moitrii.ai/research/wellness" },
        { title: "National Nutrition Institute Insights", url: "https://moitrii.ai/sources/nutrition" }
      ],
      language: "bn",
    };
  }

  if (language === "hi") {
    return {
      title: `दैनिक स्वास्थ्य और सुकून की संपूर्ण मार्गदर्शिका: ${prompt.slice(0, 35)}`,
      slug,
      subtitle: "व्यस्त जीवनशैली में संतुलन और ऊर्जा बनाए रखने के लिए आपका व्यक्तिगत एआई सहायक।",
      category: normCat,
      readTime: "4 मिनट पठन",
      coverImage,
      takeaways: [
        "दैनिक दिनचर्या में 10 मिनट का ध्यान और प्राणायाम अवश्य शामिल करें।",
        "संतुलित और मौसमी आहार के साथ पर्याप्त जलपान सुनिश्चित करें।",
        "शाम के समय स्क्रीन टाइम कम करके गहरी नींद के लिए माहौल बनाएं।"
      ],
      markdownBody: `## शांत जीवनशैली और दैनिक संतुलन\n\nआज की भागदौड़ भरी जिंदगी में मन और शरीर का संतुलन बनाए रखना सबसे महत्वपूर्ण है।\n\n### 1. सुबह की सुखद शुरुआत\nसुबह उठते ही फोन देखने के बजाय 10 मिनट ताजी हवा में टहलें और गुनगुना पानी पिएं।\n\n### 2. संतुलित खान-पान\nअपने भोजन में ताजे फल, हरी सब्जियां और प्राकृतिक पोषक तत्व शामिल करें।\n\n### 3. रात का विश्राम\nसोने से पहले डिजिटल उपकरणों से दूरी बनाएं और शांत वातावरण में विश्राम करें।`,
      sources: [
        { title: "Moitrii Mindful Living Study", url: "https://moitrii.ai/research/wellness" },
        { title: "Ayurvedic Lifestyle Guidelines", url: "https://moitrii.ai/sources/ayurveda" }
      ],
      language: "hi",
    };
  }

  // Default English
  return {
    title: `Mindful Living & Daily Vitality: ${prompt.charAt(0).toUpperCase() + prompt.slice(1, 40)}`,
    slug,
    subtitle: "A thoughtful, evidence-backed lifestyle guide crafted by your personal Moitrii agent.",
    category: normCat,
    readTime: "4 min read",
    coverImage,
    takeaways: [
      "Establish gentle morning boundaries by avoiding notifications for the first 20 minutes.",
      "Incorporate seasonal whole foods and steady hydration throughout the afternoon.",
      "Wind down with calming herbal infusions and a tech-free bedtime wind-down."
    ],
    markdownBody: `## Nurturing Balance in Modern Routines\n\nIn a world of constant stimulation, intentional micro-habits offer grounding serenity without requiring disruptive life overhauls.\n\n### 1. Grounded Mornings\nBegin your morning with intentional hydration and gentle joint mobilization before checking emails or social feeds.\n\n### 2. Nourishing Mid-Day Energy\nBalance meals with fiber-rich ingredients, healthy fats, and mindful chewing to avoid the mid-afternoon energy slump.\n\n### 3. Intentional Evening Wind-Down\nTransition into rest mode with soft lighting, warm herbal tea, and journaling to prepare your mind for restorative sleep.`,
    sources: [
      { title: "Moitrii Lifestyle & Nutrition Research", url: "https://moitrii.ai/research/lifestyle" },
      { title: "Mindful Health Collective", url: "https://moitrii.ai/sources/wellness" }
    ],
    language: "en",
  };
}

/**
 * Synthesizes an editorial lifestyle guide using OpenAI / Gemini or high-fidelity fallback.
 */
export async function synthesizeLifestyleGuide(
  prompt: string,
  category: string,
  language: SupportedLanguage = "en",
  openAiKey?: string
): Promise<SynthesizedGuide> {
  if (!openAiKey) {
    return buildFallbackGuide(prompt, category, language);
  }

  try {
    const langInstructions =
      language === "bn"
        ? "Respond entirely in authentic, beautiful Bengali (বাংলা)."
        : language === "hi"
        ? "Respond entirely in clear, respectful Hindi (हिन्दी)."
        : "Respond in warm, editorial English.";

    const systemPrompt = `You are Moitrii, an empathetic, highly cultured personal AI companion for modern Indian women.
You write warm, elegant, editorial lifestyle guides (calm tech aesthetic).
${langInstructions}
Return ONLY valid JSON matching this exact structure:
{
  "title": "String",
  "subtitle": "String",
  "readTime": "e.g. 4 min read",
  "takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "markdownBody": "Full markdown body with ## and ### headings",
  "sources": [{"title": "Source Name", "url": "https://..."}]
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Category: ${category}\nTopic: ${prompt}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn(`OpenAI API returned status ${res.status}, using fallback.`);
      return buildFallbackGuide(prompt, category, language);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const normCat = category.toLowerCase().trim() || "wellness";
    const coverImage = CATEGORY_COVERS[normCat] || CATEGORY_COVERS.default;
    const slugBase = (parsed.title || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)
      .replace(/(^-|-$)/g, "") || "lifestyle-guide";
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    return {
      title: parsed.title || `Lifestyle Guide: ${prompt.slice(0, 30)}`,
      slug,
      subtitle: parsed.subtitle || "Curated personal lifestyle insights.",
      category: normCat,
      readTime: parsed.readTime || "4 min read",
      coverImage,
      takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways : ["Prioritize daily balance."],
      markdownBody: parsed.markdownBody || "## Mindful Living\n\nNurture your daily routine with balance.",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      language,
    };
  } catch (err) {
    console.error("Synthesizer error:", err);
    return buildFallbackGuide(prompt, category, language);
  }
}
