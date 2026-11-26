# The Monument That Lives in My Memory

An AI-generated heritage short film and reproducible multi-model production pipeline set in **Harar, Ethiopia**.

> **Project Status:** Steps 1–14 are complete — `80.0s` Amharic radio cut (`outputs/radio_cut/radio_cut_v1.mp3`), Audience Test 1 summary (`DESIGN.md` / `docs/AUDIENCE_TEST_1.md`), 4 Option A FLUX reference PNGs (`assets/references/`), 10 shot keyframes (`assets/keyframes/`), 10 inspected Wan 2.2 moving video clips (`assets/clips/`), the selected `83.000s` instrumental ACE-Step 1.5 score (`assets/music/selected_score.wav`), both final assembled `83.000s` MP4 exports (`outputs/vertical/harar_monument_vertical_9x16.mp4` and `outputs/horizontal/harar_monument_horizontal_16x9.mp4`, `-14.0 LUFS`), Audience Test 2 (`DESIGN.md` / `docs/AUDIENCE_TEST_2.md`), and the comprehensive written report ([`REPORT.md`](REPORT.md)) are complete and verified on disk. Ready for **Step 15** (publishing, video walkthrough, and submission).

---

## Story Summary

I was born and raised in Harar, Ethiopia. About 2.5 km from my childhood home stood the Ras Makonnen Monument at a large roundabout.

As a child, passing the monument often meant my parents were taking me somewhere special, buying me new clothes, or taking us on a memorable family outing. Seeing it became closely tied to happiness and excitement.

Later, I left Harar for university and spent approximately five years in Adama and Addis Ababa. When I returned to Harar, I discovered that the monument had been demolished. Seeing it gone brought a deep sense of sadness and disappointment—even though I was back in my hometown, Harar felt different from the place I remembered.

**Central Message:** Heritage is not only about physical monuments; it is also about the memories and emotions people attach to places.

### Creative Boundaries

- Personal, emotional, first-person storytelling focused on childhood memories, nostalgia, belonging, and cultural heritage.
- Strictly non-political: no political criticism, blame, or unsupported historical claims.
- AI-generated visual reconstructions must never be presented as authentic historical photographs.

---

## Assignment Goals

The completed project will produce:

- A **60–90 second** AI-assisted short film.
- Both **vertical (`9:16`)** and **horizontal (`16:9`)** video exports.
- First-person **narration** in a selected language with **English subtitles**.
- An **original musical score** with **music ducking** under narration.
- A visible **AI disclosure end card**.
- A reproducible, storyboard-driven code pipeline.
- A maximum **5-minute project walkthrough**.

---

## Planned Technology Stack

| Role | Planned Tool / Service | Notes |
| --- | --- | --- |
| Script, storyboard & narration | Google AI Studio / Gemini API | Text generation and Gemini TTS |
| Keyframe image generation | Cloudflare Workers AI (FLUX) | Reference sheets and shot keyframes |
| Video & music generation | Kaggle (Wan 2.2 & ACE-Step) | Image-to-video shots and original score |
| Development assistant | Antigravity | Coding assistant and workflow development |
| Media assembly & export | FFmpeg | Cutting, ducking, normalization, subtitles, end card, 9:16 & 16:9 exports |

> **Setup & Verification Notice:** Python dependencies (`google-genai`, `jsonschema`, `python-dotenv`, `pytest`, `kaggle`, and `imageio-ffmpeg` bundling FFmpeg `9.0.2`) are installed, while API credentials for Google AI Studio (Gemini), Cloudflare Workers AI, and Kaggle still need to be configured in a local untracked `.env` file (see `.env.example` and `docs/CREDENTIALS_AND_SETUP.md`). Never commit `.env`, `kaggle.json`, or API tokens to version control.

---

## Project Directory Overview

```text
day-2-ai-content-generation/
├── .env.example                # Safe placeholder template for local API keys (copy to .env)
├── .gitignore                  # Excludes .env, credentials, and Python cache artifacts
├── AI-Content Generation.pdf   # Original assignment reference document
├── README.md                   # Project overview, status, and future run instructions
├── DESIGN.md                   # Audience definition, film intention, creative boundaries, and test log
├── ARCHITECTURE.md             # High-level planned pipeline architecture and tool roles
├── EXPERIMENTS.md              # Template for logging generation experiments
├── FAILURES.md                 # Template for logging errors, failed outputs, and fixes
├── COSTS.md                    # Template for tracking model usage, latency, GPU time, and costs
├── ETHICS.md                   # Ethical guidelines, AI disclosure policy, licensing, and consent log
├── runs.jsonl                  # Append-only log of model API calls (46 logged calls across Steps 5–9)
├── storyboard.json             # Single-source-of-truth 10-shot storyboard contract (80.0s voice-timed; Amharic + EN)
├── docs/
│   ├── AUDIENCE_TEST_1.md          # Participant feedback log & synthesis for Audience Test 1
│   ├── CHARACTER_REFERENCE_SHEET.md # Option A fictional character design & continuity guide (Step 6)
│   ├── CREDENTIALS_AND_SETUP.md    # Guide to obtaining & storing API keys and setting up local tools
│   ├── NARRATION_REVIEW.md         # Approved Amharic narration & English subtitle script
│   ├── STORYBOARD_STRUCTURE.md     # Detailed guide to the storyboard schema and fields
│   └── VISUAL_STYLE_SHEET.md       # Color palette, lighting, aspect-ratio framing & style sheet (Step 6)
├── schema/
│   └── storyboard.schema.json  # Strict JSON Schema (Draft 2020-12) for validating storyboard.json
├── pipeline/
│   ├── common.py               # Validation, .env loading, SHA-256 caching, runs.jsonl & WAV helpers
│   ├── cloudflare_flux.py      # Shared Cloudflare FLUX API client, <=512px reference prep, PNG check
│   ├── narration.py            # Cached Gemini TTS Amharic narration generator with 3 RPM pacing
│   ├── radio_cut.py            # Audio-only radio cut assembler & English SRT exporter
│   ├── references.py           # Cloudflare FLUX Step 6 reference generator
│   ├── keyframes.py            # Cloudflare FLUX Step 7 keyframe generator with cropped-panel inputs
│   ├── video.py                # Kaggle Wan 2.2 TI2V-5B Step 8 batched video generator with SHA-256 caching
│   ├── music.py                # Kaggle ACE-Step 1.5 Step 9 instrumental score generator, audition & selector
│   └── assembly.py             # FFmpeg Step 10 deterministic dual-aspect (9:16 & 16:9) final assembler
├── assets/
│   ├── references/             # 4 generated Option A FLUX reference PNGs + references_cache.json
│   ├── keyframes/              # 10 generated 1024x1024 FLUX keyframes (shot-01..10.png) + keyframes_cache.json
│   ├── clips/                  # 10 generated 512x512 24fps Wan 2.2 MP4 clips (shot-01..10.mp4) + clips_cache.json
│   ├── narration/              # 10 generated Amharic WAV clips + narration_cache.json
│   └── music/                  # 4 ACE-Step candidate WAVs, ducked audition MP3s & selected_score.wav (83.0s)
├── outputs/
│   ├── horizontal/             # Final 16:9 deliverable (harar_monument_horizontal_16x9.mp4)
│   ├── intermediate/           # Separated assembly intermediates (ASS subtitles, end cards, master_mix_83s.wav, cache)
│   ├── radio_cut/              # Audio-only Step 5 radio cut (radio_cut_v1.mp3, .wav, _en.srt)
│   └── vertical/               # Final 9:16 deliverable (harar_monument_vertical_9x16.mp4)
└── tests/
    ├── test_step5_narration_and_radio_cut.py # Pipeline unit tests & Step 5 audio/radio-cut verification
    ├── test_step6_references.py              # Unit tests for Step 6 reference specs, gate & mocked FLUX
    ├── test_step7_keyframes.py               # Unit tests for Step 7 prompts, <=512px crop prep, mocked FLUX & outputs
    ├── test_step8_video.py                   # Unit tests for Step 8 motion prompts, Kaggle auth/batching & MP4 verification
    ├── test_step9_music.py                   # Unit tests for Step 9 ACE-Step specs, audition mix & 83s score verification
    ├── test_step10_assembly.py               # Unit tests & deliverable probes for Step 10 9:16 & 16:9 exports
    ├── test_storyboard_contract.py           # Validates on-disk storyboard.json schema, timeline, and review sync
    └── test_storyboard_schema.py             # Lightweight schema validation check using an in-memory fixture
```

---

## Storyboard JSON Schema & Current Draft (Steps 4–5)

The project uses a strict **JSON Schema Draft 2020-12** contract located at [schema/storyboard.schema.json](schema/storyboard.schema.json) and documented in [docs/STORYBOARD_STRUCTURE.md](docs/STORYBOARD_STRUCTURE.md).

- **Storyboard contract:** [storyboard.json](storyboard.json) defines the 10-shot, 80.0-second voice-timed narrative arc, Amharic narration (`am`), English subtitles (`en`), visual prompts, and AI provenance records shared by both `9:16` and `16:9` outputs.
- **Validation:** [schema/storyboard.schema.json](schema/storyboard.schema.json) validates structure, types, enums, and disclosure rules, supplemented by Python checks for total duration (`60–90` s), unique `shot_id`s, contiguous `order` (`1–10`), and continuous timeline intervals.
- **Review status:** Both Audience Test 1 (radio cut) and Audience Test 2 (near-final cut with video, score, and subtitles) were reviewed and documented in [DESIGN.md](DESIGN.md), [docs/AUDIENCE_TEST_1.md](docs/AUDIENCE_TEST_1.md), and [docs/AUDIENCE_TEST_2.md](docs/AUDIENCE_TEST_2.md).

---

## Running the Pipeline & Reproducing Deliverables

The entire multi-stage assembly is executable with a single command from the project root:

```bash
# Validate storyboard schema and assemble both final exports (using SHA-256 caching):
python -m pipeline.assembly

# To force re-render all transitions, subtitles, audio ducking, and end cards:
python -m pipeline.assembly --force
```

This single command:
1. Validates `storyboard.json` against `schema/storyboard.schema.json`.
2. Inspects and processes the 10 video clips with motion smoothing and aspect ratio adaptation (9:16 vertical crop, 16:9 ambient motion wings).
3. Assembles the Amharic speech track, performs sidechain compression ducking on `assets/music/selected_score.wav`, and applies two-pass EBU R128 loudness normalization (`-14.0 LUFS`, `-1.0 dBTP`).
4. Generates and burns in aspect-safe English subtitles (`.ass`).
5. Appends the AI disclosure end card (`3.0s`).
6. Outputs the final deliverables to `outputs/vertical/` and `outputs/horizontal/`.

---

## Interactive Web Showcase & Reviewer Portal

A full Next.js interactive web showcase application is included in [`web/`](web/), featuring an interactive cinema theater with dual-aspect toggles, the **"Memory vs. Reality"** heritage slider, an interactive 10-shot storyboard matrix, a visual architecture flowchart, and an assessment evidence map.

```bash
# Launch the interactive showcase locally:
cd web
npm run dev
# Open http://localhost:3000 in your browser
```
*(Pre-configured for 1-click deployment on Vercel via [`vercel.json`](vercel.json)).*
