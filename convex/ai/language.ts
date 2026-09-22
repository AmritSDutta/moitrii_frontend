import type { SupportedLanguage } from "./types";

/**
 * Infers the language a piece of text is written in, from its dominant script.
 *
 * Convex stores no locale metadata, so a guide is classified from its title.
 * This also covers every document written before `content.language` existed,
 * which is why no data migration is required.
 *
 * This function is deliberately TOTAL and failsafe: it accepts loose input,
 * returns "en" for anything empty, non-string, or unparseable, and can never
 * throw. Detection runs inside a wake workflow, so an exception here would
 * revert the agent and requeue the user's request.
 */
export function detectScriptLanguage(text?: string | null): SupportedLanguage {
  try {
    if (typeof text !== "string" || text.length === 0) return "en";

    const devanagari = (text.match(/[\u0900-\u097F]/g) ?? []).length;
    const bengali = (text.match(/[\u0980-\u09FF]/g) ?? []).length;
    const latin = (text.match(/[A-Za-z]/g) ?? []).length;

    // No Indic script present at all — assume English.
    if (devanagari === 0 && bengali === 0) return "en";

    // Majority wins, so an English title quoting one Hindi word stays English.
    if (devanagari >= bengali && devanagari >= latin) return "hi";
    if (bengali > devanagari && bengali >= latin) return "bn";
    return "en";
  } catch {
    return "en";
  }
}
