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
| `FAIL-003` | 2026-11-26 | video / `kaggle 2.2.5` CLI | `401 Unauthorized` on `kernels_list` & `PermissionError` on `.kaggle` in sandbox | Mapped `KGAT_` token to `KAGGLE_API_TOKEN` (Bearer auth) and set writable `KAGGLE_CONFIG_DIR` lazily | Resolved |
| `FAIL-004` | 2026-11-26 | video / `Wan2.2-TI2V-5B-Diffusers` (Kaggle T4) | `NameError: ftfy`, `14.54 GiB` UMT5/VAE CUDA OOM, and `_DummyTextEncoder` `StopIteration` in pilot v2–v4 | Installed `ftfy`, pre-encoded prompts before loading transformer/VAE, and added 2-byte `nn.Parameter` stub | Resolved |
| `FAIL-005` | 2026-11-26 | video / `Wan2.2-TI2V-5B-Diffusers` | Batch A/B audit caught orange sky blobs (`03, 10`), glare washout (`04`), and pink dot (`09`) | Removed flare/glow cues, strengthened negative prompts, bumped seeds `3013, 3014, 3019, 3020`, re-ran selective batch | Resolved |

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

### FAIL-003: Kaggle `KGAT_` Token Auth Mismatch (`401 Unauthorized`) & Windows Sandbox `.kaggle` Access Error
- **Date:** 2026-11-26
- **Stage / Component:** video (`pipeline/video.py` / `kaggle 2.2.5`)
- **Tool / Model:** Kaggle Python SDK (`kaggle 2.2.5`)
- **Error / Symptom:** Importing `kaggle` inside the restricted workspace attempted `os.makedirs("C:\\Users\\DELL\\.kaggle")` (`PermissionError`), and authenticating with `KAGGLE_KEY=KGAT_...` returned `401 Client Error: Unauthorized` on `ListKernels`.
- **Root Cause:** Kaggle v2 API access tokens prefixed with `KGAT_` require Bearer token authentication (`KAGGLE_API_TOKEN`) via `/v1/security.OAuthService/IntrospectToken`, whereas setting `KAGGLE_KEY` triggers legacy Basic auth. Meanwhile `kaggle/__init__.py` creates `KAGGLE_CONFIG_DIR` at import time.
- **What Was Tried:** Inspected `.env` token prefix safely and reviewed `KaggleApi.authenticate` in `kaggle_api_extended.py`.
- **Resolution / Workaround:** Implemented `_resolve_kaggle_credentials()` and lazy `authenticate_kaggle_api()` in `pipeline/video.py` to detect `KGAT_` tokens, map them exclusively to `KAGGLE_API_TOKEN`, and point `KAGGLE_CONFIG_DIR` to a writable scratch directory before importing `kaggle`.
- **Status:** Resolved

### FAIL-004: Kaggle T4 `Wan2.2-TI2V-5B-Diffusers` Pilot Setup & `14.54 GiB` CUDA OOM (`wan22-pilot-shot01` v2–v4)
- **Date:** 2026-11-26
- **Stage / Component:** video (`pipeline/video.py`)
- **Tool / Model:** `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (`diffusers 0.42.0`, `accelerate 1.15.0`) on Kaggle `Tesla T4`
- **Error / Symptom:** Three iterative pilot failures on `wan22-pilot-shot01`: v2 threw `NameError: name 'ftfy' is not defined` inside `WanImageToVideoPipeline.basic_clean`; v3 threw `torch.OutOfMemoryError` (`14.38 GiB / 14.56 GiB`) during `vae.encode()` right after `encode_prompt()`; v4 threw `StopIteration` inside `accelerate/hooks.py` (`next(prev_module.parameters()).device`).
- **Root Cause:** Kaggle's Docker image lacked `ftfy`; standard `enable_model_cpu_offload()` kept `UMT5-XXL` (~11.4 GB) resident alongside `AutoencoderKLWan` (`float32`), exceeding T4's `14.56 GiB` limit; and our initial v4 `_DummyTextEncoder` buffer-only stub had zero trainable/buffer-backed `nn.Parameter`s for `accelerate`'s hook inspector.
- **What Was Tried:** Audited each failure log (`wan22-pilot-shot01.log`) and separated text encoding from diffusion/VAE execution.
- **Resolution / Workaround:** Installed `ftfy beautifulsoup4` at kernel startup, pre-encoded prompts once on `cuda:0` and deleted `UMT5EncoderModel` + emptied CUDA cache before loading `transformer` (`float16`) and `AutoencoderKLWan` (`float32`, tiling + slicing enabled), and gave `_DummyTextEncoder` a 2-byte `torch.nn.Parameter`. Pilot v5 completed cleanly at `12.91 GB` peak VRAM (`EXP-006`).
- **Status:** Resolved

### FAIL-005: Visual Inspection Defects in Batch A/B Video Clips (`shot-03, 04, 09, 10`)
- **Date:** 2026-11-26
- **Stage / Component:** video (`pipeline/video.py`, `storyboard.json`)
- **Tool / Model:** `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (Kaggle `wan22-step8-batch-a` & `wan22-step8-batch-b`)
- **Error / Symptom:** Inspecting every clip frame-by-frame revealed 4 rejected outputs: `shot-03` (`seed 3003`) spawned an orange sky flare blob and merged/dropped walking figures; `shot-04` (`seed 3004`) developed washed-out golden glare over the child's eyes by `00:01`; `shot-09` (`seed 3009`) added a pink flare dot near the forehead by `00:02`; and `shot-10` (`seed 3010`) grew a large glowing red-orange cloud over the left rooftop.
- **Root Cause:** Words like `"golden bokeh shimmering"` and `"sunset light softly deepens"` amplified bright backlit highlights into diffusing orange/pink flare blobs over 73 temporal frames, while complex multi-person shadow prompts destabilized `shot-03`.
- **What Was Tried:** Audited extracted `start`/`mid`/`end` frames (`512x512`) and rendered MP4s side by side for all 10 shots.
- **Resolution / Workaround:** Removed glow/bokeh/shimmer cues from those 4 motion prompts, added explicit flare/artifact negative cues (`lens flare`, `orange cloud blob`, `pink halo`, `three legs`), updated seeds to `3013, 3014, 3019, 3020` in `storyboard.json`, and ran `wan22-step8-regen-1` (`EXP-007`). Visual inspection confirmed all 4 regenerated clips are clean and consistent. *(Also encountered one transient `ConnectTimeoutError` polling `api.kaggle.com:443`, resolved on immediate retry.)*
- **Status:** Resolved
