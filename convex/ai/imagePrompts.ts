/**
 * Infographic prompt template for gpt-image-1 / DALL-E image generation.
 * Enforces a 16:9 horizontal landscape composition, strict zero-text typography invariants,
 * family-safe dignified ethics, and an elegant subtle "Moitrii" watermark.
 */
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

/**
 * Builds the customized infographic image generation prompt by injecting the sanitized topic.
 */
export function buildInfographicPrompt(topic: string = "mindful living"): string {
  const sanitizedTopic = topic.trim().slice(0, 300) || "mindful living";
  return INFOGRAPHIC_PROMPT_TEMPLATE.replace("{image_topic}", sanitizedTopic);
}
