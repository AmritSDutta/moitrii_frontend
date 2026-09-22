import type { SynthesizedGuide, SupportedLanguage, ArticleSource } from "./types";
import type { FirecrawlSearchResult } from "./tools";
import { discoverVideoCompanion } from "./youtubeRecommender";
import { buildSystemPrompt } from "./prompts";
import { CATEGORY_COVERS } from "./imagegen";
import { TOPIC_ID_TO_CATEGORY } from "../content";

/**
 * Fallback synthesizer producing rich localized editorial content when LLM API keys are unset.
 */
function buildFallbackGuide(
  prompt: string,
  category: string,
  language: SupportedLanguage,
  webSources?: FirecrawlSearchResult[]
): SynthesizedGuide {
  const rawCat = category.trim();
  const normKey = rawCat.toLowerCase();
  const canonicalCategory = TOPIC_ID_TO_CATEGORY[normKey] || rawCat || "Mindful Wellness";
  const coverImage = CATEGORY_COVERS[normKey] || CATEGORY_COVERS.default;
  const companion = discoverVideoCompanion(category, prompt);
  const slugBase = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/(^-|-$)/g, "") || "mindful-guide";
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  const sources: ArticleSource[] = webSources && webSources.length > 0
    ? webSources.map((s) => ({ title: s.title, url: s.url }))
    : [
        { title: `Moitrii Holistic Living Research — ${canonicalCategory} (Verified Reference)`, url: "https://moitrii.ai" },
        { title: "Traditional Indian Wellness & Lifestyle Principles", url: "https://moitrii.ai/research/wellness" },
      ];

  if (language === "bn") {
    return {
      title: `দৈনন্দিন সুস্থতা ও প্রশান্ত জীবনের পূর্ণাঙ্গ সহায়িকা: ${prompt.slice(0, 35)}`,
      slug,
      subtitle: "আধুনিক ব্যস্ত জীবনে গভীর মানসিক প্রশান্তি, সঠিক পুষ্টি ও স্বাস্থ্যকর অভ্যাসের জন্য ব্যক্তিগত সহায়িকা।",
      category: canonicalCategory,
      readTime: "৫ মিনিট পাঠ",
      coverImage,
      takeaways: [
        "প্রতিদিন নির্দিষ্ট সময়ে ১০-১৫ মিনিট হালকা মেডিটেশন ও গভীর শ্বাস-প্রশ্বাসের অভ্যাস গড়ে তুলুন।",
        "ঋতুভিত্তিক দেশীয় টাটকা শাকসবজি, ভেষজ উপাদান ও পর্যাপ্ত উষ্ণ পানি পান বজায় রাখুন।",
        "রাতের গভীর ও আরামদায়ক ঘুমের জন্য ঘুমানোর অন্তত এক ঘণ্টা পূর্বে স্ক্রিন-মুক্ত শান্ত পরিবেশ তৈরি করুন।",
        "দৈনন্দিন কাজের ফাঁকে ছোট ছোট বিরতি নিয়ে মানসিক চাপ নিয়ন্ত্রণ করুন।"
      ],
      markdownBody: `## শান্ত জীবনযাপন ও স্বাস্থ্যকর অভ্যাসের মূলনীতি

আজকের দ্রুতগতির জীবনে প্রতিদিনের ছোট ছোট অভ্যাস আমাদের শারীরিক শক্তি এবং মানসিক শান্তির মূল ভিত্তি গড়ে তোলে। ব্যস্ততার মাঝে নিজেকে একটু সময় দেওয়া কোনো বিলাসিতা নয়, বরং সুস্থ থাকার একান্ত প্রয়োজন। এই নির্দেশিকাটিতে আমরা বিস্তারিত আলোচনা করব কীভাবে সহজ কিন্তু কার্যকরী পরিবর্তনের মাধ্যমে আপনার দিনটিকে আরও প্রাণবন্ত এবং ইতিবাচক করে তোলা যায়।

### ১. সকালের প্রশান্ত ও সচেতন সূচনা

দিনের শুরুটা কীভাবে হচ্ছে তার ওপর নির্ভর করে সারা দিনের মানসিক অবস্থা। ঘুম ভাঙার সঙ্গে সঙ্গেই মোবাইল বা ডিজিটাল ডিভাইসের নোটিফিকেশন চেক করার অভ্যাস মানসিক উদ্বেগ বাড়িয়ে দেয়।

* **হালকা উষ্ণ পানি ও ভেষজ পানীয়:** ঘুম থেকে উঠে প্রথমে এক গ্লাস কুসুম গরম পানি পান করুন। এতে হজম প্রক্রিয়া সক্রিয় হয় এবং শরীরের টক্সিন দূর হতে সাহায্য করে। প্রয়োজনে সামান্য তুলসী পাতা বা লেবুর রস যোগ করতে পারেন।
* **১০ মিনিটের নীরবতা ও স্ট্রেচিং:** বিছানা ছাড়ার পর জানালার পাশে দাঁড়িয়ে গভীর শ্বাস নিন। হালকা কিছু যোগব্যায়াম বা হাত-পায়ের স্ট্রেচিং আপনার রক্ত সঞ্চালন বাড়িয়ে শরীরকে সতেজ করে তুলবে।
* **দিনের লক্ষ্য নির্ধারণ:** সকালের শান্ত পরিবেশে ৫ মিনিট চোখ বন্ধ করে দিনের প্রধান কাজগুলোর জন্য একটি ইতিবাচক মানসিক প্রস্তুতি নিন।

---

### ২. পুষ্টিকর খাদ্যতালিকা ও ভেষজ পুষ্টির গুরুত্ব

খাবার শুধু ক্ষুধা নিবারণের জন্য নয়, এটি আমাদের শরীরের কোষগুলোকে পুনরুজ্জীবিত করার প্রধান জ্বালানি। দেশীয় ও মৌসুমি উপাদানের সঠিক ব্যবহার শরীরকে দীর্ঘমেয়াদে রোগমুক্ত রাখে।

* **মৌসুমি ফলমূল ও শাকসবজি:** প্রতিদিনের খাদ্যতালিকায় অন্তত দুটি মৌসুমি ফল এবং প্রচুর রঙিন শাকসবজি অন্তর্ভুক্ত করুন।
* **পর্যাপ্ত প্রোটিন ও স্বাস্থ্যকর ফ্যাট:** দেশি ডাল, কাঠবাদাম, আখরোট এবং ঘিয়ে ভাজা তিসি বীজের মতো পুষ্টিকর উপাদান দীর্ঘ সময় পেট ভরা রাখে এবং শক্তির মাত্রা স্থির রাখে।
* **প্রাকৃতিক ভেষজ উপাদান:** রান্নায় কাঁচা হলুদ, আদা, দারুচিনি ও গোলমরিচের পরিমিত ব্যবহার প্রাকৃতিক রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে।

---

### ৩. সান্ধ্যকালীন প্রস্তুতি ও গভীর ঘুমের পরিবেশ

একটি কর্মব্যস্ত দিনের শেষে শরীর ও মনকে সম্পূর্ণ শিথিল করা অত্যন্ত গুরুত্বপূর্ণ। অনিদ্রা বা অসমাপ্ত ঘুমের সমস্যা দূর করতে সান্ধ্যকালীন রুটিন মেনে চলুন।

* **ডিজিটাল ডিটক্স:** ঘুমানোর অন্তত ৬০ মিনিট আগে ল্যাপটপ, টিভি এবং স্মার্টফোন ব্যবহার বন্ধ রাখুন। নীল আলো মেলাটোনিন হরমোনের ক্ষরণ কমিয়ে দেয় যা ঘুমের ব্যাঘাত ঘটায়।
* **হালকা বই পড়া বা প্রশান্ত সঙ্গীত:** ঘুমানোর পূর্বে হালকা মেজাজের বই পড়া বা মৃদু সুরের যন্ত্রসংগীত শোনা মনের উত্তেজনা কমিয়ে আনে।
* **ভেষজ দুধের প্রশান্তি:** রাতে ঘুমানোর পূর্বে সামান্য জায়ফল বা অশ্বগন্ধা মেশানো উষ্ণ দুধ পান স্নায়ুকে শান্ত করতে বিশেষ উপকারী।

---

### ৪. কর্মজীবনের ভারসাম্য ও মানসিক স্থিতিশীলতা

কাজের চাপের মাঝে নিজের মানসিক সুস্থতা বজায় রাখা একটি ধারাবাহিক চর্চা। কাজের ফাঁকে ছোট ছোট বিরতি নেওয়া অত্যন্ত কার্যকর।

* **প্রতি ঘণ্টায় ২ মিনিটের সচেতন বিরতি:** একটানা বসে কাজ না করে প্রতি এক ঘণ্টা পর চোখ বন্ধ করে গভীর শ্বাস নিন এবং পেশী শিথিল করুন।
* **প্রকৃতির সংস্পর্শ ও মুক্ত বাতাস:** দিনের কোনো একটি সময় উন্মুক্ত স্থানে কিছু সময় কাটান বা ঘরের বারান্দায় থাকা গাছপালার যত্ন নিন।
* **দৈনিক কৃতজ্ঞতা প্রকাশ:** প্রতিদিনের সফলতার জন্য নিজেকে সাধুবাদ জানান এবং ছোট ছোট সুন্দর মুহূর্তগুলোর প্রতি কৃতজ্ঞ থাকুন।`,
      youtubeId: companion.youtubeId,
      youtubeTitle: companion.youtubeTitle,
      sources,
      language: "bn",
    };
  }

  if (language === "hi") {
    return {
      title: `दैनिक स्वास्थ्य, संतुलन और सुकून की संपूर्ण मार्गदर्शिका: ${prompt.slice(0, 35)}`,
      slug,
      subtitle: "व्यस्त दिनचर्या में मानसिक स्पष्टता, पोषण और ऊर्जा बनाए रखने के लिए आपका व्यक्तिगत एआई साथी।",
      category: canonicalCategory,
      readTime: "5 मिनट पठन",
      coverImage,
      takeaways: [
        "दैनिक दिनचर्या में 10 से 15 मिनट का प्राणायाम और ध्यान अवश्य शामिल करें।",
        "संतुलित मौसमी आहार, प्राकृतिक जड़ी-बूटियों और पर्याप्त गुनगुने पानी का सेवन करें।",
        "रात को गहरी नींद के लिए सोने से 1 घंटा पहले सभी डिजिटल उपकरणों से दूरी बनाएं।",
        "दिन भर के तनाव को कम करने के लिए प्रकृति के साथ थोड़ा समय अवश्य बिताएं।"
      ],
      markdownBody: `## संतुलित जीवनशैली और दैनिक ऊर्जा का विज्ञान

आज की व्यस्त और भागदौड़ भरी जिंदगी में मन और शरीर का संतुलन बनाए रखना सबसे बड़ी प्राथमिकता है। सही आदतें हमें न केवल बीमारियों से बचाती हैं, बल्कि मानसिक शांति और कार्यक्षमता को भी कई गुना बढ़ा देती हैं। इस विस्तृत मार्गदर्शिका में हम उन सरल और प्रभावी कदमों के बारे में जानेंगे जिन्हें आप अपनी दिनचर्या में आसानी से शामिल कर सकते हैं।

### 1. सुबह की सुखद और सचेत शुरुआत

आपके दिन की गुणवत्ता इस बात पर निर्भर करती है कि आप अपनी सुबह कैसे बिताते हैं। सुबह का शांत वातावरण सकारात्मक ऊर्जा का सबसे बड़ा स्रोत है।

* **गुनगुना पानी और प्राकृतिक पेय:** सुबह उठते ही सबसे पहले एक गिलास गुनगुना पानी पिएं। इसमें हल्का नींबू या शहद मिलाकर पीने से पाचन तंत्र सुचारू रूप से कार्य करता है।
* **10 मिनट का प्राणायाम:** अनुलोम-विलोम और भ्रामरी प्राणायाम मानसिक तनाव को तुरंत शांत करते हैं और मस्तिष्क में ऑक्सीजन के प्रवाह को बढ़ाते हैं।
* **सकारात्मक दृष्टिकोण:** अपने दिन की शुरुआत किसी शांत विचार, प्रार्थना या 5 मिनट के आत्म-मंथन के साथ करें।

---

### 2. पौष्टिक खान-पान और प्राकृतिक पोषण

आहार हमारे शरीर और मन दोनों को पोषित करता है। ताजा और सात्विक भोजन हमें दिन भर ऊर्जावान बनाए रखता है।

* **मौसमी फल और सब्जियां:** अपने भोजन में ताजे मौसमी फल, हरी पत्तेदार सब्जियां और साबुत अनाज को प्राथमिकता दें।
* **स्वस्थ वसा और मेवे:** बादाम, अखरोट, कद्दू के बीज और शुद्ध देसी घी का सीमित उपयोग हार्मोनल संतुलन के लिए अत्यंत आवश्यक है।
* **पारंपरिक मसाले:** हल्दी, अदरक, जीरा और काली मिर्च जैसे रसोई के मसाले पाचन को मजबूत बनाते हैं और शरीर की रोग प्रतिरोधक क्षमता बढ़ाते हैं।

---

### 3. रात का विश्राम और गहरी नींद की तैयारी

दिन भर की थकान के बाद एक गहरी और आरामदायक नींद शरीर के पुनर्निर्माण के लिए अनिवार्य है।

* **स्क्रीन-मुक्त वातावरण:** सोने से कम से कम 60 मिनट पहले मोबाइल और लैपटॉप को दूर रख दें ताकि आपकी आंखें और मस्तिष्क तनावमुक्त हो सकें।
* **हल्का हर्बल काढ़ा या दूध:** रात को सोने से पहले थोड़ा सा जायफल या हल्दी वाला गर्म दूध पीने से गहरी और सुकून भरी नींद आती है।
* **शांत वातावरण:** बेडरूम की रोशनी को हल्का रखें और कमरे में शांति का माहौल बनाएं।

---

### 4. कार्यस्थल पर तनाव प्रबंधन और सजगता

दैनिक कामकाज के दौरान मानसिक संतुलन बनाए रखना ऊर्जा को बनाए रखने के लिए अनिवार्य है।

* **माइक्रो-ब्रेक्स का अभ्यास:** हर 45 से 60 मिनट के बाद अपनी कुर्सी से उठें, थोड़ा टहलें और अपनी आंखों को आराम दें।
* **पर्याप्त जलयोजन:** दिन भर समय-समय पर पानी पीते रहें ताकि सिरदर्द और सुस्ती से बचा जा सके।
* **सकारात्मक आत्म-संवाद:** चुनौतीपूर्ण पलों में धैर्य रखें और अपनी उपलब्धियों पर विश्वास बनाए रखें।`,
      youtubeId: companion.youtubeId,
      youtubeTitle: companion.youtubeTitle,
      sources,
      language: "hi",
    };
  }

  // Default English (500+ Words)
  return {
    title: `Mindful Living, Vitality & Daily Nourishment: ${prompt.charAt(0).toUpperCase() + prompt.slice(1, 40)}`,
    slug,
    subtitle: "A comprehensive, evidence-backed lifestyle guide crafted by your personal Moitrii companion.",
    category: canonicalCategory,
    readTime: "5 min read",
    coverImage,
    takeaways: [
      "Establish a tech-free morning buffer of at least 20 minutes to foster mental clarity.",
      "Integrate seasonal whole foods, active hydration, and restorative herbal brews into daily routines.",
      "Create an intentional evening wind-down ritual with soft lighting and digital disconnection.",
      "Practice micro-moments of mindful breathing to recalibrate during high-stress hours."
    ],
    markdownBody: `## The Art of Intentional Balance in Modern Living

In an era dominated by relentless digital connectivity and rapid routines, nurturing your wellbeing requires sustainable, micro-habits rather than overwhelming lifestyle disruptions. True vitality is cultivated when nutrition, physical movement, and mental tranquility operate in cohesive harmony. This comprehensive guide outlines evidence-based practices and mindful rituals to elevate your everyday vitality.

---

### 1. Grounded Mornings: Setting the Tone for Clarity

The first hour of your day sets the neurochemical and emotional baseline for everything that follows. Rather than reacting immediately to external demands and digital notifications, reclaiming this window creates enduring resilience.

* **Hydration Before Stimulation:** Before reaching for your phone or morning caffeine, drink a tall glass of warm water infused with a slice of fresh ginger or lemon. This gently stimulates peristalsis, hydrates your cellular matrix, and supports natural detoxification pathways.
* **Somatic Movement & Breath:** Dedicate 10 to 15 minutes to conscious movement. Gentle spinal twists, cat-cow postures, or simple joint rotations awaken the nervous system and enhance lymphatic drainage.
* **Mindful Centering:** Spend three minutes seated in stillness, focusing on full diaphragmatic breaths—inhaling for four counts and exhaling smoothly for six counts. This simple ratio signals safety to your parasympathetic nervous system.

---

### 2. Sustained Nutritional Energy & Wholesome Nourishment

Energy fluctuations throughout the day are intimately tied to blood sugar regulation and digestive vitality. Mindful eating is as much about how we nourish ourselves as what is on our plates.

* **Prioritize Whole, Unrefined Ingredients:** Base meals around vibrant seasonal vegetables, high-quality proteins (lentils, sprouted legumes, organic dairy), and healthy fats such as cold-pressed sesame oil, ghee, and soaked nuts.
* **Herbal Synergy:** Harness the therapeutic benefits of traditional botanicals. Incorporating fresh turmeric, crushed black pepper, fennel seeds, and cinnamon into your daily cooking enhances nutrient bioavailability and stabilizes digestion.
* **Mindful Pacing:** Avoid eating while multitasking at your desk or scrolling on screens. Chewing thoroughly and honoring your mealtime improves digestive enzyme secretion and prevents post-meal lethargy.

---

### 3. Evening Decompression & Restorative Sleep Architecture

Quality restorative sleep is the cornerstone of immune resilience, emotional equilibrium, and cellular rejuvenation. Cultivating an intentional evening transition prepares your brain for deep delta-wave rest.

* **The 60-Minute Digital Sunset:** Power down laptops, televisions, and smartphones one hour before retiring. The blue spectrum of digital screens suppresses melatonin synthesis, delaying restorative sleep onset.
* **Warm Evening Rituals:** Sip a comforting cup of warm chamomile, ashwagandha, or golden spiced milk. The warmth soothes the enteric nervous system and primes the body for deep rest.
* **Tactile Relaxation & Space Curation:** Dim overhead lighting in favor of warm, amber lamps. Gentle reading, light journaling, or a warm foot soak with essential oils signal to your senses that the day's obligations are complete.`,
    youtubeId: companion.youtubeId,
    youtubeTitle: companion.youtubeTitle,
    sources,
    language: "en",
  };
}

/**
 * Safely extracts raw JSON string content from varied OpenAI responses (Responses API vs Chat Completions API).
 */
export function extractResponseContent(data: any): string | null {
  if (!data) return null;
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  if (Array.isArray(data.output) && data.output.length > 0) {
    const text = data.output[0]?.content?.[0]?.text;
    if (typeof text === "string" && text.trim()) return text;
  }
  if (Array.isArray(data.choices) && data.choices.length > 0) {
    const msg = data.choices[0]?.message?.content;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof data.text === "string" && data.text.trim()) {
    return data.text;
  }
  return null;
}

/**
 * Parses raw JSON string, stripping markdown code fences if present.
 */
export function parseJsonSafely(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

/**
 * Synthesizes an editorial lifestyle guide using OpenAI grounded in Firecrawl live web research.
 * Primary: gpt-5.6-luna via OpenAI Responses API (/v1/responses)
 * Secondary Fallback: gpt-4o-mini via Chat Completions API (/v1/chat/completions)
 * Tertiary Fallback: Offline curated localized guide
 */
export async function synthesizeLifestyleGuide(
  prompt: string,
  category: string,
  language: SupportedLanguage = "en",
  openAiKey?: string,
  webSources?: FirecrawlSearchResult[]
): Promise<SynthesizedGuide> {
  if (!openAiKey) {
    return buildFallbackGuide(prompt, category, language, webSources);
  }

  try {
    const webContext = webSources && webSources.length > 0
      ? `\nVerified Web Research Context:\n${webSources
          .map((s, idx) => `[${idx + 1}] ${s.title}: ${s.snippet ?? ""} (URL: ${s.url})`)
          .join("\n")}`
      : "";

    const systemPrompt = buildSystemPrompt(language);
    const userMessage = `Category: ${category}\nTopic: ${prompt}${webContext}`;

    let rawContent: string | null = null;

    // 1. Primary Attempt: gpt-5.6-luna via OpenAI Responses API (/v1/responses)
    try {
      const responseApiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      });

      if (responseApiRes.ok) {
        const data = await responseApiRes.json();
        rawContent = extractResponseContent(data);
      } else {
        const errText = await responseApiRes.text();
        console.warn(
          `[Synthesizer] Primary 'gpt-5.6-luna' Responses API returned status ${responseApiRes.status} (${responseApiRes.statusText}): ${errText}. Attempting 'gpt-4o-mini' fallback...`
        );
      }
    } catch (lunaErr) {
      console.warn(
        "[Synthesizer] Primary 'gpt-5.6-luna' call failed with network error:",
        lunaErr,
        "Attempting 'gpt-4o-mini' fallback..."
      );
    }

    // 2. Secondary Fallback: gpt-4o-mini via Chat Completions API (/v1/chat/completions)
    if (!rawContent) {
      try {
        const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (chatRes.ok) {
          const data = await chatRes.json();
          rawContent = extractResponseContent(data);
        } else {
          const errText = await chatRes.text();
          console.warn(
            `[Synthesizer] Fallback 'gpt-4o-mini' Chat Completions API returned status ${chatRes.status} (${chatRes.statusText}): ${errText}. Using offline curated fallback guide.`
          );
        }
      } catch (chatErr) {
        console.warn(
          "[Synthesizer] Fallback 'gpt-4o-mini' call failed with network error:",
          chatErr
        );
      }
    }

    // 3. If neither LLM tier succeeded, return offline fallback guide
    if (!rawContent) {
      console.warn(
        "[Synthesizer] All OpenAI synthesis tiers exhausted; using offline curated fallback guide."
      );
      return buildFallbackGuide(prompt, category, language, webSources);
    }

    const parsed = parseJsonSafely(rawContent);

    const rawCat = category.trim();
    const normKey = rawCat.toLowerCase();
    const canonicalCategory = TOPIC_ID_TO_CATEGORY[normKey] || rawCat || "Mindful Wellness";
    const coverImage = CATEGORY_COVERS[normKey] || CATEGORY_COVERS.default;
    const slugBase = (parsed.title || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)
      .replace(/(^-|-$)/g, "") || "lifestyle-guide";
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const mergedSources: ArticleSource[] = Array.isArray(parsed.sources) && parsed.sources.length > 0
      ? parsed.sources
      : webSources && webSources.length > 0
      ? webSources.map((s) => ({ title: s.title, url: s.url }))
      : [
          { title: "Moitrii Holistic Living Research", url: "https://moitrii.ai/research/wellness" },
        ];

    const companion = discoverVideoCompanion(category, prompt);

    return {
      title: parsed.title || `Lifestyle Guide: ${prompt.slice(0, 30)}`,
      slug,
      subtitle: parsed.subtitle || "Curated personal lifestyle insights.",
      category: canonicalCategory,
      readTime: parsed.readTime || "5 min read",
      coverImage,
      takeaways: Array.isArray(parsed.takeaways) && parsed.takeaways.length > 0
        ? parsed.takeaways
        : ["Prioritize daily balance and intentional nourishment."],
      markdownBody: parsed.markdownBody || "## Mindful Living\n\nNurture your daily routine with balance.",
      youtubeId: companion.youtubeId,
      youtubeTitle: companion.youtubeTitle,
      sources: mergedSources,
      language,
    };
  } catch (err) {
    console.error("[Synthesizer] Fatal synthesizer error, using fallback guide:", err);
    return buildFallbackGuide(prompt, category, language, webSources);
  }
}

