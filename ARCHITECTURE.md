# Planned System Architecture

> **Status:** Step 5 narration/radio cut, Step 6 reference PNGs (`pipeline/references.py`, `assets/references/*.png`), Step 7 shot keyframes (`pipeline/keyframes.py`, `pipeline/cloudflare_flux.py`, `assets/keyframes/shot-01.png`–`shot-10.png`), and Step 8 moving video clips (`pipeline/video.py`, `assets/clips/shot-01.mp4`–`shot-10.mp4`) are complete and verified. Remaining music (Step 9) and FFmpeg assembly stages are not yet implemented.

---

## 1. Overview

The production system will be structured as a modular, reproducible pipeline that turns a structured storyboard document (`storyboard.json`) into finished `9:16` (vertical) and `16:9` (horizontal) short film exports for **The Monument That Lives in My Memory**.

Instead of assembling assets manually, each production step will be isolated into a dedicated stage under `pipeline/`. Stages will communicate through files on disk and share one central source of truth.

---

## 2. Central Contract (`storyboard.json` & `schema/storyboard.schema.json`)

A single `storyboard.json` file serves as the shared production contract connecting all pipeline stages:

- **Schema Validation (`schema/storyboard.schema.json`):** Before any stage executes, `storyboard.json` will be validated against the strict JSON Schema Draft 2020-12 contract in `schema/storyboard.schema.json`, catching missing fields, invalid types, or broken provenance flags before spending API quotas or GPU time. Companion Python validation will enforce cross-item rules that JSON Schema cannot express directly (such as unique `shot_id` values, contiguous `order` 1–10, and verifying that summed shot durations fall between 60 and 90 seconds).
- **Single Source for Both Aspect Ratios:** Both `9:16` (vertical) and `16:9` (horizontal) exports will consume the exact same `storyboard.json` data—sharing story beats, durations, narration, music cues, and core visual prompts while reading optional format-specific composition guidance (`editing.composition.vertical_9_16` and `horizontal_16_9`) during assembly.
- **Stage Coupling:** Every downstream pipeline stage under `pipeline/` (narration, keyframes, video shots, music, and assembly) will consume its inputs from `storyboard.json` rather than hardcoding prompts, timings, or asset paths inside scripts.
- **Selective Regeneration:** Isolating inputs per shot allows modifying a single shot prompt or narration line and regenerating only the affected outputs without rebuilding the entire film.

---

## 3. Planned Pipeline Stages & Tool Roles

| Stage | Planned Tool / Model | Intended Role | Input / Output Flow |
| --- | --- | --- | --- |
| **1. Storyboard & Script** | **Google AI Studio / Gemini API** | Assist with narrative refinement, shot breakdown, translation, and script timing aligned with `DESIGN.md`. | Story intention -> structured storyboard data (`storyboard.json`). |
| **2. Narration** | **Gemini API (Gemini TTS)** | Synthesize calm, natural first-person voice-over tracks in the chosen language and measure actual spoken durations. | Storyboard narration text -> audio files in `assets/narration/` and subtitle timing data. |
| **3. Keyframes** | **Cloudflare Workers AI (FLUX)** | Generate character/style reference sheets first, followed by consistent still keyframes for each shot. | Reference assets + shot prompts -> still images in `assets/references/` and `assets/keyframes/`. |
| **4. Video Shots** | **Kaggle (Wan 2.2)** | Animate still keyframes into short moving video clips (image-to-video) using free GPU sessions. | Keyframes + motion cues -> video clips (with deterministic pan/zoom fallback in assembly if needed). |
| **5. Original Music** | **Kaggle (ACE-Step)** | Generate original instrumental score candidates matching the emotional arc (happiness -> nostalgia -> sadness -> reflection). | Music mood/cue descriptions -> candidate & selected audio tracks in `assets/music/`. |
| **6. Assembly & Export** | **FFmpeg** | Deterministically trim/join clips, apply Ken Burns motion where needed, duck music under narration (sidechain compression), normalize loudness, burn in English subtitles, append an AI disclosure end card, and render final aspect ratios. | All media assets + storyboard timings -> final MP4 files in `outputs/vertical/` (`9:16`) and `outputs/horizontal/` (`16:9`). |

*(Note: Antigravity is used as the coding assistant to build, test, and maintain the pipeline codebase.)*

---

## 4. Planned Reproducibility, Caching & Logging

To satisfy software engineering and reproducibility goals when the pipeline is built:

1. **Input-Hash Caching:** Each generated artifact will be tracked against a hash of its relevant inputs (prompt, model, seed, parameters, and reference image). Unchanged shots will be skipped on re-runs.
2. **Retries & Fallbacks:** Transient network, rate-limit, or GPU session errors will be handled with bounded retries and recorded fallback paths (e.g., deterministic still motion via FFmpeg if a video shot cannot be generated).
3. **Structured Call Logging (`runs.jsonl`):** Every external model or GPU inference call will append one JSON line to `runs.jsonl` capturing timestamp, stage, model, parameters, seed, latency, status, and output path.
4. **Secret Hygiene:** API keys and tokens will be loaded exclusively from local environment variables (or untracked local config) and never written into `storyboard.json`, logs, or repository files.

---

## 5. Future Implementation Roadmap

The following will be implemented sequentially in later assignment steps:
- Complete Amharic narration review, TTS generation, radio cut, and Audience Test 1 (Step 5 completion).
- Build stage modules under `pipeline/`, companion cross-field storyboard validation, and automated tests under `tests/`.
- Add a single documented top-level command to run the end-to-end pipeline cleanly.
