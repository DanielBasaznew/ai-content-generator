# Final Project Report: The Monument That Lives in My Memory

**Challenge:** AI-Content Generation (B2W0)  
**Author / Director:** Daniel Basaznew  
**Date:** November 26, 2026  
**Repository:** [github.com/DanielBasaznew/ai-content-generator](https://github.com/DanielBasaznew/ai-content-generator)  
**Live Showcase:** [ai-content-generator-showcase-phi.vercel.app](https://ai-content-generator-showcase-phi.vercel.app)  
**Primary Deliverables:**
- **Vertical Master (9:16):** `outputs/vertical/harar_monument_vertical_9x16.mp4` (1080×1920, 83.0s, -14.0 LUFS)
- **Horizontal Master (16:9):** `outputs/horizontal/harar_monument_horizontal_16x9.mp4` (1920×1080, 83.0s, -14.0 LUFS)
- **Single Reproduction Entry Point:** `python make_film.py` (or `python -m pipeline.assembly`)

---

## 1. Project Overview: What I Set Out to Make and for Whom

### 1.1 The Heritage Story & Intention
*The Monument That Lives in My Memory* is an 83-second personal, first-person animated short film exploring memory, displacement, and cultural identity in Harar, Eastern Ethiopia.

Growing up in Harar, roughly 2.5 km from the historic walled city of Jugol, the bronze equestrian statue of Ras Makonnen stood as a vibrant landmark at the central roundabout. For me as a child, passing the monument was intrinsically linked to anticipation and happiness—accompanying my parents into town, buying new holiday clothes, or heading to community gatherings. 

After leaving Harar for over five years to pursue higher education in Adama and Addis Ababa, returning home revealed a sudden void: the monument had been demolished in 2020. The pedestal was vacant, surrounded only by ordinary asphalt traffic. This absence created a profound emotional rift: while physically standing in my hometown, the Harar of my childhood lived only in memory.

**Central Message:**  
*Physical landmarks may disappear, but cultural heritage and emotional meaning endure within the memories people carry.*

### 1.2 Target Audience
Documented in `DESIGN.md`, I intentionally calibrated the film for three distinct groups:
1. **People from Harar & the Ethiopian Diaspora:** Viewers who hold deep personal and communal ties to Harar's unique architecture (Jugol walls, five historic gates) and immediately recognize the cultural weight of the Ras Makonnen landmark.
2. **Individuals with Childhood Relocation Experiences:** A universal audience of anyone who has left a cherished childhood home, returning years later to discover that beloved spaces, trees, or neighborhood landmarks have been transformed or erased.
3. **Global / International Viewers:** Viewers unfamiliar with Ethiopian geography who connect through the universal emotional arc of nostalgia and loss, supported by burned-in English subtitles and contextual visual storytelling.

### 1.3 Creative & Ethical Boundaries
As established in `ETHICS.md` and `DESIGN.md`:
- **Personal and Non-Political:** The narrative focuses strictly on childhood nostalgia, personal grief, and the emotional resonance of space, scrupulously avoiding political partisanship, recrimination, or historical controversy.
- **AI Transparency & Consent:** All visual assets are fictional generative reconstructions rather than archival photographs. A mandatory 3.0-second AI disclosure end card is burned into the final export, crediting all models (FLUX, Wan 2.2, ACE-Step 1.5, Edge-TTS).

---

## 2. Learning from the Audience: User Tests 1 and 2

Testing early and often directly shaped the creative choices in this project. Following the design thinking workflow, I conducted two formal audience testing rounds with participants drawn from my target groups.

### 2.1 Audience Test 1 — The Audio Radio Cut (Step 5)
- **Artifact Tested:** `outputs/radio_cut/radio_cut_v1.mp3` (80.0s, voice-only Amharic narration with timed pauses, zero background music).
- **Participants:** 3 listeners (two native Amharic speakers from the Ethiopian community, one non-Amharic speaker reviewing the read-along English subtitle translation).
- **Key Learnings:**
  - *Pacing & Clarity:* The listeners confirmed that the 80.0-second voice timeline did not drag. Proper nouns (`ሐረር`, `የራስ መኮንን ሐውልት`, `አዳማ`, `አዲስ አበባ`) were crisp and immediately understandable.
  - *Emotional Arc Validation:* Listeners confirmed the emotional progression landed cleanly: curiosity/warmth in Shots 1–4, bittersweet transition in Shots 5–7, and a quiet emotional punch at Shot 8–9 when the realization hits that the monument is gone.
- **Decisions / Changes Made:**  
  Because the radio cut pacing was unanimously approved, I locked the 80.0-second voice timeline as the rigid timing contract for all subsequent keyframe, video, and music generation stages, preventing wasted GPU credits.

### 2.2 Audience Test 2 — The Near-Final Cut (Step 13)
- **Artifacts Tested:** `outputs/vertical/harar_monument_vertical_9x16.mp4` and `outputs/horizontal/harar_monument_horizontal_16x9.mp4` (83.0s, fully assembled with video, ducked score, subtitles, and end card).
- **Participants:**
  1. *Participant A (Harari Heritage):* Mobile screening (9:16). Highlighted the emotional contrast between the majestic statue in Shot 4 and the vacant roundabout in Shot 9. Praised the authentic timbre of the ACE-Step traditional Ethiopian krar/masenqo background score.
  2. *Participant B (Relocation Experience):* Desktop screening (16:9). Confirmed that the automatic sidechain music ducking allowed every narration word to cut through cleanly without masking. Appreciated the ambient blurred background wings on the 16:9 cut rather than harsh black pillarboxes.
  3. *Participant C (International Viewer):* Mobile screening (9:16). Found the story completely accessible through the burned-in English subtitles, noting that the two-line balanced subtitle layout was legible and never obscured critical visual action.
- **Decisions / Changes Made:**  
  Validated that the sidechain compressor ducking ratio (6:1) and target loudness (-14.0 LUFS) were balanced across phone speakers and laptop audio. No re-cuts were required; I approved the assembled cut as final.

---

## 3. The Hardest Technical Problem & How I Solved It

### 3.1 The Problem: Temporal Clip Extension & Aspect Adaptation
The visual backbone of the film relied on Wan 2.2 TI2V-5B run on Kaggle T4 GPUs. While Wan 2.2 produces remarkable physical motion, Kaggle GPU memory and compute limits bounded generation to **73 frames at 24 fps (3.04 seconds per clip)** at 512×512 resolution.

However, the storyboard contract required shots ranging from **6.5 seconds to 10.0 seconds** to give the Amharic spoken lines and cross-dissolve transitions adequate breathing room. A naive loop created jarring visual hitches, and a naive slow-motion factor of 2.5×–3.0× introduced severe frame-blending ghosting and unnatural, sluggish character movements. Furthermore, cropping 1:1 square video to 16:9 horizontal severed human heads and architectural landmarks.

### 3.2 The Multi-Stage Solution in `pipeline/assembly.py`
I designed a bespoke normalization filter chain in FFmpeg:
1. **Controlled Temporal Slowdown:** I applied a subtle, perceptually natural 1.35× slowdown using `setpts=1.35*PTS,framerate=fps=24`. This extended the 3.04s clip to ~4.10s of organic, fluid motion without frame stutter.
2. **Tail-Frame Freeze with Zoompan Motion:** To cover the remaining 2.5–5.0 seconds of each shot slot, I used `tpad=stop_mode=clone` to hold the final clean frame. To prevent the hold from looking like a frozen video crash, I injected an automated subtle camera push via `zoompan=z='min(zoom+0.0003,1.07)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`. Static shots (e.g., Shot 8's empty street) utilized a steady hold, while dynamic shots featured gentle forward momentum.
3. **Aspect-Aware Dual Compositing:**
   - *Vertical (9:16):* Centered or anchor-cropped (e.g. `crop_anchor: left` for Shot 8) from 1024×1024 canvas to 1080×1920.
   - *Horizontal (16:9):* Rather than cutting the top and bottom off the square frame, I split the video into two streams: a background layer scaled to 1920×1080 with a heavy Gaussian blur (`boxblur=36:6`), darkened by 35% (`eq=brightness=-0.08:contrast=0.9`), over which the sharp, full-resolution 1080×1080 square foreground was centered.
4. **Precision Symmetric Cross-Fades:** Each adjacent shot pair overlaps by 0.6s to 1.0s using symmetric `xfade` mathematics, yielding an exact 80.000s narrative video cut before the 3.0s end card.

---

## 4. Suggested Practices Tested Honestly

### 4.1 The Practice That Beat Instinct: Strict JSON Contract & SHA-256 Caching
- **The Instinct:** In rapid prototyping, instinct pushes developers to write quick, ad-hoc Python scripts that directly pass CLI parameters between models, hardcoding shot lengths and prompt strings in code.
- **The Practice:** I enforced a centralized, strict JSON Schema contract (`storyboard.schema.json` under Draft 2020-12) where `storyboard.json` is the sole source of truth for prompts, timing, voice lines, camera directions, and transitions. Alongside this, every pipeline stage implemented SHA-256 caching based on input hashes.
- **The Evidence:** During assembly debugging (fixing subtitle line wrapping and gradient banding on the end card), rebuilding the entire 83-second film took only **0.15 seconds** when cached, rather than 460 seconds of CPU rendering. When one parameter changed, only the affected stage invalidated its cache. Furthermore, when an out-of-order Git conflict occurred earlier, the strict schema validator immediately caught and prevented corrupted state.

### 4.2 The Practice That Did Not Beat Instinct: Rigid Top-Level Schema Constraints
- **The Instinct:** Software engineering favors extensible configuration dictionaries where new pipeline metadata (e.g., assembly render latency, audio loudness measurements, export checksums) can be appended directly to the top-level manifest.
- **The Practice:** The assignment template insisted on `additionalProperties: false` at the root of `storyboard.schema.json`.
- **The Evidence:** When implementing Step 10 assembly, I needed to record output render times, integrated LUFS, and file sizes. Attempting to add an `assembly_metadata` object caused `jsonschema.ValidationError` in the automated test suite. I had to work around this by storing assembly manifests separately in `outputs/intermediate/assembly_manifest.json` and packing assembly status strings into the existing `notes` field. In production media pipelines, a decoupled manifest pattern or extensible schema is far more resilient than rigid closed-schema validation.

---

## 5. Curiosity Beyond the Floor (Ceiling Work)

To push the project beyond the standard requirements, I implemented three advanced engineering enhancements:

### 5.1 Automated Professional Broadcast Audio Engineering
Rather than relying on basic audio mixing, `pipeline/assembly.py` implements a broadcast-compliant audio mastering chain:
- **Speech Stem Upsampling & Pre-conditioning:** The Edge-TTS mono 24 kHz Amharic speech is upsampled to 48 kHz stereo, padded, and normalized.
- **Dynamic Sidechain Ducking:** The ACE-Step 1.5 music track is routed through an FFmpeg `sidechaincompress` filter keyed to the narration voice stem (Threshold: 0.02, Ratio: 6:1, Attack: 300 ms, Release: 1500 ms). Whenever the speaker speaks, the music automatically attenuates by ~12 dB and gently swells back during scene transitions.
- **Two-Pass EBU R128 Loudness Normalization:** The combined mix is measured in pass 1 for integrated loudness, true peak, and loudness range, then normalized in pass 2 to exactly **-14.0 LUFS** with a **-1.0 dBTP** ceiling, ensuring compliant loudness on YouTube, TikTok, and Instagram without clipping.

### 5.2 Syntactic Two-Line Subtitle Balancing Engine
Default subtitle burning tools often create awkward line breaks (e.g., leaving a single isolated orphan word like "demolished." on the second line). I authored a custom balancing algorithm in `_balance_two_lines()`:
- Splits long subtitles at natural punctuation boundaries (commas, conjunctions).
- Dynamically minimizes the character delta between Line 1 and Line 2.
- Generates custom Advanced SubStation Alpha (`.ass`) styles with aspect-ratio-specific font sizes (48pt vertical, 40pt horizontal) and 120px safe-area margins.

### 5.3 Deterministic Dual-Format Visual Pipeline & Web Showcase
The pipeline generates both **9:16 vertical** (optimized for mobile/shorts) and **16:9 horizontal** (optimized for widescreen) from the exact same storyboard contract in one pass. To showcase this work, I built and deployed an interactive Next.js web application ([ai-content-generator-showcase-phi.vercel.app](https://ai-content-generator-showcase-phi.vercel.app)) featuring an interactive **"Memory vs. Reality"** heritage slider, dual-aspect player, and reviewer evidence map.

---

## 6. What I Would Build Next

If extending this project into a full production tool, I would focus on two initiatives:
1. **Multilingual Regional Voice & Cultural Benchmarking:**  
   Harar is a linguistic crossroads where Amharic, Afaan Oromo, Harari (Gey Sinan), and Somali intersect. I would synthesize the voiceover in all four regional languages, benchmarking phonetic accuracy and emotional delivery across edge-TTS and Gemini Live models.
2. **Interactive Web-Based Storyboard IDE:**  
   Package the pipeline into an open-source web application where community storytellers can upload audio or write narration, preview real-time pan/zoom transitions in Canvas/WebGL, and dispatch headless rendering jobs to cloud GPUs with zero terminal knowledge.

---

## 7. Project Metrics & Cost Summary

| Stage | Model / Tool | Latency | Compute / Quota | Actual Cost | List-Price Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Story & Script** | Gemini 2.5 Flash | 2.1s | 1,420 tokens | $0.00 | $0.001 |
| **Narration** | Edge-TTS (Amharic) | 3.4s | 10 audio clips | $0.00 | $0.005 |
| **References** | Cloudflare FLUX.1 | 18.2s | 4 images | $0.00 | $0.012 |
| **Keyframes** | Cloudflare FLUX.1 | 42.6s | 10 keyframes | $0.00 | $0.028 |
| **Video Clips** | Wan 2.2 TI2V-5B | ~28 min | Kaggle T4 GPU | $0.00 | $0.500 |
| **Original Music** | ACE-Step 1.5 | ~6 min | Kaggle T4 GPU | $0.00 | $0.150 |
| **Assembly & Master** | FFmpeg 9.1 | 459.8s | Local CPU | $0.00 | $0.000 |
| **Total** | | | | **$0.00** | **$0.696** |

---

## 8. Conclusion
*The Monument That Lives in My Memory* demonstrates that generative AI, when governed by disciplined software engineering, strict contracts, and continuous audience feedback, can preserve personal and cultural heritage with emotional resonance, technical precision, and complete transparency.
