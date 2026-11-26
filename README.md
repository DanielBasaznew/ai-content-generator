# The Monument That Lives in My Memory

An AI-generated heritage short film and reproducible multi-model production pipeline set in **Harar, Ethiopia**.

> **Project Status:** Steps 5, 6, 7, and 8 are complete — `80.0s` Amharic radio cut (`outputs/radio_cut/radio_cut_v1.mp3`), Audience Test 1 summary (`DESIGN.md` / `docs/AUDIENCE_TEST_1.md`), 4 Option A FLUX reference PNGs (`assets/references/`), 10 shot keyframes (`assets/keyframes/`), and all 10 inspected Wan 2.2 `512x512` 24fps moving video clips (`assets/clips/shot-01.mp4`–`shot-10.mp4`) are in place. Ready for **Step 9** (original music generation); Steps 9–15 have not started.

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
├── runs.jsonl                  # Append-only log of model API calls (41 logged calls across Steps 5–8)
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
│   └── video.py                # Kaggle Wan 2.2 TI2V-5B Step 8 batched video generator with SHA-256 caching
├── assets/
│   ├── references/             # 4 generated Option A FLUX reference PNGs + references_cache.json
│   ├── keyframes/              # 10 generated 1024x1024 FLUX keyframes (shot-01..10.png) + keyframes_cache.json
│   ├── clips/                  # 10 generated 512x512 24fps Wan 2.2 MP4 clips (shot-01..10.mp4) + clips_cache.json
│   ├── narration/              # 10 generated Amharic WAV clips + narration_cache.json
│   └── music/                  # Generated score candidates and chosen track (empty — Step 9)
├── outputs/
│   ├── horizontal/             # Final 16:9 exports and intermediate cuts (empty)
│   ├── radio_cut/              # Audio-only Step 5 radio cut (radio_cut_v1.mp3, .wav, _en.srt)
│   └── vertical/               # Final 9:16 exports and intermediate cuts (empty)
└── tests/
    ├── test_step5_narration_and_radio_cut.py # Pipeline unit tests & Step 5 audio/radio-cut verification
    ├── test_step6_references.py              # Unit tests for Step 6 reference specs, gate & mocked FLUX
    ├── test_step7_keyframes.py               # Unit tests for Step 7 prompts, <=512px crop prep, mocked FLUX & outputs
    ├── test_step8_video.py                   # Unit tests for Step 8 motion prompts, Kaggle auth/batching & MP4 verification
    ├── test_storyboard_contract.py           # Validates on-disk storyboard.json schema, timeline, and review sync
    └── test_storyboard_schema.py             # Lightweight schema validation check using an in-memory fixture
```

---

## Storyboard JSON Schema & Current Draft (Steps 4–5)

The project uses a strict **JSON Schema Draft 2020-12** contract located at [schema/storyboard.schema.json](schema/storyboard.schema.json) and documented in [docs/STORYBOARD_STRUCTURE.md](docs/STORYBOARD_STRUCTURE.md).

- **Storyboard contract:** [storyboard.json](storyboard.json) defines the 10-shot, 80.0-second voice-timed narrative arc, Amharic narration (`am`), English subtitles (`en`), visual prompts, and AI provenance records shared by both `9:16` and `16:9` outputs.
- **Validation:** [schema/storyboard.schema.json](schema/storyboard.schema.json) validates structure, types, enums, and disclosure rules, supplemented by Python checks for total duration (`60–90` s), unique `shot_id`s, contiguous `order` (`1–10`), and continuous timeline intervals.
- **Review status:** The Amharic script in [docs/NARRATION_REVIEW.md](docs/NARRATION_REVIEW.md) is awaiting user review and approval before generating TTS audio or assembling the first radio cut for [docs/AUDIENCE_TEST_1.md](docs/AUDIENCE_TEST_1.md).

---

## Planned Production Stages & How the Project Will Run

Once implemented in upcoming steps, the pipeline will connect the following stages through a validated `storyboard.json` contract:

1. **Storyboard design** — Define shots, durations, prompts, narration, and music cues.
2. **Keyframe generation** — Generate consistent reference sheets and shot keyframes.
3. **Video generation** — Animate keyframes into moving shots (with a deterministic pan/zoom fallback if needed).
4. **Original music generation** — Generate and select an original instrumental score.
5. **Narration generation** — Synthesize spoken narration lines and timing.
6. **FFmpeg assembly** — Sync video, narration, ducked music, loudness normalization, subtitles, and end card.
7. **Export and quality checks** — Export both `9:16` and `16:9` versions and validate reproducibility.

**Target execution workflow (not yet implemented):**
After environment setup, credential configuration, and pipeline implementation in later steps, a single reproducible entry-point command will validate the storyboard schema, run only uncached or modified stages, log every model call to `runs.jsonl`, and output both final aspect ratios into `outputs/`.
