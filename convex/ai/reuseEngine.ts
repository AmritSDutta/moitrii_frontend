import type { MutationCtx } from "../_generated/server";
import type { ReuseEvaluationResult, SupportedLanguage } from "./types";
import { detectScriptLanguage } from "./language";

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

/**
 * Minimum number of shared meaningful tokens before a candidate may be reused.
 * Two generic words ("budget", "hotels") must never be enough on their own.
 */
export const MIN_SHARED_TOKENS = 3;

/**
 * Fraction of the *prompt's* meaningful tokens a candidate must contain.
 */
export const REUSE_SIMILARITY_THRESHOLD = 0.5;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      // Keep letters, combining marks, and digits from every script. The
      // previous [^a-z0-9] pattern erased Devanagari and Bengali text entirely,
      // so native-script prompts tokenized to nothing. \p{M} is essential:
      // Indic vowel signs (matras) are marks, not letters, so requiring only
      // \p{L} would split every Hindi/Bengali word into filtered fragments.
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/** Number of the prompt's tokens that also appear in the candidate. */
function countShared(promptTokens: Set<string>, candidateTokens: Set<string>): number {
  let shared = 0;
  for (const token of promptTokens) {
    if (candidateTokens.has(token)) shared++;
  }
  return shared;
}

/**
 * Language a stored guide is written in. Prefers the persisted field and falls
 * back to detecting the title, which is how documents written before
 * `content.language` existed are classified.
 *
 * Failsafe: never throws, and defaults to English on any unexpected input.
 */
function resolveStoredLanguage(row: {
  language?: string;
  title?: string | null;
}): SupportedLanguage {
  try {
    const stored = row.language;
    if (stored === "en" || stored === "bn" || stored === "hi") return stored;
    return detectScriptLanguage(row.title);
  } catch {
    return "en";
  }
}

/** Normalizes an untrusted language argument, defaulting to English. */
function normalizeLanguage(language?: string): SupportedLanguage {
  return language === "bn" || language === "hi" ? language : "en";
}

/**
 * Evaluates whether a prompt matches an existing guide in the shared knowledge ecosystem.
 * A candidate must match the user's language and clear both the absolute shared-token
 * floor and the prompt-coverage threshold. If a match is found, the existing guide's
 * reusedCount is incremented.
 */
export async function evaluateContentReuse(
  ctx: MutationCtx,
  prompt: string,
  category?: string,
  language?: string
): Promise<ReuseEvaluationResult> {
  const promptTokens = tokenize(prompt);
  if (promptTokens.size === 0) {
    return { isReused: false };
  }

  const desiredLanguage = normalizeLanguage(language);

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
    // Never hand a user a guide written in a different language.
    if (resolveStoredLanguage(candidate) !== desiredLanguage) continue;

    const candidateTokens = tokenize(
      `${candidate.title} ${candidate.subtitle} ${candidate.takeaways.join(" ")}`
    );

    const shared = countShared(promptTokens, candidateTokens);
    if (shared < MIN_SHARED_TOKENS) continue;

    // Recall over the prompt only. Normalizing by min(|prompt|, |candidate|)
    // let a 5-token prompt reuse on 2 generic words alone (2/5 = 0.4).
    const score = shared / promptTokens.size;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  // Reuse only when a candidate covers enough of the prompt
  if (bestMatch && bestScore >= REUSE_SIMILARITY_THRESHOLD) {
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
      reuseNote: `Reused verified guide (${Math.round(bestScore * 100)}% prompt match with '${bestMatch.title}')`,
    };
  }

  return { isReused: false };
}
