# Storyboard Structure Guide

This document explains the design of the `storyboard.json` data contract and its strict JSON Schema (`schema/storyboard.schema.json`) for **The Monument That Lives in My Memory**.

> **Roadmap Note:** This document describes the structure defined in Step 4. The actual `storyboard.json` file will be authored in Step 5.

---

## 1. Why `storyboard.json` Is the Single Source of Truth

Rather than scattering prompts, timings, narration lines, and export settings across multiple scripts or maintaining separate files for vertical and horizontal videos, the entire film is driven by **one shared `storyboard.json`** file:

- **Consistency across stages:** Narration, keyframes, moving shots, music, subtitles, and FFmpeg assembly all read from the exact same shot definitions.
- **Selective regeneration:** Updating a single shot's prompt or narration line only invalidates that shot's cached artifacts.
- **One source for both aspect ratios:** Both the `9:16` vertical export and `16:9` horizontal export share the same narrative, timing, audio, and core visual prompts while optionally providing format-specific framing overrides.
- **Pre-flight validation:** Validating `storyboard.json` against `schema/storyboard.schema.json` before running models catches structural errors before spending API quota or GPU time.

---

## 2. Top-Level Structure

At the root, `storyboard.json` is an object with strict properties (`additionalProperties: false`):

```json
{
  "schema_version": "1.0.0",
  "project": { "..." : "..." },
  "outputs": { "..." : "..." },
  "narration_config": { "..." : "..." },
  "style_guide": { "..." : "..." },
  "music_plan": { "..." : "..." },
  "ai_disclosure": { "..." : "..." },
  "shots": [ "..." ],
  "notes": "Optional revision notes"
}
```

---

## 3. Purpose of Each Major Top-Level Field

| Field | Required? | Purpose |
| --- | --- | --- |
| `schema_version` | Required | Pins the contract version (`"1.0.0"`). |
| `project` | Required | Film title, location, central message, target runtime (`60–90` s), optional FPS, and mandatory creative boundary flags (`non_political`, `no_invented_history`, `distinguish_ai_reconstructions` all `true`). |
| `outputs` | Required | Configures both `9:16` (`vertical`) and `16:9` (`horizontal`) outputs, optional audio mix targets (LUFS, ducking), and the mandatory AI disclosure `end_card`. |
| `narration_config` | Required | Configurable spoken narration language, required English subtitle language, and optional TTS `voice_settings`. |
| `style_guide` | Optional | Shared visual style text, global negative prompt, color palette, and reference sheets (`character`, `monument_reconstruction`, `environment`, `style`, `prop`). |
| `music_plan` | Optional | Global score configuration (provider, model, instrumental flag, tempo/key metadata, overall prompt, seed, audio path). |
| `ai_disclosure` | Required | Global declaration that AI tools are used, AI reconstructions are distinguished from real photographs, and consent verification status is tracked. |
| `shots` | Required | Fixed-length array of **exactly 10 shots** representing the film's emotional arc. |
| `notes` | Optional | Free-text author notes about the storyboard revision. |

---

## 4. Structure of an Individual Shot

Each entry inside `shots` represents one continuous beat between cuts (`additionalProperties: false`):

```json
{
  "shot_id": "shot-01",
  "order": 1,
  "duration_seconds": 7.5,
  "start_seconds": 0.0,
  "end_seconds": 7.5,
  "story_beat": "Introduction to Harar",
  "narrative": { "..." : "..." },
  "visual": { "..." : "..." },
  "generation": { "..." : "..." },
  "audio": { "..." : "..." },
  "editing": { "..." : "..." },
  "provenance": { "..." : "..." }
}
```

- **Identification & timing:**
  - `shot_id` (required): Unique slug matching `^[a-z0-9][a-z0-9_-]{1,63}$`.
  - `order` (required): Integer `1` through `10`.
  - `duration_seconds` (required): Number between `3` and `15` seconds (target ~`6–9` s per shot so all 10 shots sum to `60–90` s).
  - `start_seconds` / `end_seconds` (optional, nullable): Timeline offsets when explicitly calculated.
  - `story_beat` (optional): Short label describing the beat's place in the 10-shot arc.

---

## 5. Narration and Subtitles

Narration is configured globally in `narration_config` and authored shot-by-shot inside `shot.narrative` and `shot.audio.narration_sync`:

```json
"narration_config": {
  "language": "To be selected in Step 5",
  "language_code": null,
  "subtitle_language": "en",
  "voice_settings": {
    "provider": "gemini",
    "model": null,
    "voice_id": null,
    "speaking_style": "calm, warm, reflective",
    "speed": 1.0,
    "sample_rate_hz": null
  }
}
```

- **Configurable language:** `narration_config.language` is intentionally not locked to a single enum value so the final narration language can be chosen in Step 5.
- **English subtitles:** `subtitle_language` enforces `"en"` or `"English"`, and every shot requires `narrative.english_subtitle_text` alongside `narrative.narration_text` and `narrative.emotional_purpose`.
- **Voice parameters:** All fields inside `voice_settings` are optional and nullable so values unknown prior to production do not need to be invented. An `additional_params` object allows extra provider-specific parameters.
- **Per-shot sync:** `shot.audio.narration_sync` optionally stores `offset_seconds`, `expected_duration_seconds`, `actual_duration_seconds`, `audio_path`, and `duck_music`.

---

## 6. Image and Video Generation Settings

Each shot separates **creative visual intent** (`shot.visual`, required) from **execution settings** (`shot.generation`, optional):

- **`shot.visual` (required):** `main_prompt`, `visual_style`, `subject_description`, `environment_description`, `lighting_atmosphere`, `camera_framing` (enumerated), `camera_movement` (enumerated), plus optional `negative_prompt` and `reference_ids`.
- **`shot.generation` (optional):** Contains optional `image` and `video` blocks:
  - `image`: optional/nullable `provider`, `model`, `seed`, `keyframe_path`, and `parameters` (`width`, `height`, `steps`, `guidance_scale`, `extra_params`).
  - `video`: optional/nullable `mode` (`image_to_video`, `ken_burns_still`, or `static_hold`), `provider`, `model`, `seed`, `clip_path`, and `parameters` (`resolution`, `fps`, `num_frames`, `steps`, `guidance_scale`, `motion_prompt`, `extra_params`).

Because `generation` fields and seeds are optional or nullable, `storyboard.json` can be drafted cleanly in Step 5 without inventing seeds or output paths ahead of time.

---

## 7. Music and Transitions

- **Per-shot music:** `shot.audio` requires `music_cue` (cue label or role) and `music_mood`, with optional `music_intensity` (`silent`, `low`, `medium`, `high`).
- **Global score:** Top-level `music_plan` stores overall score metadata (`provider`, `model`, `instrumental_only`, `tempo_bpm`, `musical_key`, `overall_prompt`, `seed`, `audio_path`, `extra_params`).
- **Transitions:** `shot.editing` requires `transition_in` and `transition_out` from a controlled set (`cut`, `crossfade`, `dissolve`, `fade_from_black`/`fade_to_black`, `j_cut`, `l_cut`), plus optional `transition_duration_seconds` (`0.0–3.0` s).

---

## 8. Vertical (`9:16`) and Horizontal (`16:9`) Support

One storyboard drives both deliverables:

1. **Top-level `outputs`:** Requires `aspect_ratios` containing both `"9:16"` and `"16:9"`, plus dedicated `vertical` and `horizontal` configuration blocks (optional pixel dimensions, safe-area margins, and subtitle placement styles).
2. **Per-shot `editing.composition`:** Optional block supporting `shared_subject_position` (for example, keeping the subject centered in keyframes so both crops work well) alongside optional `vertical_9_16` and `horizontal_16_9` overrides (`crop_anchor`, `safe_area_notes`, `subtitle_placement`, `notes`).

---

## 9. AI Provenance and Disclosure

AI transparency is enforced at three levels:

1. **Top-level `ai_disclosure`:** Requires `contains_ai_generated_content: true`, `distinguishes_reconstructions_from_archival_photos: true`, `disclosure_statement`, and `consent_verified`.
2. **Top-level `outputs.end_card`:** Requires `enabled: true`, `duration_seconds` (`1.5–5.0`), and `disclosure_text`.
3. **Per-shot `shot.provenance`:** Requires `uses_ai_imagery`, `imagery_type` (`ai_reconstruction`, `ai_atmospheric`, `real_photograph`, `mixed_with_reference`, or `title_or_blank`), `is_authentic_historical_photo`, and `disclosure_note`, plus optional `source_references`. Schema conditional rules (`if`/`then`) ensure that AI reconstructions (`ai_reconstruction` / `ai_atmospheric`) can never be marked `is_authentic_historical_photo: true`.

---

## 10. Required vs. Optional Summary & Schema Limitations

### Summary of Required vs. Optional Data
- **Required at storyboard design time:** Film metadata & boundaries, dual output declarations + AI end card, configurable language & English subtitle target, global AI disclosure flags, exactly 10 shots with `shot_id`, `order`, `duration_seconds`, narrative & emotional purpose, core visual prompt/environment/framing/movement fields, music cue/mood, transitions, and per-shot AI provenance flags.
- **Optional / nullable until production:** Generation providers/models/parameters/seeds, output file paths (`keyframe_path`, `clip_path`, `audio_path`), TTS `voice_id`/sample rate/measured durations, `start_seconds`/`end_seconds`, format-specific crop overrides, `style_guide`, and `music_plan`.

### Rules That Require Companion Validation Outside JSON Schema
JSON Schema Draft 2020-12 enforces field types, enums, ranges, required keys, strict property names, and per-object conditionals, but **cannot** evaluate these cross-item/arithmetic rules cleanly:

1. **Summed shot durations:** Verifying that the sum of `shots[*].duration_seconds` equals `project.target_duration_seconds` and falls within `60–90` seconds.
2. **Unique `shot_id` values:** `uniqueItems: true` checks whole shot objects rather than individual nested keys, so a Python validator must check that all 10 `shot_id` values are distinct.
3. **Contiguous `order` sequence (`1..10`):** Verifying there are no duplicate or missing `order` integers and that shots appear in order.
4. **Timeline arithmetic:** Checking `end_seconds - start_seconds == duration_seconds` and sequential continuity across adjacent shots when timestamps are provided.
5. **Reference & file existence checks:** Confirming `visual.reference_ids` match entries in `style_guide.reference_sheets` and checking disk paths during pipeline execution.
