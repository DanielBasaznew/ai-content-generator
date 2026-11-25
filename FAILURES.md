# Failures and Troubleshooting Log

This file records technical blockers, failed API or GPU runs, unsatisfactory generations, and how each issue was resolved or worked around.

## Guidelines
- Document failures honestly as they happen (quotas, VRAM/OOM, rate limits, pronunciation issues, character drift, FFmpeg filter errors, etc.).
- Record what you tried and what fixed or bypassed the issue.
- Never include API keys, tokens, or secrets in error snippets.
- Do not invent failures.

---

## Failure Summary

| Failure ID | Date | Stage / Tool | Symptom | Resolution / Workaround | Status |
| --- | --- | --- | --- | --- | --- |
| `FAIL-001` | 2026-11-25 | narration / `gemini-3.8-flash-tts` | `429 RESOURCE_EXHAUSTED` (free-tier 3 RPM limit exceeded on `shot-09`) | Added `retryDelay` parsing, `21.0s` call pacing, and incremental cache/storyboard save | Resolved |

---

## Failure Entry Template

Copy this template whenever something breaks:

```markdown
### FAIL-XXX: <Short Description of Problem>
- **Date:** YYYY-MM-DD
- **Stage / Component:** <setup | schema | narration | keyframes | video | music | assembly>
- **Tool / Model:** <Provider, CLI, or script name>
- **Error / Symptom:** <Sanitized error message or visual/audio defect observed>
- **Root Cause:** <Why it happened, if known>
- **What Was Tried:** <Steps attempted to diagnose or fix>
- **Resolution / Workaround:** <Final fix or fallback used>
- **Status:** <Open | Resolved | Mitigated>
```

---

## Logged Failures

### FAIL-001: Gemini Free-Tier TTS 3 RPM Rate Limit (`429 RESOURCE_EXHAUSTED`)
- **Date:** 2026-11-25
- **Stage / Component:** narration (`pipeline/narration.py`)
- **Tool / Model:** Google Gemini API (`gemini-3.8-flash-tts`)
- **Error / Symptom:** After Shots 2–8 succeeded across two short bursts, synthesizing `shot-09` failed with HTTP `429 RESOURCE_EXHAUSTED` (`GenerateRequestsPerMinutePerProjectPerModel-FreeTier`, `quotaValue: '3'`, `retryDelay: '49s'`).
- **Root Cause:** Free tier for `gemini-3.8-flash-tts` enforces **3 requests per minute**, whereas the initial retry wrapper capped backoff at `16s` across 4 attempts (~28s total) and fired sequential requests without pacing.
- **What Was Tried:** Inspected the API error payload (`retryDelay: '49s'`) and confirmed Shots 1–8 were already saved in `assets/narration/` and `narration_cache.json`.
- **Resolution / Workaround:** Replaced the short backoff in `pipeline/narration.py` with `_extract_retry_after()` (`retryDelay + 2s`, up to 5 attempts), added `min_interval_seconds=21.0` pacing between uncached calls, and wrapped `save_storyboard()` in a `try/finally` block so partial runs persist safely. Re-running `python -m pipeline.narration` hit cache for Shots 1–8 and generated Shots 9–10 cleanly.
- **Status:** Resolved
