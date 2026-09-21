/**
 * Safely extracts an 11-character YouTube video ID from various URL formats
 * (standard watch URLs, youtu.be short links, embed URLs, or raw IDs).
 */
export function extractYouTubeId(input?: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Standard match for 11-character YouTube video ID
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  // If already an 11-character alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}
