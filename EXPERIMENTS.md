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
