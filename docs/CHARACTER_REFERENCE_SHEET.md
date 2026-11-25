# Character Reference Sheet — Option A (Fictional Generic Child)

**Project:** The Monument That Lives in My Memory  
**Step:** Step 6 — Character & Visual-Style Reference Sheets  
**Selected Approach:** **Option A — Fictional, generic AI-generated Ethiopian child** (and fictional aged continuity counterpart)  
**Primary Storyboard References:** `ref_narrator_child` (Shots 3–4) and `ref_narrator_adult` (Shots 5–9)

> **Ethical & Likeness Boundary:** This character is **100% fictional and generic**. It does **not** depict or recreate the real face of the author or any real family member, and no real-person likeness consent is claimed. All resulting images are artistic AI reconstructions of memory, never authentic historical photographs.

---

## 1. Childhood Character Specification (`ref_narrator_child`)

Used in childhood memory shots (**Shot 3** over-the-shoulder walk and **Shot 4** medium close-up) to embody warmth, curiosity, and childhood excitement in Harar without copying any real person's likeness.

| Attribute | Design Specification | Purpose for Cross-Shot Consistency |
| --- | --- | --- |
| **Role & Identity** | Fictional, generic Ethiopian child (non-biographical likeness) | Anchors the viewer emotionally in childhood memories while protecting privacy |
| **Age Range** | **7–9 years old** | Old enough to walk eagerly beside parents and recognize the landmark; young enough to convey pure childhood wonder |
| **Build & Proportions** | Natural slender child proportions (~5 to 5.5 heads tall), relaxed youthful posture, normal child-sized hands | Prevents inconsistent adult-like proportions in FLUX/Wan 2.2 generations |
| **Complexion** | Warm medium-brown Ethiopian skin tone (`#7B4F37` to `#8E5B40` in golden daylight) | Reacts consistently to warm morning/afternoon Harar sunlight |
| **Hair** | Short, evenly cropped, tightly curled natural black hair | Clean, unmistakable silhouette in both back/over-the-shoulder (Shot 3) and close-up (Shot 4) views |
| **Facial Features** | Soft rounded childhood cheeks, expressive warm dark-brown eyes, natural modest brows, gentle sincere smile (no exaggerated teeth or cartoonish expression) | Preserves grounded documentary realism and prevents uncanny AI expressions |
| **Wardrobe (Signature)** | **Top:** Soft off-white/cream collared cotton shirt (`#ECE4D6`) worn under a muted **warm ochre/mustard knit vest** (`#C9923E`)<br>**Bottom:** Simple dark-brown/charcoal shorts or casual trousers (`#443A33`)<br>**Footwear:** Plain worn leather sandals or modest canvas shoes | Warm ochre + cream collar creates an immediate visual link across wide, over-the-shoulder, and close-up frames |
| **Key Props** | **Shot 3:** Empty hands gently holding parents' hands (parents shown only from behind as non-identifiable generalized figures)<br>**Shot 4:** A simple brown-paper / plain cloth-wrapped parcel of new clothes (no text, no logos) | Ties visually to the spoken memory of buying new clothes and going on family outings |

---

## 2. Adult Continuity Counterpart (`ref_narrator_adult`)

Used in **Shots 5, 6, 7, 8, and 9** so the audience experiences a clear, natural passage of time from the 7–9-year-old child in Harar to a ~20–24-year-old university student returning home ~5 years later—again remaining strictly a **fictional, generic character**.

| Attribute | Design Specification | Continuity Link to `ref_narrator_child` |
| --- | --- | --- |
| **Age Range** | **20–24 years old** (university student & returning young adult) | Reflects growing up and spending ~5 years in Adama and Addis Ababa |
| **Build & Proportions** | Natural young-adult Ethiopian proportions (~7.5 heads tall), calm unhurried posture | Clear visual contrast with childhood height while preserving calm bearing |
| **Complexion & Hair** | Same warm medium-brown skin tone and short cropped dark curly hair (slightly neater adult hairline) | Immediate visual continuity from child to young adult without jarring redesign |
| **Facial Features** | Matured jawline compared to childhood softness, same calm dark-brown eyes, reflective composed expression (subtle sadness in Shots 8–9, never melodramatic) | Sustains emotional restraint and authenticity |
| **Wardrobe (Signature)** | **Top:** Muted **slate-navy / charcoal cotton overshirt or light jacket** (`#364352`) over a clean off-white shirt (`#EAE6DF`)<br>**Bottom:** Dark casual trousers (`#2E3136`)<br>**Prop (Shot 5):** Simple worn olive-brown canvas backpack | Shifts color palette from childhood ochre to cooler adult slate while keeping the off-white inner collar echo |

---

## 3. Secondary / Background Figures Rule (Shot 3)

- **Parents in Shot 3:** Depicted strictly from **behind / soft over-the-shoulder framing** in modest, timeless everyday Ethiopian clothing (soft cream shawl/netela texture and muted earth-toned shirt/trousers).
- **No identifiable faces:** Parents' faces remain turned away or softly out of focus so no real-person likeness is generated or implied.

---

## 4. Reference-Sheet Generation Prompts & Model Config (Generated & Verified)

> **Status:** Generated on 2026-11-25 via `pipeline/references.py` and visually verified (`assets/references/ref_narrator_child.png` and `assets/references/ref_narrator_adult.png`).

- **Model Used:** `@cf/black-forest-labs/flux-2-klein-4b` (Apache 2.0, Cloudflare Workers AI `multipart/form-data`, fixed 4-step inference)
- **Fallback Model:** `@cf/black-forest-labs/flux-1-schnell` (Apache 2.0, `application/json`, `steps=4`)
- **Generated Dimensions & Seeds:** `1344x768` (landscape 3-view turnaround), deterministic seeds `1001` (`ref_narrator_child`, latency `13.572s`) and `1002` (`ref_narrator_adult`, latency `24.148s`)

### A. `ref_narrator_child` Sheet Prompt (for FLUX)
- **Prompt:** `Character reference sheet on a neutral warm cream studio background, fictional generic Ethiopian child age 8, warm medium-brown skin, short cropped tightly curled black hair, soft natural child facial proportions, gentle warm dark eyes, wearing a clean off-white collared cotton shirt under a muted warm ochre-mustard knit vest, dark brown casual shorts, natural subtle expression, three clean views side by side (front view, three-quarter view, back view), warm soft daylight, 35mm film grain texture, realistic documentary film look, no text, no labels, no borders, no archival sepia frame.`
- **Negative Prompt (guideline / avoided in positive phrasing):** `text, labels, watermark, split border, exaggerated cartoon eyes, distorted hands, extra fingers, adult proportions, shiny plastic skin, archival sepia frame.`

### B. `ref_narrator_adult` Sheet Prompt (for FLUX)
- **Prompt:** `Character reference sheet on a neutral warm gray studio background, fictional generic Ethiopian young adult age 22, warm medium-brown skin, short cropped tightly curled black hair, calm reflective dark eyes, subtle natural features consistent with an older version of the child character, wearing an off-white cotton shirt under a muted slate-navy overshirt and dark casual trousers, three clean views side by side (front view, three-quarter view, back view), soft overcast daylight, 35mm film grain texture, realistic cinematic film look, no text, no labels, no borders.`
- **Negative Prompt (guideline / avoided in positive phrasing):** `text, labels, watermark, cartoon style, melodramatic expression, distorted hands, futuristic clothing, harsh flash lighting.`

---

## 5. Shot-by-Shot Character Consistency Map

| Shots | Character Reference | Framing & Aspect-Ratio Safety (`9:16` & `16:9`) |
| --- | --- | --- |
| **1–2** | None (environment & landmark memory) | Centered street path & roundabout landmark |
| **3** | `ref_narrator_child` (+ non-identifiable parent silhouettes from behind) | Over-the-shoulder center foreground; joined hands & ochre vest visible above `9:16` bottom subtitle margin |
| **4** | `ref_narrator_child` | Medium close-up centered on child's face, cream collar, ochre vest, and plain parcel |
| **5** | `ref_narrator_adult` | Medium-wide back/three-quarter view with backpack centered along departing road |
| **6** | `ref_narrator_adult` | Medium framing of seated student beside window in central 56% horizontal safe band |
| **7** | `ref_narrator_adult` | POV / walking-into-frame back view centered on the street axis |
| **8** | `ref_narrator_adult` | Wide shot: empty roundabout center framed mid-screen, adult standing quietly in lower-middle foreground above subtitle zone |
| **9** | `ref_narrator_adult` | Medium close-up centered on face and shoulders beside warm textured wall |
| **10** | None (Harar twilight skyline closure) | Extreme wide horizon centered vertically for clean `9:16` & `16:9` framing |
