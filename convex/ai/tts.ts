import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { base64ToUint8Array } from "./imagegen";

export interface TTSResult {
  audioUrl?: string;
  audioStorageId?: Id<"_storage">;
}

/**
 * Maps language code to Sarvam-supported BCP 47 language code.
 */
function toSarvamLanguageCode(lang?: string, text?: string): string {
  if (lang === "bn" || lang === "bn-IN") return "bn-IN";
  if (lang === "hi" || lang === "hi-IN") return "hi-IN";
  if (lang === "en" || lang === "en-IN") return "en-IN";
  if (text && /[\u0900-\u097F]/.test(text)) return "hi-IN";
  if (text && /[\u0980-\u09FF]/.test(text)) return "bn-IN";
  return "en-IN";
}

/**
 * Trims text to the nearest sentence boundary within maxChars to avoid clipped words.
 */
function trimToSentenceBoundary(text: string, maxChars: number = 500): string {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastPunct = Math.max(
    sliced.lastIndexOf(". "),
    sliced.lastIndexOf("! "),
    sliced.lastIndexOf("? "),
    sliced.lastIndexOf("। ")
  );
  if (lastPunct > 150) {
    return sliced.slice(0, lastPunct + 1).trim();
  }
  return sliced.trim();
}

/**
 * Generates audio narration for a guide summary and uploads to Convex File Storage.
 * Uses Sarvam AI (Bulbul v3, female speaker "ritu") as primary (up to 2 attempts for 429/5xx),
 * falling back to OpenAI TTS and offline WAV persistence.
 * Fetches API keys internally from process.env.SARVAM_API_KEY and process.env.OPENAI_API_KEY.
 */
export async function generateAndStoreAudioNarration(
  ctx: ActionCtx,
  text: string,
  language?: string,
  overrideKeys?: { openAiKey?: string; sarvamKey?: string }
): Promise<TTSResult> {
  const summaryText = trimToSentenceBoundary(text, 500);
  const sarvamApiKey = overrideKeys?.sarvamKey || process.env.SARVAM_API_KEY;

  // 1. Primary: Sarvam AI Bulbul v3 with female speaker "ritu"
  if (sarvamApiKey) {
    const langCode = toSarvamLanguageCode(language, summaryText);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": sarvamApiKey,
          },
          body: JSON.stringify({
            text: summaryText,
            language_code: langCode,
            model: "bulbul:v3",
            speaker: "ritu",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const base64Audio = data.audios?.[0] || data.audio;
          if (base64Audio && typeof base64Audio === "string") {
            const bytes = base64ToUint8Array(base64Audio);
            const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/wav" });
            const storageId = await ctx.storage.store(blob);
            const audioUrl = await ctx.storage.getUrl(storageId);
            return { audioUrl: audioUrl ?? undefined, audioStorageId: storageId };
          }
        } else {
          const contentType = response.headers.get("content-type");
          console.warn(`[Sarvam TTS] Attempt ${attempt} failed with status ${response.status}, content-type: ${contentType}`);
          // Fail fast on non-retryable client errors (400, 401, 403, 404)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            break;
          }
        }
      } catch (err) {
        console.warn(`[Sarvam TTS] Attempt ${attempt} error:`, err);
      }
    }
  }

  // 2. Secondary Fallback: OpenAI TTS-1
  const effectiveOpenAiKey = overrideKeys?.openAiKey || process.env.OPENAI_API_KEY;
  if (effectiveOpenAiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveOpenAiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "nova",
          input: summaryText,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const storageId = await ctx.storage.store(audioBlob);
        const audioUrl = await ctx.storage.getUrl(storageId);
        return { audioUrl: audioUrl ?? undefined, audioStorageId: storageId };
      }
    } catch (err) {
      console.warn("OpenAI TTS failed, falling back to audio placeholder:", err);
    }
  }

  // Graceful fallback: Minimal silent WAV audio file for demo/test persistence in Convex Storage
  // 44-byte standard RIFF WAV header
  const wavHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // file size - 8
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6d, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // subchunk1 size (16)
    0x01, 0x00,             // audio format (1 = PCM)
    0x01, 0x00,             // num channels (1)
    0x44, 0xac, 0x00, 0x00, // sample rate (44100)
    0x88, 0x58, 0x01, 0x00, // byte rate (44100 * 2)
    0x02, 0x00,             // block align (2)
    0x10, 0x00,             // bits per sample (16)
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // subchunk2 size (0 data bytes)
  ]);

  try {
    const blob = new Blob([wavHeader], { type: "audio/wav" });
    const storageId = await ctx.storage.store(blob);
    const audioUrl = await ctx.storage.getUrl(storageId);
    return { audioUrl: audioUrl ?? undefined, audioStorageId: storageId };
  } catch (storageErr) {
    console.warn("Storage upload failed:", storageErr);
    return {};
  }
}
