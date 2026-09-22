import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface ImageGenResult {
  coverImage: string;
  coverImageStorageId?: Id<"_storage">;
}

export const INFOGRAPHIC_PROMPT_TEMPLATE = `
Create a modern PREMIUM horizontal landscape infographic on:
{image_topic}

STYLE:
- ultra clean pictorial colorful infographic for modern women's lifestyle
- STRICTLY NO TEXT, NO WORDS, NO LABELS, NO LETTERS, NO TYPOGRAPHY anywhere in the image (except the subtle watermark below)
- 100% visual and pictorial depiction using wholesome icons, graphics, symbols, and artistic illustrations only
- wide horizontal landscape composition (16:9 banner)
- balanced lifestyle infographic blocks arranged horizontally
- warm editorial lifestyle companion design with calm soothing colors
- looks like premium editorial poster
- minimal clutter

SAFETY & ETHICS:
- strictly family-safe, dignified, culturally respectful, and universally positive
- strictly NO vulgarity, NO nudity, NO suggestive content, and NO socially or morally abusive depictions
- celebrate wellness, health, mindfulness, family, creativity, and balanced daily living

WATERMARK (SOLE TEXT EXCEPTION):
Add subtle semi-transparent watermark text:
"Moitrii"

Place watermark diagonally near bottom-right.
Keep watermark elegant and non-intrusive.
`;

export const CATEGORY_COVERS: Record<string, string> = {
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
 * Returns dynamic Unsplash cover fallback based on category and topic keywords.
 */
export function getKeywordUnsplashCover(topic: string = "", category: string = ""): string {
  const combined = `${topic} ${category}`.toLowerCase();
  if (combined.includes("food") || combined.includes("cook") || combined.includes("recipe") || combined.includes("tea") || combined.includes("diet") || combined.includes("drink")) {
    return CATEGORY_COVERS.food;
  }
  if (combined.includes("beauty") || combined.includes("skin") || combined.includes("hair") || combined.includes("makeup") || combined.includes("glow")) {
    return CATEGORY_COVERS.beauty;
  }
  if (combined.includes("travel") || combined.includes("trip") || combined.includes("vacation") || combined.includes("destin")) {
    return CATEGORY_COVERS.travel;
  }
  if (combined.includes("health") || combined.includes("fitness") || combined.includes("workout") || combined.includes("ayurved") || combined.includes("kadha")) {
    return CATEGORY_COVERS.health;
  }
  if (combined.includes("home") || combined.includes("decor") || combined.includes("living") || combined.includes("garden")) {
    return CATEGORY_COVERS.home;
  }
  if (combined.includes("parent") || combined.includes("kid") || combined.includes("child") || combined.includes("baby")) {
    return CATEGORY_COVERS.parenting;
  }
  const normCat = category.toLowerCase().trim();
  return CATEGORY_COVERS[normCat] || CATEGORY_COVERS.default || CATEGORY_COVERS.wellness;
}

/**
 * Decodes a base64 string into a Uint8Array using Web-standards atob.
 * Fully compatible with Convex / Edge isolated runtimes without Node.js Buffer.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates an infographic cover image for the article topic and saves it in Convex File Storage.
 * Uses low-cost gpt-image-1 model with 16:9 landscape resolution and graceful fallback to curated category covers.
 */
export async function generateAndSaveCoverImage(
  ctx: ActionCtx,
  topic: string = "mindful living",
  category: string = "wellness",
  openAiKey?: string
): Promise<ImageGenResult> {
  const defaultCover = getKeywordUnsplashCover(topic, category);

  const effectiveKey = openAiKey || process.env.OPENAI_API_KEY;
  if (!effectiveKey) {
    return { coverImage: defaultCover };
  }

  try {
    const promptText = INFOGRAPHIC_PROMPT_TEMPLATE.replace("{image_topic}", topic);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: promptText,
        size: "1536x1024",
        quality: "low",
        output_format: "webp",
        output_compression: 80,
        n: 1,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.image_bytes;
      const imageUrl = data.data?.[0]?.url;

      if (b64 && typeof b64 === "string") {
        const bytes = base64ToUint8Array(b64);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "image/webp" });
        const storageId = await ctx.storage.store(blob);
        return {
          coverImage: defaultCover,
          coverImageStorageId: storageId,
        };
      } else if (imageUrl && typeof imageUrl === "string") {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          const storageId = await ctx.storage.store(blob);
          return {
            coverImage: defaultCover,
            coverImageStorageId: storageId,
          };
        }
      }
    } else {
      console.warn(`[ImageGen] API returned status ${response.status}, using curated cover fallback.`);
    }
  } catch (err) {
    console.warn("[ImageGen] Image generation error, using curated cover fallback:", err);
  }

  return { coverImage: defaultCover };
}

