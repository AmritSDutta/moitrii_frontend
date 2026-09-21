import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface TTSResult {
  audioUrl?: string;
  audioStorageId?: Id<"_storage">;
}

/**
 * Generates audio narration for a guide summary and uploads to Convex File Storage.
 */
export async function generateAndStoreAudioNarration(
  ctx: ActionCtx,
  text: string,
  openAiKey?: string
): Promise<TTSResult> {
  const summaryText = text.slice(0, 500);

  if (openAiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
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
