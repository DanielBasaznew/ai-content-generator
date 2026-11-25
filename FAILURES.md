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
| `FAIL-002` | 2026-11-25 | keyframes / `@cf/black-forest-labs/flux-2-klein-4b` | Pilot `shot-03` (seed `2003`) rendered a 3-legged parent figure artifact and distant monument glare | Simplified `shot-03` prompt, strengthened `negative_prompt`, updated seed `2003` -> `2013`, regenerated clean frame | Resolved |

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

### FAIL-002: Pilot Keyframe Anatomy Artifact (`shot-03`, Seed `2003`)
- **Date:** 2026-11-25
- **Stage / Component:** keyframes (`pipeline/keyframes.py`)
- **Tool / Model:** Cloudflare Workers AI (`@cf/black-forest-labs/flux-2-klein-4b`)
- **Error / Symptom:** Visual inspection of the Step 7 pilot keyframe (`assets/keyframes/shot-03.png`, seed `2003`, `12.466s`) revealed an extra third leg on the parent figure walking ahead of the child and distracting bright glare around the distant monument silhouette.
- **Root Cause:** Compound multi-person depth cues paired with seed `2003` introduced anatomical limb duplication on a secondary figure, while `@cf/black-forest-labs/flux-2-klein-4b` does not accept a standalone `negative_prompt` form field.
- **What Was Tried:** Audited the generated `1024x1024` frame against `ref_narrator_child.png` and `ref_harar_roundabout_memory.png`, then inspected Shot 3's prompt and seed configuration in `storyboard.json`.
- **Resolution / Workaround:** Simplified `shot-03`'s `main_prompt` to clarify exactly two naturally walking adults ahead of the centered child, added anatomy and glare exclusions to `negative_prompt`, changed `shot-03` seed from `2003` to `2013`, and regenerated `assets/keyframes/shot-03.png` (`16.453s`). Visual inspection confirmed clean two-legged anatomy and warm morning balance. *(Side inspection finding: `shot-08` positioned the returning adult silhouette on the left-center plaza edge, so `storyboard.json` `shot-08` `editing.composition.vertical_9_16.crop_anchor` was updated from `"center"` to `"left"`.)*
- **Status:** Resolved
