# Costs, Quotas, and Performance Log

This file tracks model usage, free-tier quotas, latency, GPU minutes, and estimated list-price equivalents across all pipeline stages.

## Guidelines
- Record only measured or verified numbers from `runs.jsonl` and provider dashboards.
- Do not invent cost figures, latencies, or quota limits before verification.

---

## 1. Provider Free-Tier & Resource Verification

| Provider / Tool | Planned Usage | Current Access / Quota Status | Notes |
| --- | --- | --- | --- |
| Google AI Studio / Gemini API | Script, storyboard, translation, TTS narration | Verified; **3 RPM** free-tier limit observed on `gemini-3.8-flash-tts` | `11` TTS calls (`10` OK + `1` 429) + `1` QA call (`gemini-2.5-flash`) logged in `runs.jsonl`; `$0.00` spend |
| Cloudflare Workers AI | FLUX image generation (references & keyframes) | Verified; `4` Step 6 reference PNGs generated via `@cf/black-forest-labs/flux-2-klein-4b` | `multipart/form-data` schema confirmed; `64.931s` total across 4 images; `$0.00` spend |
| Kaggle (GPU Notebooks) | Wan 2.2 video generation & ACE-Step music | API auth verified (`Kaggle CLI 2.2.5`, dataset query OK) | Credentials configured in `.env`; confirm phone verification in Kaggle UI for weekly GPU quota |
| FFmpeg (Local) | Video & audio assembly, exports | Installed via `imageio-ffmpeg 0.8.1` (`ffmpeg 9.0.2`) | Available to Python scripts; optional global `ffmpeg`/`ffprobe` on PATH can be added via `winget` |

---

## 2. Stage-by-Stage Resource & Cost Summary

| Stage | Model / Tool | Total Calls | Total Latency (s) | GPU Minutes | Estimated / Actual Cost (USD) | List-Price Equivalent (USD) |
| --- | --- | --- | --- | --- | --- | --- |
| Storyboard & Script | Gemini API | 0 | 0 | 0 | $0.00 | Pending |
| Narration | Gemini TTS (`gemini-3.8-flash-tts`) | 11 | 67.424 | 0 | $0.00 | Pending (2,071 tokens; 10 clips = 64.85s audio) |
| Narration QA Check | Gemini (`gemini-2.5-flash`) | 1 | 7.261 | 0 | $0.00 | Pending (3,276 tokens) |
| References (Step 6) | FLUX (`@cf/black-forest-labs/flux-2-klein-4b`) | 4 | 64.931 | 0 | $0.00 | Pending (4 PNGs: two 1344x768, two 1024x1024) |
| Keyframes | FLUX (Cloudflare Workers AI) | 0 | 0 | 0 | $0.00 | Pending |
| Moving Shots | Wan 2.2 (Kaggle) | 0 | 0 | 0 | $0.00 | Pending |
| Original Music | ACE-Step (Kaggle) | 0 | 0 | 0 | $0.00 | Pending |
| Assembly & Export (Radio Cut) | FFmpeg 9.0.2 (`imageio-ffmpeg`) | 1 | < 1.0 | 0 | $0.00 | $0.00 |
| **Total** | — | **17** | **139.616+ (API)** | **0** | **$0.00** | **Pending** |

---

## 3. Run Log Template (Per Session / Milestone)

### Session 2026-11-25 — Step 5 Amharic Narration & Radio Cut Assembly
- **Calls Executed:** 12 Gemini API calls (`11` `gemini-3.8-flash-tts` calls including `1` `429` error + `1` `gemini-2.5-flash` audio QA call) + `1` local FFmpeg radio-cut assembly pass
- **Models Used:** `gemini-3.8-flash-tts` (voice `Charon`), `gemini-2.5-flash`
- **Measured Total Latency:** `74.685s` API latency (`54.653s` successful TTS + `12.771s` failed attempt + `7.261s` QA)
- **GPU Time Consumed:** `0` minutes (hosted API + local CPU FFmpeg)
- **Actual Spend:** `$0.00` (Gemini API free tier)
- **Estimated List-Price Equivalent:** Pending (5,347 total Gemini tokens across `2,071` TTS + `3,276` QA)
- **Quota Observations:** `gemini-3.8-flash-tts` free tier is capped at **3 requests per minute (3 RPM)** (`FAIL-001`), resolved via `21.0s` pacing and `retryDelay` backoff.

### Session 2026-11-25 — Step 6 Character & Style Reference Sheet Generation
- **Calls Executed:** 4 Cloudflare Workers AI image calls (`ref_narrator_child`, `ref_narrator_adult`, `ref_harar_roundabout_memory`, `ref_harar_streets`)
- **Models Used:** `@cf/black-forest-labs/flux-2-klein-4b` (Apache 2.0, `multipart/form-data`, fixed 4 steps)
- **Measured Total Latency:** `64.931s` (`13.572s`, `24.148s`, `13.833s`, `13.378s`)
- **GPU Time Consumed:** `0` local/Kaggle minutes (hosted Cloudflare Workers AI)
- **Actual Spend:** `$0.00` (Cloudflare Workers AI free daily allowance)
- **Estimated List-Price Equivalent:** Pending
- **Quota Observations:** All 4 images completed without throttling; re-run verified 4/4 SHA-256 cache hits.

```markdown
### Session YYYY-MM-DD — <Stage or Milestone>
- **Calls Executed:** <count>
- **Models Used:** <model names>
- **Measured Total Latency:** <seconds>
- **GPU Time Consumed:** <minutes, if applicable>
- **Actual Spend:** <$0.00 free tier or amount>
- **Estimated List-Price Equivalent:** <amount + pricing source/date>
- **Quota Observations:** <remaining daily/weekly allowance or throttling notes>
```
