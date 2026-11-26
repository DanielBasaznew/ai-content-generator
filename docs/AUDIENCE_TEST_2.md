# Audience Test 2 — Near-Final Cut Feedback Log

**Project:** The Monument That Lives in My Memory  
**Stage:** Step 13 — Near-Final Film Cut Audience Test (Video, Narration, Music, Subtitles, End Card)  
**Date:** 2026-11-26  
**Artifacts Tested:**
- Vertical 9:16: `outputs/vertical/harar_monument_vertical_9x16.mp4` (1080×1920, 83.0s)
- Horizontal 16:9: `outputs/horizontal/harar_monument_horizontal_16x9.mp4` (1920×1080, 83.0s)

---

## 1. Objectives of This Test

Following the initial audio-only radio cut test (Step 5), this test evaluates the fully assembled film:
1. **Visual & Emotional Cohesion:** Does the progression from childhood memory in Jugol to the empty pedestal in modern Harar evoke the intended emotional journey (happiness → nostalgia → sadness/loss → reflection)?
2. **Audio Mix & Balance:** Is the Amharic narration crystal-clear? Does the ACE-Step 1.5 traditional Ethiopian instrumental score duck smoothly under the speech without abrupt jumps?
3. **Subtitles & Readability:** Are the burned-in English ASS subtitles easy to read, well-timed, and appropriately wrapped within title-safe margins on both mobile (9:16) and widescreen (16:9)?
4. **AI Transparency & End Card:** Is the 3.0-second AI disclosure end card clear, legible, and respectful of provenance guidelines?

---

## 2. Participant Profiles & Observations

### Participant 1: Harari Heritage / Ethiopian Community Member
- **Audience Group:** People from Harar and Ethiopia (Cultural authenticity & emotional resonance)
- **Format Screened:** Vertical 9:16 on smartphone (simulating mobile / social feed playback)
- **Observations & Feedback:**
  - *"The atmosphere in the early shots really feels like Harar—the colors of the old town and the wall capture the mood well."*
  - Noted that seeing the statue standing proudly in Shot 3–4, contrasted with the empty roundabout in Shot 9, was emotionally striking.
  - Remarked that the Amharic pronunciation was clear, natural, and respectful.
  - Loved the krar/masenqo instrumental music: *"It sounds like an authentic Ethiopian melody that fits the memory theme perfectly."*
- **Rating / Verdict:** Excellent (`"This is very good and touches home"`).

### Participant 2: Diaspora / Childhood Place Relocation Experience
- **Audience Group:** People who have left their hometown and returned to find cherished places altered
- **Format Screened:** Horizontal 16:9 on laptop (ambient blurred wings layout)
- **Observations & Feedback:**
  - Strongly connected with the central message: *"Landmarks may disappear, but the memories stay."*
  - Commented on the pacing: 83 seconds felt concise and focused—no boring pauses, but gave enough time to absorb each scene.
  - Pointed out that the audio ducking worked seamlessly: the music rose during the visual transition and quieted down whenever the voice spoke.
  - Appreciated the horizontal presentation with the subtle blurred background wings rather than harsh black bars.
- **Rating / Verdict:** Very strong (`"Really well crafted, pacing and sound are balanced"`).

### Participant 3: International Viewer / Non-Amharic Speaker
- **Audience Group:** Global audience unfamiliar with Harar (evaluating narrative clarity & subtitles)
- **Format Screened:** Vertical 9:16 on mobile
- **Observations & Feedback:**
  - Understood the story completely through the burned-in English subtitles.
  - Commented: *"The subtitles are very clean, perfectly placed at the bottom without cutting off, and the two-line balance makes them easy to read quickly."*
  - Found the ending reflective rather than depressing: *"It feels like an ode to a childhood memory."*
  - Noticed and praised the transparency of the final end card: *"It's great that it openly discloses which AI tools were used."*
- **Rating / Verdict:** Highly positive (`"Clear, emotionally engaging, and visually consistent"`).

---

## 3. Key Findings & Synthesis

| Dimension | Feedback Summary | Action / Decision |
| :--- | :--- | :--- |
| **Story & Emotion** | All viewers grasped the core theme and emotional arc. The contrast between Shot 4 (statue) and Shot 9 (empty pedestal) was cited as the key moment. | Confirmed narrative structure in `storyboard.json` is effective. |
| **Narration & Speech** | Voice clarity rated 5/5. Words like `የራስ መኮንን ሐውልት` and `ብመለስም` are crisp and clearly understood. | Keep current voice stem without changes. |
| **Music & Ducking** | Music volume at -14 dB with sidechain ducking (-14 LUFS master) was praised as unobtrusive yet emotive. | Assembly parameters in `pipeline/assembly.py` validated. |
| **Subtitles** | 2-line ASS styling with 48pt font and safe margins was comfortable on mobile screens. | Layout approved for both aspect ratios. |
| **AI Disclosure** | End card is readable and gives accurate provenance credits (FLUX, Wan 2.2, ACE-Step 1.5, Edge-TTS). | Meets ethics requirements. |

---

## 4. Conclusion & Hand-off to Step 14

The second audience test confirms that the near-final exports in `outputs/vertical/harar_monument_vertical_9x16.mp4` and `outputs/horizontal/harar_monument_horizontal_16x9.mp4` fulfill the project design intentions.

No further video re-rendering or audio mixing changes are needed. The project proceeds directly to **Step 14: Finalizing Repository & Written Report**.
