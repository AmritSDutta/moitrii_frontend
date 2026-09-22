# High-Level Code Review — Uncommitted Changes

**Scope:** Firecrawl refactor to `convex/ai/tools/`, new `convex/ai/imagegen.ts` + `convex/ai/prompts.ts`, Sarvam AI primary TTS in `convex/ai/tts.ts`, image-gen step in the wake workflow (`convex/agentRunner.ts`), and doc/README updates.

**Verification:** `npm test` → 12 files / 68 tests, all passing. Schema already contains `coverImageStorageId`/`audioStorageId` in `convex/schema.ts` and `content.ts`, so persistence wiring is consistent.

## 🔴 High-Level Issues

### 1. `imageGenStep` runs unconditionally and serially — cost & latency
`userWakeWorkflow` now always calls `imageGenStep` (gpt-image-1, landscape `1792x1024`-class) for **every** wake, even when the content was a reuse hit or when the guide came from the offline fallback synthesizer. gpt-image-1 at that size is a costly image call, and the step sits **before** `narrationStep`, adding its full latency to the critical path.
**Suggestion:** skip the step on reuse hits (or make it conditional on fresh generation), and consider running image + narration in parallel via `step.parallelize` if the workflow component supports it, or at least place the cheap reuse-check gate earlier.

### 2. Contradiction between prompt invariants in `INFOGRAPHIC_PROMPT_TEMPLATE`
The template demands "STRICTLY NO TEXT, NO WORDS, NO LABELS" while also instructing a **"Moitrii" watermark text** — a direct contradiction that produces inconsistent model behavior (watermark ignored, or model adding text elsewhere). Also, gpt-image-1 can still ignore "no text" instructions; the prompt relies on the model for a guarantee it can't fully honor.
**Suggestion:** either accept watermark text as the sole text exception (state it explicitly as such) or drop the watermark from the prompt and overlay it client/server-side deterministically.

### 3. Signed-URL `coverImage` persisted in DB (`agentRunner.ts:487`)
`coverImage: imageResult.coverImage || guide.coverImage` stores the value returned by `ctx.storage.getUrl()`, which is a **signed URL that can expire**. The publish mutation (`content.ts`) re-resolves from `coverImageStorageId`, which mitigates it, but storing a perishable URL as the canonical `coverImage` is fragile — the same anti-pattern the FAQ/README explicitly calls out as an invariant ("never persist ephemeral URLs").
**Suggestion:** pass `""` or the Unsplash fallback when a `coverImageStorageId` exists and let the publish mutation resolve the CDN URL exclusively from the storage id.

### 4. `as any` casts on storage IDs (`agentRunner.ts:488, 490`)
`imageResult.coverImageStorageId as any` and `audioStorageId as any` bypass type checking at an API boundary. The AGENTS.md conventions require type annotations at API boundaries; these casts can hide an `Id<"users">` vs `Id<"_storage">` mix-up.
**Suggestion:** type the workflow args validators as `v.optional(v.id("_storage"))` and drop the casts (the pre-existing `audioStorageId` cast should be fixed too).

### 5. Sarvam TTS response format mismatch risk (`tts.ts`)
The code assumes `data.audios?.[0] || data.audio` is **base64** and wraps it as `audio/wav`. Sarvam Bulbul's default response encoding and container are not validated here — if the API returns raw WAV bytes or a different encoding, the stored blob will be corrupt with no detection. There's also **no content-type verification** on the response.
**Suggestion:** confirm/force the expected encoding in the request (e.g., `response_encoding`/`audio_format` params if Sarvam supports them), and log `response.headers.get("content-type")` on failure.

### 6. Retry loop retries non-retryable failures (`tts.ts`)
The 2-attempt Sarvam loop retries on **any** non-OK status, including 401/403 (bad key) and 400 (invalid request) — guaranteed wasted calls and doubled latency before falling back. Combined with the workflow's own `maxAttempts: 2` retry around `narrationStep`, worst case is 4 Sarvam attempts.
**Suggestion:** only retry on 429/5xx/network errors; fail fast on 4xx auth/validation errors.

### 7. Workflow retry policy may fight the internal fallback design
`narrationStep`/`imageGenStep` are designed to **never throw** (they fall back internally), yet the workflow wraps them in `retry.maxAttempts: 2`. That retry is dead weight in the success path and only fires if storage itself throws — fine, but worth knowing the effective retry topology is duplicated (internal loop in `tts.ts` × workflow retry).

### 8. Docs claim drift vs. code
- `hackathon.md` says Sarvam uses `speaker: "shubh"`; the code uses `speaker: "ritu"`.
- `docs/convex-api.mdx` pipeline list (8 steps) needs the new `imageGenStep` documented as a numbered step — README's mermaid was updated but the API doc step list still reads 8 steps with image-gen absent.
- README mermaid labels image-gen under `AI_Image` but the workflow description in README section "triggerScheduledWakes" step list should also mention cover-image generation.

### 9. `getKeywordUnsplashCover(topic, category)` ignores `topic`
The exported function takes `topic` but never uses it — it's an exact duplicate of the inline `CATEGORY_COVERS[normCat] || CATEGORY_COVERS.default` logic repeated in `imagegen.ts:66` and `synthesizer.ts:262`. Either implement keyword-based selection or remove the parameter to avoid a misleading API.

### 10. `firecrawlToolDefinition` is speculative scaffolding
The "tool definition" object (`tools/firecrawl.ts:100`) references a Convex Agent tool-registration convention that nothing in the codebase consumes — it's dead export kept only so tests can import it. If it's intended for the `@convex-dev/agent` component, wire it in; otherwise it's noise that will rot.

## 🟡 Minor

- `Buffer.from(base64)` in `imagegen.ts`/`tts.ts` — fine in Convex Node actions, but confirm both run in the Node runtime (they do, `internalAction` in workflow steps), otherwise `Buffer` is unavailable in edge runtime.
- `tts.ts` truncates narration to 500 chars (`text.slice(0, 500)`) — a hard mid-sentence cut; consider trimming to the last sentence boundary.
- `new Date().toLocaleDateString("en-US", ...)` in `prompts.ts` runs on whatever machine evaluates it — fine for actions, but the injected "current date" will be server-time (UTC), not IST; the README/branding emphasizes IST everywhere.
- `language` arg in `narrationStep` is `v.optional(v.string())` — could be `v.union(v.literal("en"), v.literal("hi"), v.literal("bn"))` for consistency with `SupportedLanguage`.
- Line-ending churn: every touched file shows LF→CRLF warnings; consider adding a `.gitattributes` to stop noisy diffs.

## ✅ What's Good

- Clean module extraction: `prompts.ts` (dynamic date/language), `tools/` barrel replacing the deleted `firecrawl.ts`, and `imagegen.ts` — good separation of concerns matching the documented "Modular AI Engine" architecture.
- Consistent graceful-degradation pattern: Sarvam → OpenAI → offline WAV (TTS) and gpt-image-1 → Unsplash category covers (image) — never throws, matching the project's established fallback philosophy.
- All internal callers/tests updated; the `import.meta.glob` module map picks up the new `tools/` subdirectory automatically.
- 68/68 tests pass; schema and publish path fully support `coverImageStorageId`.

---

**Summary of recommended priorities before commit:** (1) gate/skip the gpt-image-1 step to control cost, (2) fix the stored signed-URL issue on `coverImage`, (3) fix the prompt contradiction, (4) reconcile the `speaker` name in docs, (5) remove the `as any` casts.

> **Model note:** the codebase currently calls `dall-e-3` in `convex/ai/imagegen.ts`; the review assumes migration to **`gpt-image-1`** as the replacement model (it returns `b64_json` natively and generally renders text/watermarks more reliably — but verify the exact `size` parameter values accepted by the API, e.g. `1536x1024`, when switching, since `1792x1024` was a DALL·E 3-specific size).

---

## 🔁 Re-Review (post-fix pass) — Status of Original Findings

**Re-verified after another agent's fixes:** `npm test` → 68/68 passing (12 suites); `npm run build` → 0 TS errors.

| # | Original Issue | Status |
|---|---|---|
| 1 | `imageGenStep` unconditional & serial | ⚠️ **NOT FIXED** — still runs for every wake (including reuse hits) and still sits before `narrationStep` |
| 2 | Prompt contradiction (no-text vs watermark) | ✅ FIXED — now "STRICTLY NO TEXT … (except the subtle watermark below)" + "WATERMARK (SOLE TEXT EXCEPTION)" |
| 3 | Signed-URL stored as `coverImage` | 🟡 PARTIAL — publish now uses `guide.coverImage || imageResult.coverImage`, but `imagegen.ts:117` still returns the perishable `storageUrl` as `coverImage`; when `guide.coverImage` is empty the signed URL still lands in the DB (mitigated by `coverImageStorageId` re-resolution) |
| 4 | `as any` casts on storage IDs | ✅ FIXED — both casts removed; publish args now pass typed values directly |
| 5 | Sarvam response format unvalidated | 🟡 PARTIAL — fail-fast added, but base64/`audio/wav` assumption still unverified; no content-type logging |
| 6 | Retrying non-retryable 4xx | ✅ FIXED — breaks on 400/401/403/404, retries only 429/5xx/network |
| 7 | Duplicate retry topology | ⚠️ NOT FIXED (low priority) — workflow `maxAttempts: 2` still wraps internally-fallback steps |
| 8 | Docs drift (`shubh` vs `ritu`, missing step) | ✅ FIXED — `hackathon.md` now says `ritu`; `docs/convex-api.mdx` pipeline lists `imageGenStep` as step 4 (now 8 steps total); new `docs/image-generation.mdx` + `docs/audio-generation.mdx` added and registered in `docs.json` |
| 9 | `getKeywordUnsplashCover` ignores `topic` | ✅ FIXED — now performs keyword matching over topic+category with resilient fallbacks |
| 10 | Dead `firecrawlToolDefinition` export | 🟡 PARTIAL — still unused in production code, but now covered by a conformance test (intentional scaffolding) |

**Minor items also fixed:**
- ✅ Sentence-boundary trimming (`trimToSentenceBoundary`, incl. Bengali `।`) replaces the hard 500-char cut
- ✅ IST timezone: `prompts.ts` now uses `timeZone: "Asia/Kolkata"` for `{CURRENT_DATE}`
- ✅ New tests added for prompts, prompt-template invariants, keyword covers, and tool definition

## 🆕 New Issues Introduced in the Fix Pass

### N1. `gpt-image-1` call omits `size` — will default to square, not 16:9 (`imagegen.ts:100-105`)
The request now sends `model: "gpt-image-1"` with **no `size` parameter**. gpt-image-1 defaults to `1024x1024` (square), while the prompt and all docs promise a 16:9 landscape banner. The prompt's "wide horizontal landscape composition" instruction cannot override the API's output dimensions.
**Fix:** add `size: "1536x1024"` (gpt-image-1's supported landscape size).

### N2. `response_format: "b64_json"` may be invalid for gpt-image-1 (`imagegen.ts:103`)
gpt-image-1 **always returns base64** and the Images API rejects `response_format` for this model (it's a DALL·E 2/3-only parameter). If so, every call 400s and silently falls back to Unsplash — meaning **image generation may never actually work**. Verify with a live call; if confirmed, remove the parameter (the `data.data[0].b64_json` parsing already handles gpt-image-1's native response).

### N3. Doc claim: "low-cost `gpt-image-1`" (`docs/image-generation.mdx:44`)
gpt-image-1 is OpenAI's *premium* image model (notably more expensive per image than `dall-e-3` standard at comparable sizes). Either qualify the claim or consider `gpt-image-1-mini` if cost matters — relevant given issue #1 (the step runs on every wake).

## 📋 Remaining Priority List

1. **N1/N2 (blocking):** add `size: "1536x1024"` and remove/verify `response_format` — otherwise generated covers are square or the API call fails entirely
2. **#1:** gate `imageGenStep` on non-reuse / fresh-generation wakes
3. **#3:** stop returning perishable `storageUrl` as `coverImage` from `imagegen.ts`
4. **N3:** correct the "low-cost" claim or switch to `gpt-image-1-mini`


