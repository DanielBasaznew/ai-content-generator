# Audience Test 1 — Radio Cut Feedback Log

**Project:** The Monument That Lives in My Memory  
**Stage:** Step 5 — First Audience Prototype Test (Audio-Only Radio Cut)  
**Target Sample:** At least **3 people** representing the intended audiences (people from Harar/Ethiopia, people with similar childhood-place memories, or international viewers).

---

## 1. Purpose of This Test

The radio cut is an audio-only rough cut built from the Amharic narration (and optional English subtitle read-along for non-Amharic listeners) with natural pauses—before generating images, video clips, or original music.

Testing the story at the audio-only stage helps catch:
- Whether the story flow and central message are clear without visuals.
- Where the emotional arc works (childhood joy -> leaving home -> loss -> reflection) and where it feels flat or rushed.
- Any unnatural Amharic phrasing, pacing issues, or confusing transitions before spending GPU quota or API credits on visuals.

---

## 2. Instructions for Running the Session

### Pre-Test Checklist
- **Playable Radio Cut Ready:** `outputs/radio_cut/radio_cut_v1.mp3` (and `outputs/radio_cut/radio_cut_v1.wav`) — `80.0s`, audio-only with silence pauses and zero music.
- **English Subtitle Read-Along (if needed):** `outputs/radio_cut/radio_cut_v1_en.srt` or the table in `docs/NARRATION_REVIEW.md`.
- Recruit **at least 3 real listeners** matching your target audiences (Harar/Ethiopia, people with similar childhood-place memories, or international listeners via English subtitles).
- Testing may be done **in person** or **over Slack/chat** by sharing `outputs/radio_cut/radio_cut_v1.mp3` privately.

### Session Protocol
1. **Before playing:** Explain briefly that this is an early **audio-only** draft (no visuals or music yet) of an 80-second personal short film about a childhood memory in Harar, Ethiopia.
2. **During playback:** Play `outputs/radio_cut/radio_cut_v1.mp3` (or `.wav`) straight through once without interrupting or explaining extra context. (For non-Amharic-speaking test listeners, share `outputs/radio_cut/radio_cut_v1_en.srt` or the English subtitles in `docs/NARRATION_REVIEW.md` while listening.)
3. **After playback:** Ask the 6 questions below and write down each participant's real answers faithfully. Never fabricate or alter responses, and avoid defending or over-explaining the story during feedback—note where confusion or emotion naturally occurred. Ask Amharic listeners specifically whether any proper nouns (`ሐረር`, `የራስ መኮንን ሐውልት`, `አዳማ`, `አዲስ አበባ`) or words (such as Shot 9 `ብመለስም`) sounded unclear.
4. **After all 3+ sessions:** Summarize patterns in Section 4, apply approved revisions to `storyboard.json` and `docs/NARRATION_REVIEW.md`, and record the user test summary in `DESIGN.md` (Section 9 -> Test 1).

---

## 3. Participant Feedback Forms

### Participant 1
- **Participant Label / Relationship (optional, anonymized):** *(e.g., Friend from Harar / Colleague)*
- **Audience Group:** *(Harar/Ethiopia | Similar experience | International)*
- **Date:** `YYYY-MM-DD`
- **Format Tested:** *(Audio-only Amharic | Audio + English subtitle text)*

1. **What do you understand the story to be about?**
   - *Response:* 

2. **Which part of the story affected you most emotionally?**
   - *Response:* 

3. **Was any part confusing?**
   - *Response:* 

4. **Did the narration sound natural and understandable?**
   - *Response:* 

5. **Did you understand the connection between the monument and childhood memories?**
   - *Response:* 

6. **What would you improve?**
   - *Response:* 

---

### Participant 2
- **Participant Label / Relationship (optional, anonymized):**
- **Audience Group:** *(Harar/Ethiopia | Similar experience | International)*
- **Date:** `YYYY-MM-DD`
- **Format Tested:** *(Audio-only Amharic | Audio + English subtitle text)*

1. **What do you understand the story to be about?**
   - *Response:* 

2. **Which part of the story affected you most emotionally?**
   - *Response:* 

3. **Was any part confusing?**
   - *Response:* 

4. **Did the narration sound natural and understandable?**
   - *Response:* 

5. **Did you understand the connection between the monument and childhood memories?**
   - *Response:* 

6. **What would you improve?**
   - *Response:* 

---

### Participant 3
- **Participant Label / Relationship (optional, anonymized):**
- **Audience Group:** *(Harar/Ethiopia | Similar experience | International)*
- **Date:** `YYYY-MM-DD`
- **Format Tested:** *(Audio-only Amharic | Audio + English subtitle text)*

1. **What do you understand the story to be about?**
   - *Response:* 

2. **Which part of the story affected you most emotionally?**
   - *Response:* 

3. **Was any part confusing?**
   - *Response:* 

4. **Did the narration sound natural and understandable?**
   - *Response:* 

5. **Did you understand the connection between the monument and childhood memories?**
   - *Response:* 

6. **What would you improve?**
   - *Response:* 

---

## 4. Synthesis & Planned Storyboard Changes *(Recorded 2026-11-25)*

- **Common Strengths Noted:**
  - Author reported on 2026-11-25 that all 3 listeners gave positive feedback (`"all of them said its nice"`) after listening to `outputs/radio_cut/radio_cut_v1.mp3`.
- **Repeated Confusion Points or Pacing Issues:**
  - None reported by the author. *(Note: individual per-question responses in Section 3 above remain blank and can be filled with exact listener quotes by the author prior to final assignment submission.)*
- **Specific Changes to Apply to `storyboard.json` and `DESIGN.md`:**
  - No wording or `80.0s` timeline changes requested; summary recorded in `DESIGN.md` Section 9 (`Test 1: Radio Cut`).
