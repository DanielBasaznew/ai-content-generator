# Costs, Quotas, and Performance Log

This file tracks model usage, free-tier quotas, latency, GPU minutes, and estimated list-price equivalents across all pipeline stages.

## Guidelines
- Record only measured or verified numbers from `runs.jsonl` and provider dashboards.
- Do not invent cost figures, latencies, or quota limits before verification.

---

## 1. Provider Free-Tier & Resource Verification

| Provider / Tool | Planned Usage | Current Access / Quota Status | Notes |
| --- | --- | --- | --- |
| Google AI Studio / Gemini API | Script, storyboard, translation, TTS narration | Pending verification | API key not yet configured (`GEMINI_API_KEY`) |
| Cloudflare Workers AI | FLUX image generation (references & keyframes) | Pending verification | Account ID / token not yet configured (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) |
| Kaggle (GPU Notebooks) | Wan 2.2 video generation & ACE-Step music | Pending verification | `kaggle 2.2.5` CLI installed; account phone verification & credentials pending |
| FFmpeg (Local) | Video & audio assembly, exports | Installed via `imageio-ffmpeg 0.8.1` (`ffmpeg 9.0.2`) | Available to Python scripts; optional global `ffmpeg`/`ffprobe` on PATH can be added via `winget` |

---

## 2. Stage-by-Stage Resource & Cost Summary

| Stage | Model / Tool | Total Calls | Total Latency (s) | GPU Minutes | Estimated / Actual Cost (USD) | List-Price Equivalent (USD) |
| --- | --- | --- | --- | --- | --- | --- |
| Storyboard & Script | Gemini API | 0 | 0 | 0 | $0.00 | Pending |
| Narration | Gemini TTS | 0 | 0 | 0 | $0.00 | Pending |
| Keyframes | FLUX (Cloudflare Workers AI) | 0 | 0 | 0 | $0.00 | Pending |
| Moving Shots | Wan 2.2 (Kaggle) | 0 | 0 | 0 | $0.00 | Pending |
| Original Music | ACE-Step (Kaggle) | 0 | 0 | 0 | $0.00 | Pending |
| Assembly & Export | FFmpeg (Local) | 0 | 0 | 0 | $0.00 | $0.00 |
| **Total** | — | **0** | **0** | **0** | **$0.00** | **Pending** |

---

## 3. Run Log Template (Per Session / Milestone)

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
