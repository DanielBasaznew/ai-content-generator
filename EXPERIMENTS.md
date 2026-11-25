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
