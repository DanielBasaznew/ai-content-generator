# Experiments Log

This file records controlled experiments across script, keyframe, video, narration, music, and assembly stages.

## Guidelines
- Record every meaningful experiment as **hypothesis -> change -> result**.
- Change one variable at a time when possible and keep seeds fixed for fair comparisons.
- Do not fabricate entries. Log only real tests actually executed in this project.

---

## Summary Index

| Exp ID | Date | Stage | Objective | Model | Result Summary |
| --- | --- | --- | --- | --- | --- |
| `EXP-001` | 2026-11-25 | narration | Pilot Gemini TTS Amharic clarity & WAV format on `shot-01` | `gemini-3.8-flash-tts` (`Charon`) | Pass (`5.240s`, 24 kHz mono; verified clear Amharic) |
| `EXP-002` | 2026-11-25 | narration | Rate-limit pacing (`21s`) + `retryDelay` + SHA-256 caching | `gemini-3.8-flash-tts` (`Charon`) | Pass (`generated: 2, cached: 8`; clean rerun `0/10`) |
| `EXP-003` | 2026-11-25 | narration / radio_cut | Adjust shot slots to measured TTS audio lengths (`75s -> 80s`) | `gemini-3.8-flash-tts` + `ffmpeg 9.0.2` | Pass (`0` slot overflows; continuous `80.000s` radio cut) |
| `EXP-004` | 2026-11-25 | references | Generate Step 6 Option A character & environment sheets via FLUX | `@cf/black-forest-labs/flux-2-klein-4b` | Pass (`4/4` PNGs; `0/4` cached rerun; continuity verified) |
| `EXP-005` | 2026-11-25 | keyframes | Cropped-panel FLUX.2 klein reference conditioning across all 10 shots | `@cf/black-forest-labs/flux-2-klein-4b` | Pass (`10/10` clean keyframes; `11` calls / `139.330s`; `0/10` cached rerun) |
| `EXP-006` | 2026-11-26 | video | Isolate UMT5 prompt encoding & `fp16` `Wan2.2-TI2V-5B` on Kaggle T4 (`shot-01`) | `Wan-AI/Wan2.2-TI2V-5B-Diffusers` | Pass (`428.53s` inf, `12.91 GB` peak VRAM, smooth motion `delta=25.81`) |
| `EXP-007` | 2026-11-26 | video | Batch all 10 shots + visual audit & targeted regen of `shot-03/04/09/10` | `Wan-AI/Wan2.2-TI2V-5B-Diffusers` | Pass (`10/10` clean clips; `4` rejected & fixed; `0/10` cached rerun) |
| `EXP-008` | 2026-11-26 | music | Compare 3 single `84s` cues vs 2-movement `44s+44s` crossfaded arc on Kaggle T4 | `ACE-Step/Ace-Step1.5` | Pass (`5` WAVs generated in `240.24s` inf / `7.87m` T4; `0/5` cached rerun) |
| `EXP-009` | 2026-11-26 | music | Sidechain-ducked audition beneath Amharic radio cut & `83.0s` score selection | `ACE-Step 1.5` + `ffmpeg 9.0.2` | Pass (Selected `cand_03_chamber_piano_pad`; `83.0s`, `-14.5 LUFS`) |

---

## Experiment Entry Template

Copy this template for each new experiment:

```markdown
### EXP-XXX: <Short Descriptive Title>
- **Date:** YYYY-MM-DD
- **Stage:** <script | narration | keyframe | video | music | assembly>
- **Objective / Hypothesis:** <What you want to test and what outcome you expect>
- **Model:** <Exact model name and provider>
- **Parameters:** <Resolution, steps, CFG/guidance, voice/style, duration, etc.>
- **Seed:** <Numeric seed or "N/A">
- **Result:** <Pass / Partial / Fail + output file path or run ID>
- **Observations:** <What worked, what broke, latency/quality notes, and next action>
```

---

## Logged Experiments

### EXP-001: Pilot Amharic Gemini TTS Synthesis and Audio Verification (`shot-01`)
- **Date:** 2026-11-25
- **Stage:** narration
- **Objective / Hypothesis:** Test whether `gemini-3.8-flash-tts` with prebuilt voice `Charon` and `language_code="am"` (and zero English style prefix in the prompt text) speaks pure Amharic naturally without reading instructions aloud or clipping.
- **Model:** `gemini-3.8-flash-tts` (Google AI Studio / Gemini API)
- **Parameters:** `voice_name="Charon"`, `language_code="am"`, `response_modalities=["AUDIO"]`, no English prompt prefix; output PCM converted to 24 kHz 16-bit mono WAV.
- **Seed:** N/A (TTS)
- **Result:** Pass — `assets/narration/shot-01.wav` (`5.240s`, latency `4.486s`, `166` tokens, peak `28087/32767`, RMS `4735.5`). Multimodal QA check via `gemini-2.5-flash` transcribed the Amharic accurately and confirmed a calm, reflective, moderate-speed tone with zero mispronounced words.
- **Observations:** Measured speech length (`5.240s`) matched our initial `5.2s` estimate almost identically; omitting an English style prefix avoided instruction leakage while `Charon` naturally delivered calm documentary pacing.

### EXP-002: Free-Tier Rate-Limit Pacing (3 RPM) and Input-Hash Caching
- **Date:** 2026-11-25
- **Stage:** narration
- **Objective / Hypothesis:** After hitting a `429 RESOURCE_EXHAUSTED` quota error at 3 RPM during batch generation (`FAIL-001`), hypothesis is that parsing `retryDelay` + enforcing a `21.0s` minimum interval between uncached calls and SHA-256 input-hash caching (`assets/narration/narration_cache.json`) will complete remaining shots without losing progress or re-calling finished clips.
- **Model:** `gemini-3.8-flash-tts` (`Charon`)
- **Parameters:** `min_interval_seconds=21.0`, `max_attempts=5`, `retryDelay + 2s` backoff, SHA-256 over `(shot_id, model, voice_name, language_code, prompt_text)`.
- **Seed:** N/A
- **Result:** Pass — Resumption run generated `shot-09` (`8.810s`) and `shot-10` (`7.230s`) while reusing `shot-01`..`shot-08` from cache (`generated: 2, cached: 8`); subsequent verification re-run completed with `generated: 0, cached: 10`.
- **Observations:** Respecting the 3 RPM limit upfront avoids quota thrashing, and caching guarantees single-shot edits in future steps only regenerate the modified line.

### EXP-003: Voice-Timed Storyboard Adjustment for Radio Cut Assembly
- **Date:** 2026-11-25
- **Stage:** narration / assembly (radio cut)
- **Objective / Hypothesis:** Measure all 10 synthesized Amharic WAVs against the initial `75.0s` word-count estimates and adjust slot durations if any clip overflows, expecting natural breathing pauses (`>= 0.45s` after speech) inside the `60–90s` window.
- **Model:** `gemini-3.8-flash-tts` + FFmpeg `9.0.2-essentials_build` (`imageio-ffmpeg`)
- **Parameters:** `loudnorm=I=-14:TP=-1:LRA=11`, `24000 Hz` mono WAV + `192k` MP3, silence-only inter-shot gaps (no music).
- **Seed:** N/A
- **Result:** Pass — Initial check flagged 3 overflows (`shot-03`: `8.03s` vs `8.0s`; `shot-09`: `9.31s` vs `7.5s`; `shot-10`: `7.83s` vs `7.5s`). Adjusting slot durations to `80.0s` total (`7.0, 8.0, 8.5, 7.5, 6.5, 7.5, 7.5, 9.0, 10.0, 8.5`) resolved all overflows and produced `outputs/radio_cut/radio_cut_v1.wav` (`80.000s`) and `radio_cut_v1.mp3`.
- **Observations:** `gemini-2.5-flash` full-cut audio transcription verified clear Amharic across all 10 shots (`00:00`–`01:15`) including `ሐረር`, `የራስ መኮንን ሐውልት`, `አዳማ`, and `አዲስ አበባ`; note the model heard `ብመለስም` in Shot 9 slightly close to `በምመለስም` (`01:02`), which human listeners should double-check during Audience Test 1.

### EXP-004: Step 6 Character & Environment Reference Sheets via Cloudflare FLUX (`flux-2-klein-4b`)
- **Date:** 2026-11-25
- **Stage:** references
- **Objective / Hypothesis:** Generate consistent 3-view Option A character turnaround sheets (`1344x768`) and center-balanced Harar environment sheets (`1024x1024`) using `@cf/black-forest-labs/flux-2-klein-4b` (`multipart/form-data`, fixed 4 steps, deterministic seeds `1001–1004`), expecting visual continuity between child and young adult and clean dual-aspect framing without garbled text or archival photo borders.
- **Model:** `@cf/black-forest-labs/flux-2-klein-4b` (Apache 2.0 via Cloudflare Workers AI)
- **Parameters:** `multipart/form-data`, `steps=4` (model-fixed), `1344x768` (`ref_narrator_child` seed `1001`, `ref_narrator_adult` seed `1002`), `1024x1024` (`ref_harar_roundabout_memory` seed `1003`, `ref_harar_streets` seed `1004`).
- **Seed:** `1001`, `1002`, `1003`, `1004`
- **Result:** Pass — All 4 PNGs generated (`13.572s`, `24.148s`, `13.833s`, `13.378s`; total `64.931s`), validated with Pillow, and verified via SHA-256 cache (`generated: 0, cached: 4` on rerun).
- **Observations:** Visual inspection confirmed: (1) `ref_narrator_child.png` cleanly renders front, 3/4, and back views of an ~8-year-old Ethiopian child in cream collared shirt + ochre-mustard vest; (2) `ref_narrator_adult.png` maintains skin, cropped curly hair, and facial continuity into an ~22-year-old in slate-navy overshirt over off-white shirt; (3) `ref_harar_roundabout_memory.png` keeps a generalized non-specific pedestal silhouette centered inside the `9:16` crop band without invented plaques or archival borders; and (4) `ref_harar_streets.png` maintains warm Harar textures with zero garbled signage.

### EXP-005: Step 7 Multi-Reference Keyframes via Cropped Single-Panel Conditioning
- **Date:** 2026-11-25
- **Stage:** keyframes
- **Objective / Hypothesis:** Generate 10 cohesive `1024x1024` keyframes (`assets/keyframes/shot-01.png`–`shot-10.png`) conditioned on Step 6 reference sheets via `@cf/black-forest-labs/flux-2-klein-4b`, cropping the `1344x768` 3-view character turnaround sheets into single `<=512px` target panels (`back` for Shots `3, 5, 7, 8`; `three_quarter` for Shots `4, 6, 9`) so the diffusion model renders single coherent film frames rather than multi-panel collages while preserving Option A identity and dual `9:16` / `16:9` framing.
- **Model:** `@cf/black-forest-labs/flux-2-klein-4b` (Apache 2.0 via Cloudflare Workers AI)
- **Parameters:** `multipart/form-data`, `steps=4`, `width=1024`, `height=1024`, `input_image_0..3` downscaled `<=512px`, deterministic seeds `2001–2010` (`shot-03` regenerated with seed `2013`).
- **Seed:** `2001`, `2002`, `2013` (replaced `2003`), `2004`, `2005`, `2006`, `2007`, `2008`, `2009`, `2010`
- **Result:** Pass — All 10 `1024x1024` keyframes generated (`11` total Cloudflare API calls including `shot-03` seed `2003` pilot replacement; `139.330s` total API latency; `$0.00` spend) and verified via SHA-256 cache (`generated: 0, cached: 10` on rerun).
- **Observations:**
  - Cropping `ref_narrator_child.png` and `ref_narrator_adult.png` to single panels eliminated turnaround-collage layouts completely and preserved exact outfit, hair, and skin continuity from childhood (`shot-03`, `shot-04`) to young adulthood (`shot-05`–`shot-09`).
  - Visual audit of all 10 frames caught one limb-duplication artifact on `shot-03` pilot seed `2003` (`FAIL-002`, resolved via seed `2013` + simplified prompt) and showed that `shot-08` placed the adult silhouette slightly left of center (`crop_anchor` updated to `"left"` in `storyboard.json` for `9:16` framing).
  - `shot-10` (`input_image_0 = ref_harar_streets.png`) anchored strongly to the opening Harar residential lane in warm sunset amber, forming a calm visual bookend with `shot-01` rather than an elevated rooftop panorama; hands (`shot-04`), study setting (`shot-06`), empty plaza (`shot-08`), and heritage reflections (`shot-02`, `shot-09`) rendered cleanly without political symbols or archival photo frames.

### EXP-006: Fitting `Wan2.2-TI2V-5B-Diffusers` on Kaggle Tesla T4 (`14.56 GiB`) via UMT5 Pre-Encoding
- **Date:** 2026-11-26
- **Stage:** video
- **Objective / Hypothesis:** Avoid the `14.54 GiB` CUDA OOM caused by UMT5-XXL (`~11.4 GB`) overlapping with `AutoencoderKLWan` (`float32`) under standard `enable_model_cpu_offload()` by pre-encoding prompts on GPU into CPU tensors first, freeing `UMT5EncoderModel`, attaching a minimal `nn.Parameter` dtype stub (`_DummyTextEncoder`), and running `WanTransformer3DModel` (`float16`, `512x512` `1:1`, `73` frames @ `24 fps`, `25` steps) with VAE tiling/slicing.
- **Model:** `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (Apache 2.0) on Kaggle `Tesla T4` (`cuda:0`)
- **Parameters:** `512x512` (`1:1` preserving Step 7 `1024x1024` master framing for both `9:16` and `16:9`), `fps=24`, `num_frames=73`, `steps=25`, `guidance_scale=5.0`, `seed=3001`, `dtype=torch.float16`, `vae_dtype=torch.float32`, `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`.
- **Seed:** `3001`
- **Result:** Pass — `wan22-pilot-shot01` v5 completed in `777.67s` (`85.13s` prompt encode, `259.96s` load, `428.53s` inference), peaking cleanly at **`12.91 GB / 14.56 GiB`** VRAM with zero NaNs (`mean=0.4913`, `std=0.2475`, `start->end` pixel delta `25.812`).
- **Observations:** Running `float16` transformer + `float32` tiled `AutoencoderKLWan` produced clean, non-flickering Harar lane dolly motion without black frames or warped brickwork while leaving `1.65 GiB` VRAM safety headroom on T4.

### EXP-007: Batched Wan 2.2 Generation & Targeted Regeneration of `shot-03, 04, 09, 10`
- **Date:** 2026-11-26
- **Stage:** video
- **Objective / Hypothesis:** Generate remaining Shots `02–10` across two batched Kaggle sessions (`wan22-step8-batch-a` for `02–06`, `wan22-step8-batch-b` for `07–10`), visually audit every clip, and use SHA-256 selective regeneration (`wan22-step8-regen-1`) on any rejected shot with tightened glare/anatomy prompts and updated seeds (`3013, 3014, 3019, 3020`).
- **Model:** `Wan-AI/Wan2.2-TI2V-5B-Diffusers` (Apache 2.0 via Kaggle `2x Tesla T4`)
- **Parameters:** `512x512` (`480p` tier), `24 fps`, `73` frames (`3.04s`), `25` steps, `guidance_scale=5.0`, motion-and-camera-only prompts (`pipeline/video.py`).
- **Seed:** `3001`, `3002`, `3013` (replaced `3003`), `3014` (replaced `3004`), `3005`, `3006`, `3007`, `3008`, `3019` (replaced `3009`), `3020` (replaced `3010`)
- **Result:** Pass — Batch A (`44.91m`) and Batch B (`36.57m`) produced 5 clean shots immediately (`02, 05, 06, 07, 08`); visual audit flagged `03, 04, 09, 10` (`FAIL-005`). Updating only those 4 prompts/seeds caused `push_video_batch` to skip all 6 clean cached shots (`cached: 6, pushed: 4`), and `wan22-step8-regen-1` (`36.05m`) resolved all 4 defects cleanly (`10/10` cached on rerun).
- **Observations:** Avoiding terms like `"golden bokeh shimmering"` and `"sunset deepening"` eliminated lens-flare washout (`shot-04`), pink halo spots (`shot-09`), and red-orange sky blobs (`shot-03`, `shot-10`). Batching UMT5 prompt pre-encoding saved ~6 minutes of duplicate model setup across Shots `02–10`.

### EXP-008: Original Instrumental Score Candidate Generation via ACE-Step 1.5 (Kaggle `T4`)
- **Date:** 2026-11-26
- **Stage:** music
- **Objective / Hypothesis:** Test whether `ACE-Step/Ace-Step1.5` (`acestep-v15-turbo` DiT + `acestep-5Hz-lm-1.7B` thinking LM with `offload_to_cpu=True`) can generate clean, purely instrumental documentary underscores (`84.0s` continuous tracks `cand_01`–`03` vs two-movement `44s+44s` crossfaded `C Major -> A Minor` arc `cand_04`) on Kaggle T4 without vocals or exceeding VRAM.
- **Model:** `ACE-Step/Ace-Step1.5` (`acestep-v15-turbo` `fp16` + `acestep-5Hz-lm-1.7B`, MIT license)
- **Parameters:** `inference_steps=8`, `shift=3.0`, `thinking=True`, `lyrics="[Instrumental]"`, `instrumental=True`, `enable_normalization=True`, `normalization_db=-1.0`, `48000 Hz` stereo WAV; seeds `4001` (`cand_01`, `72 BPM` D Minor), `4002` (`cand_02`, `78 BPM` F Major), `4003` (`cand_03`, `66 BPM` A Minor), `4004+4005` (`cand_04_part_a` C Major + `cand_04_part_b` A Minor joined via `4.0s` `acrossfade`).
- **Seed:** `4001`, `4002`, `4003`, `4004`, `4005`
- **Result:** Pass — `danielbasaznew/acestep-step9-candidates` v3 completed all `5` generation jobs cleanly (`471.93s` / `7.87` min total session; `42.6s` checkpoint download; `67.73s` init; `240.24s` pure generation latency; peak VRAM `9.68 GB / 14.6 GB`). Local FFmpeg joined `cand_04_part_a` + `cand_04_part_b` into `cand_04_two_part_arc.wav` (`84.000s`).
- **Observations:**
  - `acestep-5Hz-lm-1.7B` with `offload_to_cpu=True` fit comfortably under 10 GB VRAM on T4 even for `84s` sequences (`~2.6s` DiT diffusion + `~47s` 5Hz audio-code generation per 84s cue).
  - Prompt diversity confirmed that `cand_01` (`-17.5 LUFS`, `LRA 21.2 LU`) and `cand_03` (`-21.1 LUFS`, `LRA 9.2 LU`) remained strictly instrumental, whereas `cand_02` (`-18.5 LUFS`) injected an unwanted kick drum pulse and `cand_04_part_b` (`-20.3 LUFS`) generated wordless humming vocals (`FAIL-007`).

### EXP-009: Sidechain-Ducked Audition Beneath Amharic Narration & 83.0s Score Preparation
- **Date:** 2026-11-26
- **Stage:** music
- **Objective / Hypothesis:** Audition every candidate mixed beneath the `80.000s` Amharic radio cut (`outputs/radio_cut/radio_cut_v1.wav`) using FFmpeg sidechain ducking (`threshold=0.02, ratio=6, attack=300ms, release=1500ms`) across the full `83.000s` runtime (`80.0s` story + `3.0s` disclosure end card), expecting sparse felt piano/strings with quiet midrange (`~66–72 BPM`) to preserve the clearest Amharic speech intelligibility and seamless emotional transitions.
- **Model:** `ACE-Step/Ace-Step1.5` outputs + FFmpeg `9.0.2`
- **Parameters:** `atrim=0:83.000`, `afade=t=in:st=0:d=0.8`, `afade=t=out:st=80.0:d=3.0`, `loudnorm=I=-16:TP=-1:LRA=11` for prepared `assets/music/selected_score.wav` (`48000 Hz`, stereo 16-bit PCM).
- **Seed:** `4003` (selected winner `cand_03_chamber_piano_pad`)
- **Result:** Pass — Selected `cand_03_chamber_piano_pad` (`assets/music/selected_score.wav`: `83.000s`, `-14.5 LUFS`, `mean -17.2 dB`, `max -1.0 dB`, `LRA 6.0 LU`) and recorded full metadata in `storyboard.json["music_plan"]`.
- **Observations:**
  - `cand_03_chamber_piano_pad` provided the cleanest vocal headroom (`-24.1 dB` raw mean volume, steady `9.2 LU` loudness range), zero drums or vocals, and a natural instrumental lift around `45s` where airy sustained strings enter right as the story pivots to leaving Harar and discovering the missing monument.
  - `cand_01_felt_piano_strings` was a strong runner-up in warmth, but exhibited a wide `21.2 LU` loudness range with a noticeable piano drop around `27–32s` and thicker low-mid pad density beneath the baritone voice; `cand_02` and `cand_04` were disqualified by unwanted drums and background humming (`FAIL-007`).
