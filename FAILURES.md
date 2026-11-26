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
| `FAIL-006` | 2026-11-26 | music / `ACE-Step 1.5` (Kaggle T4) | Kernel v1 failed Python `<3.13` `diffusers` dependency pin; v2 threw `NameError: name 'true' is not defined` in rendered `JOBS` | Installed with `--ignore-requires-python` + pinned `diffusers<0.39`; wrapped `JOBS` in `json.loads(repr(jobs_json))` | Resolved |
| `FAIL-007` | 2026-11-26 | music / `ACE-Step 1.5` audio audit | Listening audit found unintended kick pulse in `cand_02` and background vocal humming in `cand_04_part_b` (`~50–78s`) | Rejected `cand_02` and `cand_04` during formal audition; selected strictly instrumental `cand_03_chamber_piano_pad` | Resolved |
| `FAIL-008` | 2026-11-26 | music / `pipeline/music.py` (`ebur128`) | Initial `audition` printed `-70.0 LUFS` because `re.search` matched first frame (`t: 0.099`) instead of `Summary:` | Switched `_analyze_wav_metrics` to `re.findall(...)[-1]` and re-ran `audition` + `select` | Resolved |
| `FAIL-009` | 2026-11-26 | assembly / `pipeline/assembly.py` (`zoompan`, `.ass`) | `zoompan` stayed static when referencing `in` and word-halving left orphan subtitle words (`"there."`, `"and"`, `"I"`) | Switched `zoompan` counter to `on` (`+7%` tail push) and implemented balanced clause/comma wrapping | Resolved |
| `FAIL-010` | 2026-11-26 | assembly / `render_end_card_png` | Visual inspection of `01:21` caught `ACE- / Step 1.5` hyphen break, dangling `| Music:`, and 18-step radial banding | Updated end card to `48`-step smooth glow and explicit multi-line provenance; rebuilt both MP4s (`--force`) | Resolved |

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

### FAIL-006: Kaggle ACE-Step 1.5 Python 3.13 Install Conflict & Worker `JOBS` JSON Boolean Crash (`acestep-step9-candidates` v1–v2)
- **Date:** 2026-11-26
- **Stage / Component:** music (`pipeline/music.py`)
- **Tool / Model:** `ACE-Step/ACE-Step-1.5` (`acestep-v15-turbo` + `acestep-5Hz-lm-1.7B`) on Kaggle Python `3.13.16`
- **Error / Symptom:** Kernel v1 failed `pip install` due to upstream `requires-python <3.13` and `diffusers`/`transformers` pins against Kaggle's Python `3.13.16` image; v2 initialized both models cleanly (`~188s`) but crashed at `JOBS = ...` with `NameError: name 'true' is not defined`.
- **Root Cause:** Editable install needed `--no-deps --ignore-requires-python` to keep Kaggle's CUDA `torch 2.11.0+cu130` intact, and `_build_acestep_worker_script` interpolated raw `json.dumps(jobs)` (`true`) into Python source where `compile()` treats `true` as an identifier rather than a syntax error.
- **What Was Tried:** Audited v1/v2 kernel logs (`acestep-step9-candidates.log`), verified model initialization at `9.68 GB` VRAM with `offload_to_cpu=True`, and updated `tests/test_step9_music.py` to execute-parse the generated `JOBS` assignment.
- **Resolution / Workaround:** Switched v3 worker assignment to `JOBS = json.loads({repr(jobs_json)})`, added `gc.collect()` / `torch.cuda.empty_cache()` cleanup, and re-ran `danielbasaznew/acestep-step9-candidates` v3 (`ALL MUSIC JOBS COMPLETED: 5` in `471.93s`). *(Note: Kaggle UI stderr still flags `pip`'s non-fatal dependency conflict notice for preinstalled unused `gradio` packages, while exit code is `0`.)*
- **Status:** Resolved

### FAIL-007: Instrumental Constraint Violations & Tone Mismatch Discovered in Music Auditions (`cand_02`, `cand_04`)
- **Date:** 2026-11-26
- **Stage / Component:** music (`assets/music/candidates/`, `assets/music/auditions/`)
- **Tool / Model:** `ACE-Step/Ace-Step1.5`
- **Error / Symptom:** Listening to raw WAVs and ducked audition MP3s revealed two disqualified tracks despite `[Instrumental]` and negative text cues: `cand_02_acoustic_plucked_theme` (`F Major`, `78 BPM`) generated a steady kick drum pulse (`"no drums"` ignored) and an overly upbeat groove that undermined shots 7–9; `cand_04_part_b` (`A Minor`, `74 BPM`) generated unintended wordless female/choir humming (`"oohs/aahs"`) between `~50s` and `~78s` that clashed with the Amharic narration midrange.
- **Root Cause:** Text-conditioned diffusion occasionally hallucinates rhythmic kick patterns on acoustic plucked grooves (`cand_02`) or wordless choir pads in soft minor-key transitions (`cand_04_part_b`), and only direct human/agent audio listening catches vocal-like artifacts reliably.
- **What Was Tried:** Audited all 4 raw WAVs and all 4 ducked `audition_*.mp3` mixes end-to-end beneath `radio_cut_v1.wav`.
- **Resolution / Workaround:** Rejected `cand_02` and `cand_04` with documented reasons in `storyboard.json` and selected `cand_03_chamber_piano_pad` (`66 BPM`, `A Minor`), which remained 100% piano-and-strings pure without vocals or drums (`EXP-009`).
- **Status:** Resolved

### FAIL-008: First-Frame `-70.0 LUFS` Match in `ebur128` Loudness Measurement (`pipeline/music.py`)
- **Date:** 2026-11-26
- **Stage / Component:** music (`pipeline/music.py`)
- **Tool / Model:** FFmpeg `9.0.2` (`volumedetect,ebur128`)
- **Error / Symptom:** Initial `audition` output reported `integrated_lufs: -70.0` and `loudness_range_lu: 0.0` despite `mean_volume_db` around `-23.1 dB`.
- **Root Cause:** `re.search(r"\bI:\s*([-\d.]+)\s*LUFS", stderr)` matched FFmpeg's very first per-frame line (`t: 0.099 ... I: -70.0 LUFS`) rather than the trailing `Summary:` block.
- **What Was Tried:** Inspected `_analyze_wav_metrics()` in `pipeline/music.py` immediately after reviewing `audition` JSON metrics.
- **Resolution / Workaround:** Updated `_analyze_wav_metrics()` to use `re.findall(...)[-1]` and re-ran `audition` + `select` (`selected_score.wav` measured true `-14.5 LUFS`, `LRA 6.0 LU`).
- **Status:** Resolved

### FAIL-009: Static `zoompan` Frame Variable (`in` vs `on`) & Subtitle Orphan Words in Initial Test Render
- **Date:** 2026-11-26
- **Stage / Component:** assembly (`pipeline/assembly.py`)
- **Tool / Model:** `ffmpeg 9.1-full_build` (`zoompan`) & ASS subtitle wrapper
- **Error / Symptom:** Inspecting the `shot-04` benchmark MP4 (`v.mp4`, `h.mp4`) showed zero motion on the tail hold (`00:04–00:07`), while the generated `v.ass` split lines with single dangling words (`"there."`, `"and"`, `"I"`, `"had"`).
- **Root Cause:** FFmpeg `zoompan` iterates output frame counter `on` cleanly under `d=1` whereas `in` did not advance the expression threshold `lt(in,99)`, and naive `len(words)//2` chunk splitting ignored comma clauses and 2-line width balancing.
- **What Was Tried:** Viewed extracted benchmark video frames and `v.ass` text directly before running full assembly.
- **Resolution / Workaround:** Switched `zoom_expr` to `on` (`1 -> 1.07` tail motion) and rewrote wrapping in `pipeline/assembly.py` (`_balance_two_lines` + comma/clause splitters), verified clean across all 34 ASS cues.
- **Status:** Resolved

### FAIL-010: End-Card Provenance Line Wrap & Radial Banding Found During Full Export Inspection
- **Date:** 2026-11-26
- **Stage / Component:** assembly (`pipeline/assembly.py`, `render_end_card_png`)
- **Tool / Model:** Python `Pillow` + `ffmpeg 9.1-full_build`
- **Error / Symptom:** Watching the complete initial `9:16` and `16:9` MP4 exports (`232.68s` + `201.99s`) revealed broken hyphenation (`ACE- / Step 1.5`) in the vertical end card, a leading pipe (`| Music: ACE-Step 1.5`) in the horizontal end card, and faint oval color rings in the 18-step background gradient.
- **Root Cause:** `textwrap.wrap` wrapped the monolithic attribution string blindly by character width without awareness of `|` separators or hyphenated model names, and 18 `draw.ellipse` steps quantized RGB brightness slightly too coarsely across 1080p.
- **What Was Tried:** Audited both `end_card_*.png` images and `01:20–01:22` playback frames in both MP4s.
- **Resolution / Workaround:** Replaced generic wrapping on the attribution strip with explicit balanced lines per orientation, increased radial glow resolution to `48` smooth steps, added Step 10 tests, and rebuilt both MP4s (`python -m pipeline.assembly --force`, `205.56s` + `254.32s`). Re-inspection confirmed crisp typography and smooth gradients in both exports.
- **Status:** Resolved
