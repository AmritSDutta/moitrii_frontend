# Moitrii — Fix reuse matching + make reuse language-aware

Two linked defects in `convex/ai/reuseEngine.ts`. User approved **both**, with these constraints:
detect from **title only**, detection must be **total/failsafe** (never throw — English on any
failure), and `reusedCount` cleanup is **out of scope** (pre-launch).

## Root cause (confirmed against real output)

Requests `"Budget Hotels in Digha, west Bengal"` and `"Unveiling Hidden Gems: Budget Hotels in
Digha"` both returned *"Unveiling Hidden Gems: Budget Hotels in Darjeeling"* marked **Reused from
Shared Knowledge Ecosystem**.

`computeOverlapScore` (`reuseEngine.ts:32-39`) normalizes by `Math.min(|prompt|, |candidate|)`:

- Prompt tokens: `{budget, hotels, digha, west, bengal}` → 5
- Shared with the Darjeeling guide: `{budget, hotels}` → 2
- Score `2 / min(5, ~20)` = `2/5` = **0.40** → passes the `>= 0.4` gate at line 79

Two generic words are enough. The distinguishing tokens (Digha vs Darjeeling) are never weighted,
and there is no absolute floor. The second request shares 5 of 6 tokens with the reused title
(~0.83) because it copied the wrongly-reused headline.

**Same root cause as the Hindi symptom:** `checkContentReuse` is called with only `{prompt,
category}` (`agentRunner.ts:425-428`) — the user's `preferredLanguage` is never consulted, so a
Hindi user whose English prompt trips the threshold is handed the stored **English** guide. Bengali
"worked" only because Bengali-script prompts tokenize to zero under the old `[^a-z0-9]` pattern
(`reuseEngine.ts:26`), which force-skips reuse — and which also erases Devanagari.

## Fix A — matching criteria (`convex/ai/reuseEngine.ts`)

Full-file rewrite of the scoring half:

1. **Consistent denominator.** Drop `Math.min`. Score = `shared / |promptTokens|` — recall over the
   prompt only, so prompt length can never make a match look stronger.
2. **Absolute floor.** `MIN_SHARED_TOKENS = 3` (exported) — a candidate below it is skipped before
   scoring. This is what kills the Digha case: `shared = 2` → rejected regardless of ratio.
3. **Unicode-aware tokenizer.** `/[^\p{L}\p{M}\p{N}\s]/gu` instead of `/[^a-z0-9\s]/g`, so
   Devanagari and Bengali prompts tokenize at all (and can match native-script content).
   `\p{M}` is essential, not decorative: Indic vowel signs (matras) are Unicode *marks*, not
   letters, so a `\p{L}`-only class still shreds every Hindi/Bengali word into single-character
   fragments that the length filter then discards.
4. **Exported threshold** `REUSE_SIMILARITY_THRESHOLD = 0.5`, keeping the existing English
   `STOP_WORDS` set.

Re-check: Darjeeling guide for the Digha prompt → `shared = 2` → **no reuse** (was reuse).
Genuine duplicate `"Budget Hotels in Darjeeling"` → `shared = 3`, score `1.0` → reuse.

## Fix B — language-aware reuse

`language` is not stored on `content` today, so reuse cannot be language-scoped without it.

1. **`convex/ai/language.ts`** (new) — `detectScriptLanguage(text): SupportedLanguage`.

   **Failsafe by construction.** The function is *total*: it accepts `string | null | undefined`
   (typed loose on purpose, because it runs against stored documents), returns `"en"` for anything
   empty, non-string, or unparseable, and wraps its body in `try/catch` with `"en"` as the catch
   value. It never throws and never returns anything outside `"en" | "bn" | "hi"`. A detection
   failure must not be able to revert a wake cycle back to PENDING.

   Classification is majority-based (compare Devanagari `[\u0900-\u097F]`, Bengali `[\u0980-\u09FF]`,
   and Latin counts) rather than "contains any", so an English title quoting a Hindi word stays
   English; if all counts are zero, default `"en"`.

   ```ts
   export function detectScriptLanguage(text?: string | null): SupportedLanguage {
     try {
       if (typeof text !== "string" || text.length === 0) return "en";
       const devanagari = (text.match(/[\u0900-\u097F]/g) ?? []).length;
       const bengali = (text.match(/[\u0980-\u09FF]/g) ?? []).length;
       const latin = (text.match(/[A-Za-z]/g) ?? []).length;
       if (devanagari === 0 && bengali === 0) return "en";
       if (devanagari >= bengali && devanagari >= latin) return "hi";
       if (bengali > devanagari && bengali >= latin) return "bn";
       return "en";
     } catch {
       return "en";
     }
   }
   ```

2. **`convex/schema.ts`** — add to the `content` table:
   `language: v.optional(v.union(v.literal("en"), v.literal("bn"), v.literal("hi")))`.

3. **`convex/content.ts`** — persist it at both insert sites (`publishContent`, `internalPublishGuide`)
   by detecting from the **title** — no new argument:
   `language: detectScriptLanguage(args.title)`.
   Deriving beats plumbing: no new args, human-published guides are covered too, and a guide whose
   body is silently English despite a Hindi request gets classified honestly.

4. **`convex/agentRunner.ts`** — `checkContentReuse` gains `language: v.optional(v.string())` and
   forwards it; the workflow call site adds `language: userInfo.preferredLanguage`.

5. **`reuseEngine.evaluateContentReuse(ctx, prompt, category?, language?)`** — skips any candidate
   whose resolved language !== the user's preference, before scoring. Language resolution for each
   candidate is wrapped so a single malformed row can never abort the run:

   ```ts
   function resolveStoredLanguage(row: { language?: string; title?: string | null }): SupportedLanguage {
     try {
       const stored = row.language;
       if (stored === "en" || stored === "bn" || stored === "hi") return stored;
       return detectScriptLanguage(row.title);   // defaults to "en"
     } catch {
       return "en";
     }
   }
   ```

   If the user's own `language` arg is missing or unrecognised it is treated as `"en"`.

## Existing rows — what happens

**No migration or backfill is required, and nothing breaks.**

- The field **must be optional**. Convex validates every existing document against the schema on
  push; a required field would fail the deploy because all current `content` rows lack it. Optional
  means they stay valid.
- Legacy rows resolve through `resolveStoredLanguage()`: it prefers the stored field, else detects
  from that row's `title`. So the fix applies to the existing table immediately — current English
  guides classify as `"en"` and stop being served to Hindi users.
- **No new index is added**, so there is no staged-index backfill and no blocking deploy. (If a
  `by_category_and_language` index is ever wanted, it must be declared `staged: true`.)
- **`reusedCount` is left alone** — knowingly skipped, per the pre-launch call. The "What's Hot"
  ordering may carry stale inflation; not worth a cleanup mutation now.

## Tests

Extend the suite with `convex/ai/reuseEngine.test.ts`, seeding Travel guides (one Darjeeling, English)
and asserting:
- Digha prompt vs Darjeeling guide → **not** reused (regression for the reported bug)
- near-identical prompt → reused
- Hindi/Bengali request → never reuses an English guide
- `detectScriptLanguage` failsafe cases: `undefined`, `null`, `""`, `"12345"`, and a non-string input
  all return `"en"` without throwing
- Bengali title → `"bn"`, Devanagari title → `"hi"`, ASCII title → `"en"`

## Verification

1. `npm test` — existing 99 plus the new cases.
2. `npm run build` — 0 TypeScript errors. `convex/_generated/dataModel.d.ts` will not know about
   `content.language` until the next codegen; the reuse code reads it defensively (via a loose row
   type), so no codegen is required to typecheck.
3. `npx convex dev` (user, against the deployment) to push the optional-field schema change and
   confirm it applies cleanly to the existing table.
