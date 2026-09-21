import type { MutationCtx } from "../_generated/server";
import type { ReuseEvaluationResult } from "./types";

/** Stopwords to ignore during token overlap evaluation */
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
  "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
  "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i",
  "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
  "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
  "yours", "yourself", "yourselves", "tell", "give", "write", "find", "best", "tips",
  "guide", "help", "please", "can"
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function computeOverlapScore(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let matches = 0;
  for (const item of setA) {
    if (setB.has(item)) matches++;
  }
  return matches / Math.min(setA.size, setB.size);
}

/**
 * Evaluates whether a prompt matches an existing guide in the shared knowledge ecosystem.
 * If a match is found, increments the existing guide's reusedCount.
 */
export async function evaluateContentReuse(
  ctx: MutationCtx,
  prompt: string,
  category?: string
): Promise<ReuseEvaluationResult> {
  const promptTokens = tokenize(prompt);
  if (promptTokens.size === 0) {
    return { isReused: false };
  }

  // Check recent published content in the same category or all categories
  const candidates = category && category !== "all"
    ? await ctx.db
        .query("content")
        .withIndex("by_category", (q) => q.eq("category", category))
        .take(15)
    : await ctx.db.query("content").take(20);

  let bestMatch: (typeof candidates)[0] | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateTokens = tokenize(
      `${candidate.title} ${candidate.subtitle} ${candidate.takeaways.join(" ")}`
    );
    const score = computeOverlapScore(promptTokens, candidateTokens);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  // If match score exceeds 40% keyword overlap, reuse existing guide
  if (bestMatch && bestScore >= 0.4) {
    // Atomically increment reusedCount on existing content
    await ctx.db.patch(bestMatch._id, {
      reusedCount: (bestMatch.reusedCount ?? 0) + 1,
      isReused: true,
    });

    return {
      isReused: true,
      contentId: bestMatch._id,
      contentTitle: bestMatch.title,
      matchedSlug: bestMatch.slug,
      reuseNote: `Reused verified guide (${Math.round(bestScore * 100)}% match with '${bestMatch.title}')`,
    };
  }

  return { isReused: false };
}
