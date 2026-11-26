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
| Cloudflare Workers AI | FLUX image generation (references & keyframes) | Verified; `4` Step 6 reference PNGs + `11` Step 7 keyframe calls via `@cf/black-forest-labs/flux-2-klein-4b` | `multipart/form-data` schema confirmed; `204.261s` total across `15` calls (`64.931s` Step 6 + `139.330s` Step 7); `$0.00` spend |
| Kaggle (GPU Notebooks) | Wan 2.2 video generation & ACE-Step music | Verified active (`2x Tesla T4`, 15.64 GB each); `5` completed GPU runs (`131.15` session min; `~148` min incl. pilot retries) | Uses `KAGGLE_API_TOKEN` for `KGAT_` Bearer auth; ~27.5 hrs/wk GPU quota remaining for Step 9 |
| FFmpeg (Local) | Video & audio assembly, exports | Installed via `imageio-ffmpeg 0.8.1` (`ffmpeg 9.0.2`) | Available to Python scripts; optional global `ffmpeg`/`ffprobe` on PATH can be added via `winget` |

---

## 2. Stage-by-Stage Resource & Cost Summary

| Stage | Model / Tool | Total Calls | Total Latency (s) | GPU Minutes | Estimated / Actual Cost (USD) | List-Price Equivalent (USD) |
| --- | --- | --- | --- | --- | --- | --- |
| Storyboard & Script | Gemini API | 0 | 0 | 0 | $0.00 | Pending |
| Narration | Gemini TTS (`gemini-3.8-flash-tts`) | 11 | 67.424 | 0 | $0.00 | Pending (2,071 tokens; 10 clips = 64.85s audio) |
| Narration QA Check | Gemini (`gemini-2.5-flash`) | 1 | 7.261 | 0 | $0.00 | Pending (3,276 tokens) |
| References (Step 6) | FLUX (`@cf/black-forest-labs/flux-2-klein-4b`) | 4 | 64.931 | 0 | $0.00 | Pending (4 PNGs: two 1344x768, two 1024x1024) |
| Keyframes | FLUX (`@cf/black-forest-labs/flux-2-klein-4b`) | 11 | 139.330 | 0 | $0.00 | Pending (`10` active `1024x1024` PNGs + `1` replaced pilot `shot-03`) |
| Moving Shots | Wan 2.2 (`Wan-AI/Wan2.2-TI2V-5B-Diffusers` on Kaggle `2x T4`) | 14 | 6500.210 | 131.15 | $0.00 | Pending (`10` final `512x512` 24fps MP4s + `4` replaced clips; `~148` GPU min incl. pilot v2–v4) |
| Original Music | ACE-Step (Kaggle) | 0 | 0 | 0 | $0.00 | Pending |
| Assembly & Export (Radio Cut) | FFmpeg 9.0.2 (`imageio-ffmpeg`) | 1 | < 1.0 | 0 | $0.00 | $0.00 |
| **Total** | — | **42** | **6779.156+ (API/GPU)** | **131.15** | **$0.00** | **Pending** |

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

### Session 2026-11-25 — Step 7 Storyboard Keyframe Generation
- **Calls Executed:** 11 Cloudflare Workers AI image calls (`shot-01` through `shot-10`, plus initial pilot `shot-03` seed `2003` replaced by seed `2013`)
- **Models Used:** `@cf/black-forest-labs/flux-2-klein-4b` (Apache 2.0, `multipart/form-data`, fixed 4 steps, `1024x1024`)
- **Measured Total Latency:** `139.330s` (`11.201s`, `13.036s`, `12.466s` pilot + `16.453s` regen, `14.093s`, `12.118s`, `8.606s`, `10.432s`, `14.011s`, `17.652s`, `9.262s`)
- **GPU Time Consumed:** `0` local/Kaggle minutes (hosted Cloudflare Workers AI)
- **Actual Spend:** `$0.00` (Cloudflare Workers AI free daily allowance)
- **Estimated List-Price Equivalent:** Pending
- **Quota Observations:** All 11 calls succeeded with zero throttling; re-run of `python -m pipeline.keyframes` verified 10/10 SHA-256 cache hits (`generated: 0, cached: 10`).

### Session 2026-11-26 — Step 8 Wan 2.2 Moving-Shot Video Generation (Kaggle `2x T4`)
- **Calls Executed:** `14` `Wan-AI/Wan2.2-TI2V-5B-Diffusers` generation calls across `4` successful generation kernels (`wan22-pilot-shot01` v5 [`shot-01`], `wan22-step8-batch-a` [`shot-02`–`06`], `wan22-step8-batch-b` [`shot-07`–`10`], `wan22-step8-regen-1` [`shot-03, 04, 09, 10` regen]), plus `wan22-env-probe` (`39.94s`)
- **Models Used:** `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (Apache 2.0, `float16` transformer + `float32` `AutoencoderKLWan`, `512x512`, `73` frames @ `24 fps`, `25` steps, `guidance_scale=5.0`)
- **Measured Total Latency:** `6500.210s` (`108.34 min`) pure video inference latency (`428.53s` `shot-01`; `484.01s, 473.28s, 472.06s, 471.16s, 472.05s` Batch A; `474.54s, 462.33s, 461.56s, 461.37s` Batch B; `467.92s, 457.97s, 456.91s, 456.52s` Regen 1); `7869.22s` (`131.15` min) complete Kaggle GPU session time (`+~17 min` across failed pilot debug versions v2–v4)
- **GPU Time Consumed:** `131.15` session minutes (`~148` total incl. debug runs out of `1800` min / `30 hrs` weekly quota)
- **Actual Spend:** `$0.00` (Kaggle free weekly GPU quota)
- **Estimated List-Price Equivalent:** Pending
- **Quota Observations:** Peak single-GPU VRAM stayed at `12.91 GB / 14.56 GiB` after isolating UMT5 prompt pre-encoding (`FAIL-004`). Re-run of `python -m pipeline.video` verified `10/10` SHA-256 cache hits (`generated: 0, cached: 10`).

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
