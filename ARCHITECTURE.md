# System Architecture & Pipeline Dataflow

> **Status:** **Production Ready (100% Complete & Verified)**. Fully implemented and deterministic. Dual-aspect exports (`outputs/vertical/harar_monument_vertical_9x16.mp4` and `outputs/horizontal/harar_monument_horizontal_16x9.mp4`) are generated via `python make_film.py`.

---

## 1. Visual Pipeline Architecture

```mermaid
flowchart TD
    Contract["📄 storyboard.json<br/>(Draft 2020-12 JSON Schema)"]
    Cache{"SHA-256 Cache Check<br/>(Input Hash Matching)"}

    Contract --> Cache

    subgraph Generation_Stages ["Generation Stages (on Cache Miss)"]
        TTS["🎙️ Stage 1: Narration<br/>Gemini 2.5 Flash TTS<br/>am-ET-Standard-B"]
        IMG["🖼️ Stage 2: Keyframes<br/>FLUX.1-schnell<br/>1024x1024 Photorealistic"]
        VID["🎬 Stage 3: Video Motion<br/>Wan 2.2 I2V (Kaggle T4)<br/>720p 73 frames (3.04s)"]
        MUS["🎵 Stage 4: Soundtrack<br/>ACE-Step 1.5<br/>Krar/Masenqo (72 BPM)"]
    end

    Cache -->|"❌ Cache Miss (New/Edited Prompt)"| TTS
    Cache -->|"❌ Cache Miss"| IMG
    IMG --> VID
    Cache -->|"❌ Cache Miss"| MUS

    subgraph Asset_Store ["Verified Asset Storage (assets/)"]
        AssetsDisk[("💾 Disk Assets Cache<br/>WAV, PNG, MP4")]
    end

    Cache ==>|"✅ Cache Hit (Unchanged Shots)"| AssetsDisk
    TTS --> AssetsDisk
    VID --> AssetsDisk
    MUS --> AssetsDisk

    subgraph Assembly_Engine ["Deterministic Assembly Engine (pipeline/assembly.py)"]
        Slowdown["Video Processing<br/>1.35x slow + zoompan tail push"]
        Duck["Sidechain Ducking<br/>-12 dB music attenuation"]
        EBU["Audio Mastering<br/>EBU R128 (-14.0 LUFS, -1.0 dBTP)"]
        Subs["ASS Subtitle Engine<br/>_balance_two_lines()"]
        Aspect["Dual-Aspect Rendering<br/>16:9 Wings vs. 9:16 Crop"]
    end

    AssetsDisk -->|"Video Clips"| Slowdown
    AssetsDisk -->|"Narration + Music"| Duck
    Contract -->|"English Subtitle Text"| Subs
    
    Duck --> EBU
    Slowdown --> Aspect
    EBU --> Aspect
    Subs --> Aspect

    subgraph Outputs ["Final Master Deliverables (outputs/)"]
        OutVert["📱 9:16 Vertical Master<br/>1080x1920 (TikTok/Reels)<br/>83.0s | -14.0 LUFS"]
        OutHoriz["🖥️ 16:9 Horizontal Master<br/>1920x1080 (YouTube/Cinema)<br/>83.0s | -14.0 LUFS"]
    end

    Aspect --> OutVert
    Aspect --> OutHoriz
```

---

## 2. Selective Regeneration & Caching Flow (Demo in Walkthrough)

```mermaid
flowchart LR
    Edit["User edits Shot 01 in<br/>storyboard.json"] --> Run["Run python make_film.py"]
    
    subgraph Hash_Evaluation ["Per-Shot SHA-256 Hash Evaluation"]
        S1["Shot 01: Hash MISMATCH ❌"]
        S2["Shots 02-10: Hash MATCH ✅"]
    end

    Run --> S1
    Run --> S2

    S1 -->|"Only Shot 01 Regenerated"| Rebuild["Re-synthesize & Render"]
    S2 -->|"Replay from disk (0.15s)"| Skip["[CACHED / SKIPPED]"]

    Rebuild --> Assembly["Assemble Final Dual-Aspect Masters"]
    Skip --> Assembly
```

---

## 3. Core Production Contract: `storyboard.json`
`storyboard.json` is the sole source of truth connecting every stage of the pipeline:
* **Strict Validation (`schema/storyboard.schema.json`):** Evaluated against JSON Schema Draft 2020-12 prior to execution. Validates shot order (1–10), required Amharic narration, timing boundaries (60–90s total), and camera motion vectors.
* **Deterministic Parameterization:** Camera directions (`zoom_in`, `pan_left`, `static_hold`), seeds, and visual tags are declared declaratively without any hardcoded logic in the Python code.

---

## 4. Pipeline Stages & Production Tools

| Stage | Tool / Model | Technical Role | Input / Output |
| :--- | :--- | :--- | :--- |
| **1. Storyboard** | **Draft 2020-12 JSON Schema** | Central production contract and validation gate. | `storyboard.json` $\to$ validated runtime state |
| **2. Narration** | **Gemini 2.5 Flash TTS** (`am-ET-Standard-B`) | Authentic Amharic first-person narration. 21s pacing. | Amharic text $\to$ `assets/narration/` (WAV) |
| **3. Keyframes** | **FLUX.1-schnell** (Hugging Face) | Photorealistic historical and modern keyframes. | Prompts $\to$ `assets/keyframes/` (1024×1024 PNG) |
| **4. Video Motion** | **Wan 2.2 720p** (Kaggle T4) | Image-to-video motion dynamics (73 frames @ 24fps). | Keyframes $\to$ `assets/video/` (MP4) |
| **5. Soundtrack** | **ACE-Step 1.5** | Melancholic traditional Ethiopian krar/masenqo pentatonic score. | Timing/mood $\to$ `assets/music/` (MP4/WAV) |
| **6. Assembly** | **FFmpeg + Pillow** | Temporal extension, sidechain ducking (-12dB), EBU R128 mastering, ASS subtitles, dual-aspect exports. | Assets $\to$ `outputs/vertical/` & `outputs/horizontal/` |

---

## 5. Audio & Visual Signal Processing Architecture

```mermaid
flowchart TD
    subgraph Audio_Processing ["Audio Signal Flow (Broadcast Mastering)"]
        Voice["Amharic Voiceover Track"]
        Music["ACE-Step Music Track"]
        Voice -->|"Sidechain Trigger"| SC["sidechaincompress<br/>-12 dB ducking, 300ms attack, 1500ms release"]
        Music --> SC
        SC --> Mix["amix=inputs=2:duration=first"]
        Mix --> Loudnorm["2-Pass loudnorm<br/>I=-14.0 LUFS, TP=-1.0 dBTP, LRA=7.0 LU"]
    end

    subgraph Video_Processing ["Dual-Aspect Video Adaptation"]
        Square["1080x1080 Source Clip"]
        Square -->|"split"| FG["Foreground: 1080x1080 Center (Sharp)"]
        Square -->|"split"| BG["Background: scale=1920:1080, gblur=sigma=36"]
        BG -->|"overlay"| Horiz["16:9 Horizontal Master (1920x1080)"]
        FG -->|"overlay"| Horiz
        Square -->|"crop=607:1080, scale=1080:1920"| Vert["9:16 Vertical Master (1080x1920)"]
    end
```

---

## 6. Reproducibility, Caching & Telemetry
1. **Input-Hash Caching:** SHA-256 signatures of prompts, seeds, and durations. If unchanged, generation is bypassed in **0.15s**.
2. **Structured Execution Logging (`runs.jsonl`):** Records timestamp, stage, latency, parameters, and cache hit/miss status for every model invocation.
3. **Single-Command Entry Point:** `python make_film.py` runs validation, checks cache, and builds both aspect ratios end-to-end.
