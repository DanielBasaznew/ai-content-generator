# Visual-Style Reference Sheet

**Project:** The Monument That Lives in My Memory  
**Step:** Step 6 — Character & Visual-Style Reference Sheets  
**Formats Driven:** Shared `storyboard.json` targeting **Vertical `9:16` (`1080x1920`)** and **Horizontal `16:9` (`1920x1080`)**

> **Historical Accuracy & AI Disclosure Rule:** Every visual produced from this style guide is a **personal-memory artistic reconstruction**. Never imitate authentic historical photographs (no fake film scratches, sepia archive borders, printed date stamps, or invented architectural details of the Ras Makonnen Monument).

---

## 1. Master Visual Aesthetic (`shared_style_block`)

- **Core Look:** Warm, grounded 35mm cinematic memory-film aesthetic with subtle organic film grain, soft optical depth of field, and natural light falloff.
- **Realism Target:** Lifelike atmospheric realism—human, tactile, and understated rather than glossy CGI, HDR hyper-realism, or stylized animation.
- **Canonical Style Block (also stored in `storyboard.json`):**
  > `Warm cinematic memory film aesthetic, gentle 35mm film grain, natural daylight and golden-hour textures, soft shallow depth of field, emotionally grounded Ethiopian urban atmosphere, respectful personal-memory visual reconstruction without archival photo framing or overlaid text.`
- **Canonical Negative Prompt (`global_negative_prompt`):**
  > `text, watermark, subtitles, split screen, border, black-and-white archival photo frame, distorted faces, extra fingers, overly saturated neon colors, futuristic buildings, political banners, construction equipment`

---

## 2. Emotional Color Palette Progression

The color temperature shifts deliberately across the four emotional phases defined in `DESIGN.md` (Happiness -> Nostalgia -> Sadness & Loss -> Reflection):

| Story Phase | Shots | Primary Palette & Hex Guide | Emotional Function |
| --- | --- | --- | --- |
| **1. Childhood Warmth & Joy** | Shots 1–4 | Sunlit terracotta (`#C87A53`), warm limestone cream (`#EBDCC8`), golden amber (`#D49A45`), sunlit tree olive (`#5C7348`) | Feels inviting, nostalgic, safe, and full of childhood anticipation |
| **2. Departure & Years Away** | Shots 5–6 | Dusty blue-gray (`#6C7D8E`), cool twilight slate (`#3D4E61`), muted desk-lamp amber accent (`#E0A85B`) | Communicates distance, passage of time, and quiet focus far from Harar |
| **3. Return & Absence** | Shots 7–8 | Muted overcast stone (`#9A9892`), desaturated earth (`#7D746A`), cool quiet shadow (`#4E555C`) | Visually drains childhood warmth to mirror surprise, emptiness, and quiet disappointment |
| **4. Reflection & Enduring Memory** | Shots 9–10 | Evening indigo-slate (`#4B5B70`) softened by warm sunset amber glow (`#DF9B4F`) | Bridges loss back into warmth—showing that memory survives even when physical structures vanish |

---

## 3. Lighting, Atmosphere, and Camera Language

- **Lighting Continuity:**
  - **Shots 1–4:** Directional golden-morning and late-afternoon sunlight, soft atmospheric haze, gentle dappled shadows through roundabout trees.
  - **Shots 5–6:** Transition from late-afternoon fading warmth (Shot 5) to cool evening window light paired with one localized warm desk lamp (Shot 6).
  - **Shots 7–8:** Soft, diffused overcast afternoon light with low contrast and open shadows to emphasize stillness without melodramatic storms.
  - **Shots 9–10:** Balanced twilight transitioning into a serene warm sunset glow over Harar rooftops.
- **Camera Movement Discipline (Wan 2.2 & Ken Burns Compatibility):**
  - **One gentle motion per shot:** `dolly_in`, `slow_pan_right`, `tracking`, `slow_pan_left`, `dolly_out`, `static`, or `ken_burns_zoom_out`.
  - **Shot 8 stillness:** Uses a locked-off `static` camera to let the silence and absence of the landmark breathe emotionally.

---

## 4. Environment & Landmark Representation Guidelines

1. **Harar Residential Streets (`ref_harar_streets` — Shots 1, 7, 9, 10):**
   - Textured plastered earth-toned walls, warm timber doors, modest neighborhood lanes, mature shade trees, and quiet evening rooftop silhouettes.
   - Keep street signs blank or out of focus so generative models do not produce garbled text.
2. **Ras Makonnen Monument Memory Reconstruction (`ref_harar_roundabout_memory` — Shots 2, 3, 4):**
   - **No invented historical specifics:** Because no authentic archival photograph of the monument is in `assets/references/`, depict the roundabout landmark only as a **soft, atmospheric stone-pedestal silhouette** framed by green shade trees and sunlight—never invent detailed bronze reliefs, inscriptions, or unverified sculptural features.
3. **Empty Roundabout on Return (Shot 8):**
   - **Non-political & non-speculative:** Show an ordinary, quiet open paved roundabout space surrounded by trees in subdued light—**strictly avoid** bulldozers, rubble piles, protest signs, or anything implying how or why it was removed.
4. **University Study Space (Shot 6):**
   - Modest room with wooden desk, blank/unreadable open notebooks, window overlooking distant evening city lights—cleanly communicating Adama/Addis Ababa university years without anachronistic sci-fi tech.

---

## 5. Dual-Aspect-Ratio (`9:16` & `16:9`) Composition Rules

Every keyframe is generated from **one shared storyboard prompt** and must work cleanly in both output aspect ratios:

- **Center-Weighted Safe Framing:** Place the primary subject (child, adult, street vanishing point, or roundabout center) within the **central 56% horizontal slice** and **middle vertical band (`18%–75%` from top)** so a single master frame crops cleanly to `1080x1920` (`9:16`) without slicing off faces, joined hands, or the roundabout landmark.
- **Vertical Safe Margins (`9:16`):** Reserve top `180px` for social UI overlays and bottom `320px` for English burned-in subtitles (`bottom_safe`, max 2 lines, ~34 chars/line).
- **Horizontal Safe Margins (`16:9`):** Reserve `60px` top, `90px` bottom (`lower_third` subtitles, max 2 lines, ~42 chars/line), and `100px` side breathing room.

---

## 6. Environment Reference Sheet Prompts (Ready for Step 6 Generation When Approved)

> **Status:** Specifications only. **Do not generate** Step 6 reference images or Step 7 keyframes until credentials are configured and approved.

- **`ref_harar_streets` Prompt:** `Environment mood board reference of a quiet sunlit residential lane in Harar, Ethiopia, warm earth-toned plastered walls, textured wooden doorways, gentle shade tree foliage, warm morning sunlight with subtle dust haze, center-aligned street path suitable for both 9:16 and 16:9 framing, 35mm film grain aesthetic, no text, no readable signs, no borders.`
- **`ref_harar_roundabout_memory` Prompt:** `Environment memory reconstruction reference of a wide sunlit roundabout plaza in Harar, Ethiopia, ringed by green shade trees and soft golden daylight, distant gentle silhouette of a stone pedestal landmark centered in soft atmospheric depth without crisp architectural details or plaques, warm 35mm film grain aesthetic, clearly artistic memory impression, no text, no archival photo border.`

---

## 7. Pre-Step-7 Consistency Checklist

Before generating any keyframe in Step 7:
1. Verify `shared_style_block` and `global_negative_prompt` are applied consistently alongside shot-specific descriptions.
2. Verify `ref_narrator_child` retains the cream collar + muted ochre vest + cropped curly hair across Shots 3–4, and `ref_narrator_adult` retains the off-white shirt + slate-navy overshirt + cropped curly hair across Shots 5–9.
3. Confirm no shot introduces readable text, political symbols, construction machinery, or fake archival-photo framing.
4. Keep all generated reference sheets explicitly logged in `ETHICS.md`, `runs.jsonl`, and `storyboard.json` once generation is approved.
