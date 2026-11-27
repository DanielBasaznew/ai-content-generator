export interface ShotData {
  shot_id: string;
  order: number;
  duration_seconds: number;
  visual_description: string;
  camera: {
    movement: string;
    framing: string;
    focal_length_hint: string;
  };
  prompt: string;
  narration: {
    am: string;
    en: string;
  };
  keyframe_url: string;
}

export const FILM_METADATA = {
  title: "The Monument That Lives in My Memory",
  subtitle: "An AI-Assisted Ethiopian Heritage Short Film",
  location: "Harar, Ethiopia",
  duration: "1:23 (83.0s)",
  author: "Daniel Basaznew",
  aspect_ratios: ["Vertical 9:16", "Horizontal 16:9"],
  languages: ["Amharic Narration", "English Subtitles"],
  total_shots: 10,
  total_cost: "$0.00 (Free Tiers & Kaggle Quota)",
  target_loudness: "-14.0 LUFS (EBU R128 Compliant)",
  central_message: "Physical landmarks may disappear, but the memories and cultural heritage connected to them remain.",
  summary: "Growing up in Harar, Ethiopia, passing the Ras Makonnen bronze equestrian statue was tied to childhood joy and family trips. Returning home in 2026 after university, I found the monument gone—having been demolished in 2020 while I was away. This film explores memory, heritage loss, and emotional resilience.",
  videos: {
    vertical: "/outputs/vertical/harar_monument_vertical_9x16.mp4",
    horizontal: "/outputs/horizontal/harar_monument_horizontal_16x9.mp4"
  }
};

export const SHOTS: ShotData[] = [
  {
    shot_id: "shot-01",
    order: 1,
    duration_seconds: 7.0,
    visual_description: "Establishing shot of ancient Harar Jugol wall bathed in early morning golden light.",
    camera: { movement: "Slow tilt-down", framing: "Wide shot", focal_length_hint: "28mm wide" },
    prompt: "Cinematic establishing shot of the ancient Harar Jugol stone wall at sunrise, warm golden light spilling over ancient limestone textured walls, narrow historic alleyway, quiet peaceful morning atmosphere.",
    narration: {
      am: "የልጅነት ትዝታዎቼ የሚጀምሩት በሐረር ከተማ፣ በጠባቦቹ የጁጎል ጎዳናዎች እና በጥንታዊው ግንብ ጥላ ስር ነው።",
      en: "My childhood memories begin in Harar, within the narrow alleys of Jugol and beneath the shadow of its ancient walls."
    },
    keyframe_url: "/assets/keyframes/shot-01.png"
  },
  {
    shot_id: "shot-02",
    order: 2,
    duration_seconds: 6.5,
    visual_description: "Busy morning street outside Jugol gate with horse carts and school children.",
    camera: { movement: "Slow lateral tracking right", framing: "Medium wide", focal_length_hint: "35mm" },
    prompt: "Vibrant morning scene outside the historic Harar city gate, horse cart moving along gravel street, Ethiopian children in retro school clothes walking together, dust motes in golden light.",
    narration: {
      am: "ጠዋት ወደ ትምህርት ቤት ስንሄድ ከተማዋ በፈረስ ጋሪዎች ድምፅ እና በሰዎች እንቅስቃሴ ትነቃቃ ነበር።",
      en: "In the morning as we walked to school, the city would awaken to the clip-clop of horse carts and bustling morning life."
    },
    keyframe_url: "/assets/keyframes/shot-02.png"
  },
  {
    shot_id: "shot-03",
    order: 3,
    duration_seconds: 7.5,
    visual_description: "Young child looking up in awe at the silhouette of Ras Makonnen statue.",
    camera: { movement: "Low-angle gentle upward tilt", framing: "Medium close-up", focal_length_hint: "50mm portrait" },
    prompt: "Low angle view of an 8-year-old Ethiopian boy looking upward with eyes filled with wonder, soft warm rim lighting, the silhouette of a grand bronze equestrian monument towering above against blue morning sky.",
    narration: {
      am: "በክቡ አደባባይ መሃል የቆመው የራስ መኮንን ሐውልት ለኔ የከተማዋ ትልቁ እና ግርማ ሞገስ ያለው ምልክት ነበር።",
      en: "Standing in the center of the roundabout, the Ras Makonnen statue was to me the grandest symbol of our city."
    },
    keyframe_url: "/assets/keyframes/shot-03.png"
  },
  {
    shot_id: "shot-04",
    order: 4,
    duration_seconds: 8.0,
    visual_description: "Majestic view of the Ras Makonnen bronze equestrian monument at the roundabout.",
    camera: { movement: "Slow circular arc around statue", framing: "Medium shot", focal_length_hint: "35mm" },
    prompt: "Majestic bronze equestrian statue of Ras Makonnen on a stone pedestal at a bustling roundabout in Harar, horse rearing with dignified strength, warm daylight, 1990s retro cinematic film grain.",
    narration: {
      am: "ያንን ሐውልት ማለፍ ሁሌም ደስታ ነበር—አዲስ ልብስ ለመግዛት፣ ወይም ከቤተሰብ ጋር ወደ ከተማ ለመውጣት ምልክት።",
      en: "Passing that monument always meant joy—a trip to buy new holiday clothes, or a special outing with family."
    },
    keyframe_url: "/assets/keyframes/shot-04.png"
  },
  {
    shot_id: "shot-05",
    order: 5,
    duration_seconds: 8.0,
    visual_description: "Child watching family celebrate by the roundabout.",
    camera: { movement: "Gentle push-in", framing: "Medium shot", focal_length_hint: "40mm" },
    prompt: "Warm nostalgic scene of an Ethiopian family in traditional attire smiling together by the roadside near the roundabout, young boy holding parent's hand, golden afternoon sun, cinematic warmth.",
    narration: {
      am: "በየበዓሉ ቀን ከቤተሰቦቼ ጋር በሐውልቱ አጠገብ ስናልፍ የተሰማኝ ደስታ ዛሬም በልቤ ውስጥ ትኩስ ነው።",
      en: "On every holiday, passing by the monument with my family brought an excitement that remains fresh in my heart today."
    },
    keyframe_url: "/assets/keyframes/shot-05.png"
  },
  {
    shot_id: "shot-06",
    order: 6,
    duration_seconds: 8.5,
    visual_description: "Young adult leaving Harar on an intercity bus, looking out window.",
    camera: { movement: "Static with motion outside window", framing: "Close-up", focal_length_hint: "50mm" },
    prompt: "Reflective close-up of a young Ethiopian adult looking through a bus window, landscape moving in reflection, soft melancholic cool lighting, suitcase beside seat, departing hometown for university.",
    narration: {
      am: "ጊዜው ነጎደ፣ የሁለተኛ ደረጃ ትምህርቴን ጨርሼ ለከፍተኛ ትምህርት ወደ አዳማ እና አዲስ አበባ ተጓዝኩ።",
      en: "Years flew by. After finishing school, I left for higher education in Adama and Addis Ababa."
    },
    keyframe_url: "/assets/keyframes/shot-06.png"
  },
  {
    shot_id: "shot-07",
    order: 7,
    duration_seconds: 8.0,
    visual_description: "Passing years in busy universities in Adama and Addis Ababa.",
    camera: { movement: "Time-lapse style push through crowd", framing: "Wide shot", focal_length_hint: "24mm" },
    prompt: "Atmospheric montage of modern university buildings in Addis Ababa, students walking with books, evening streetlights turning on, passing of five collegiate years away from hometown.",
    narration: {
      am: "አምስት ዓመታት ከሐረር ርቄ ብቆይም፣ የልጅነት ትዝታዎቼ እና ያ ታላቅ ሐውልት ከአእምሮዬ አልጠፉም።",
      en: "Though I spent five years away from Harar, my childhood memories and that grand monument never faded from my mind."
    },
    keyframe_url: "/assets/keyframes/shot-07.png"
  },
  {
    shot_id: "shot-08",
    order: 8,
    duration_seconds: 9.0,
    visual_description: "Returning adult arriving at the roundabout, approaching with anticipation.",
    camera: { movement: "Eye-level forward tracking", framing: "Medium shot", focal_length_hint: "35mm" },
    prompt: "Young Ethiopian man in modern jacket walking back toward the familiar roundabout in Harar, overcast contemplative afternoon sky, anticipating the sight of his childhood landmark.",
    narration: {
      am: "ከብዙ ዓመታት በኋላ በታላቅ ናፍቆት ወደ ሐረር ተመለስኩ—ወደ አደባባዩም ፈጥኜ አመራሁ።",
      en: "Years later, filled with deep longing, I finally returned to Harar—and hurried to the familiar roundabout."
    },
    keyframe_url: "/assets/keyframes/shot-08.png"
  },
  {
    shot_id: "shot-09",
    order: 9,
    duration_seconds: 9.0,
    visual_description: "The empty pedestal at the roundabout with modern traffic flowing past.",
    camera: { movement: "Slow panoramic tilt from empty pedestal to sky", framing: "Wide shot", focal_length_hint: "28mm" },
    prompt: "Poignant wide view of the roundabout in Harar where the monument once stood, an empty bare stone pedestal under overcast grey sky, cars and Bajaj three-wheelers driving past, sense of absence and emptiness.",
    narration: {
      am: "ነገር ግን ሐውልቱ በቦታው አልነበረም። የቆመበት መደላደል ባዶ ሆኖ ሳይ፣ ልቤ በድንጋጤ እና በሐዘን ተሞላ።",
      en: "But the monument was gone. Seeing the empty pedestal where it once stood, my heart filled with sudden sorrow."
    },
    keyframe_url: "/assets/keyframes/shot-09.png"
  },
  {
    shot_id: "shot-10",
    order: 10,
    duration_seconds: 8.5,
    visual_description: "Reflective look at the Harar city wall at twilight, memory persisting.",
    camera: { movement: "Slow pull-back to twilight sky", framing: "Wide shot", focal_length_hint: "35mm" },
    prompt: "Poetic twilight view of Harar's historic Jugol wall under a deep indigo sky with warm lantern glow in windows, peaceful reflective atmosphere, enduring cultural spirit.",
    narration: {
      am: "ቅርሶች በድንጋይ እና በነሐስ ቢፈርሱም፣ በልባችን ውስጥ የተቀረጹት የልጅነት ትዝታዎች ግን ለዘላለም ይኖራሉ።",
      en: "Though physical monuments of stone and bronze may fall, the memories carved in our hearts live forever."
    },
    keyframe_url: "/assets/keyframes/shot-10.png"
  }
];

export interface RawClipData {
  shot_id: string;
  order: number;
  clip_path: string;
  keyframe_path: string;
  resolution: string;
  num_frames: number;
  fps: number;
  seed: number;
  gpu_inference_min: number;
  peak_vram_gb: number;
  title: string;
  prompt: string;
  camera: string;
  story_beat: string;
}

export const RAW_CLIPS: RawClipData[] = [
  {
    shot_id: "shot-01",
    order: 1,
    clip_path: "/assets/clips/shot-01.mp4",
    keyframe_path: "/assets/keyframes/shot-01.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3001,
    gpu_inference_min: 7.14,
    peak_vram_gb: 12.91,
    title: "Ancient Jugol Stone Wall",
    prompt: "Cinematic establishing shot of the ancient Harar Jugol stone wall at sunrise, warm golden light spilling over textured walls.",
    camera: "Slow tilt-down • Wide shot",
    story_beat: "Introduction to Harar"
  },
  {
    shot_id: "shot-02",
    order: 2,
    clip_path: "/assets/clips/shot-02.mp4",
    keyframe_path: "/assets/keyframes/shot-02.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3002,
    gpu_inference_min: 8.07,
    peak_vram_gb: 12.91,
    title: "Morning Streets & Horse Carts",
    prompt: "Vibrant morning scene outside the historic Harar city gate, horse cart moving along gravel street, school children in retro uniforms.",
    camera: "Lateral tracking right • Medium wide",
    story_beat: "Morning Awakening"
  },
  {
    shot_id: "shot-03",
    order: 3,
    clip_path: "/assets/clips/shot-03.mp4",
    keyframe_path: "/assets/keyframes/shot-03.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3013,
    gpu_inference_min: 7.80,
    peak_vram_gb: 12.91,
    title: "Child's Wonder at the Monument",
    prompt: "Low angle view of 8-year-old Ethiopian boy looking upward with eyes filled with wonder at the silhouette of Ras Makonnen statue.",
    camera: "Low-angle gentle tilt-up • Medium close-up",
    story_beat: "Monument Discovery"
  },
  {
    shot_id: "shot-04",
    order: 4,
    clip_path: "/assets/clips/shot-04.mp4",
    keyframe_path: "/assets/keyframes/shot-04.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3014,
    gpu_inference_min: 7.63,
    peak_vram_gb: 12.91,
    title: "Majestic Bronze Equestrian Statue",
    prompt: "Majestic bronze equestrian statue of Ras Makonnen on stone pedestal at bustling roundabout in Harar, horse rearing with dignified strength.",
    camera: "Slow circular arc • Medium shot",
    story_beat: "Symbol of the City"
  },
  {
    shot_id: "shot-05",
    order: 5,
    clip_path: "/assets/clips/shot-05.mp4",
    keyframe_path: "/assets/keyframes/shot-05.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3005,
    gpu_inference_min: 7.85,
    peak_vram_gb: 12.91,
    title: "Family Celebration by the Monument",
    prompt: "Warm nostalgic scene of Ethiopian family in traditional attire smiling together by the roadside near the roundabout, golden afternoon sun.",
    camera: "Gentle push-in • Medium shot",
    story_beat: "Holiday Celebration"
  },
  {
    shot_id: "shot-06",
    order: 6,
    clip_path: "/assets/clips/shot-06.mp4",
    keyframe_path: "/assets/keyframes/shot-06.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3006,
    gpu_inference_min: 7.87,
    peak_vram_gb: 12.91,
    title: "Leaving for University (Departure)",
    prompt: "Reflective close-up of young Ethiopian adult looking through bus window, landscape moving in reflection, departure for higher education.",
    camera: "Static with window reflection • Close-up",
    story_beat: "Departure for Studies"
  },
  {
    shot_id: "shot-07",
    order: 7,
    clip_path: "/assets/clips/shot-07.mp4",
    keyframe_path: "/assets/keyframes/shot-07.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3007,
    gpu_inference_min: 7.91,
    peak_vram_gb: 12.91,
    title: "Passing Years in University",
    prompt: "Atmospheric montage of modern university buildings in Addis Ababa, passing of five collegiate years away from hometown.",
    camera: "Time-lapse style crowd push • Wide shot",
    story_beat: "Years in University"
  },
  {
    shot_id: "shot-08",
    order: 8,
    clip_path: "/assets/clips/shot-08.mp4",
    keyframe_path: "/assets/keyframes/shot-08.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3008,
    gpu_inference_min: 7.71,
    peak_vram_gb: 12.91,
    title: "Returning Home to Harar (2026)",
    prompt: "Young Ethiopian adult in modern jacket walking back toward the familiar roundabout in Harar, overcast contemplative afternoon sky.",
    camera: "Eye-level forward tracking • Medium shot",
    story_beat: "Return to Harar"
  },
  {
    shot_id: "shot-09",
    order: 9,
    clip_path: "/assets/clips/shot-09.mp4",
    keyframe_path: "/assets/keyframes/shot-09.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3019,
    gpu_inference_min: 7.62,
    peak_vram_gb: 12.91,
    title: "The Empty Pedestal (The Reality)",
    prompt: "Poignant wide view of roundabout where monument once stood, an empty bare stone pedestal under grey sky, cars and Bajaj driving past.",
    camera: "Slow panoramic tilt from plinth to sky • Wide shot",
    story_beat: "The Empty Pedestal"
  },
  {
    shot_id: "shot-10",
    order: 10,
    clip_path: "/assets/clips/shot-10.mp4",
    keyframe_path: "/assets/keyframes/shot-10.png",
    resolution: "512x512 (480p)",
    num_frames: 73,
    fps: 24,
    seed: 3020,
    gpu_inference_min: 7.61,
    peak_vram_gb: 12.91,
    title: "Twilight Reflection & Enduring Memory",
    prompt: "Poetic twilight view of historic Jugol wall under deep indigo sky with warm lantern glow in windows, enduring cultural spirit.",
    camera: "Slow pull-back to twilight sky • Wide shot",
    story_beat: "Enduring Memory"
  }
];

export const RUBRIC_CRITERIA = [
  {
    id: "engineering",
    title: "Software Engineering & Reproducibility",
    points: 20,
    description: "Strict JSON Schema Draft 2020-12 contract, zero secrets in repo, SHA-256 caching between stages, and a single reproduction command.",
    evidence: [
      { label: "Contract Schema", path: "/schema/storyboard.schema.json", detail: "Enforces exact types, 10 shots, 80s timeline, camera moves" },
      { label: "Deterministic Assembly", path: "/pipeline/assembly.py", detail: "Dual-aspect rendering, sidechain ducking, EBU R128 loudness" },
      { label: "1-Command Rebuild", command: "python -m pipeline.assembly", detail: "Validated sub-second cache replay (0.15s)" }
    ]
  },
  {
    id: "documentation",
    title: "Documentation & Architecture",
    points: 10,
    description: "Comprehensive documentation explaining the system architecture, design intentions, and stage-by-stage pipelines.",
    evidence: [
      { label: "Architecture Guide", path: "/ARCHITECTURE.md", detail: "Visual stage flowchart, CLI roles, input/output artifacts" },
      { label: "Design Blueprint", path: "/DESIGN.md", detail: "Target audience segments, ethical boundaries, emotional arc" },
      { label: "Comprehensive Report", path: "/REPORT.md", detail: "Full narrative reflection addressing all 6 rubric areas" }
    ]
  },
  {
    id: "audience",
    title: "Design Thinking & Audience Testing",
    points: 10,
    description: "Two complete user testing cycles with at least 3 participants from the target audience, with documented evidence.",
    evidence: [
      { label: "Audience Test 1 (Radio Cut)", path: "/docs/AUDIENCE_TEST_1.md", detail: "Tested 80s Amharic narration pacing before generating visuals" },
      { label: "Audience Test 2 (Near-Final Cut)", path: "/docs/AUDIENCE_TEST_2.md", detail: "Tested ducking, subtitles, emotional contrast with 3 viewers" }
    ]
  },
  {
    id: "experimentation",
    title: "Experimentation & Iteration",
    points: 10,
    description: "11 logged generation experiments each with hypothesis, change, and observed result across FLUX, Wan 2.2, ACE-Step, and FFmpeg.",
    evidence: [
      { label: "Experiments Log", path: "/EXPERIMENTS.md", detail: "EXP-001 through EXP-011 covering prompt tuning and video loops" },
      { label: "Runs Telemetry", path: "/runs.jsonl", detail: "46 model API calls with exact seeds, latencies, and parameters" }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & Persistence",
    points: 10,
    description: "10 documented real blockers (quota, clip extension, zoompan counter, subtitle wrapping, gradient banding) and exact fixes.",
    evidence: [
      { label: "Failures Log", path: "/FAILURES.md", detail: "FAIL-001 through FAIL-010 with symptoms, root causes, and resolutions" }
    ]
  },
  {
    id: "measurement",
    title: "Measurement & Cost Tracking",
    points: 5,
    description: "Measured latency, GPU time, free-tier limits, list-price equivalent, and zero net expenditure.",
    evidence: [
      { label: "Costs Log", path: "/COSTS.md", detail: "Per-stage GPU minutes, token counts, and cloud quota accounting" }
    ]
  },
  {
    id: "ceiling",
    title: "Curiosity Beyond the Floor (Ceiling Work)",
    points: 10,
    description: "Advanced engineering beyond the baseline requirements: dual-aspect ratio rendering, broadcast audio mastering, and interactive showcase.",
    evidence: [
      { label: "Dual-Aspect Pipeline", path: "/pipeline/assembly.py", detail: "Simultaneous 9:16 vertical crop + 16:9 ambient motion wings" },
      { label: "Sidechain Ducking", path: "/pipeline/assembly.py", detail: "Dynamic -12dB voice ducking + 2-pass EBU R128 (-14 LUFS)" },
      { label: "Interactive Web Portal", path: "/web", detail: "Next.js showcase with Memory Slider and Reviewer Evidence Map" }
    ]
  }
];

export const TELEMETRY_STATS = {
  total_runs: 46,
  successful_calls: 46,
  cache_hits: 12,
  cache_rate_percent: 26,
  documented_experiments: 11,
  documented_failures: 10,
  passing_unit_tests: 42,
  total_spent_dollars: 0.00,
  stages: [
    { name: "Storyboard Contract", status: "PASS", tests: 4, latency: "0.05s", model: "JSON Schema 2020-12", cost: "$0.00" },
    { name: "Narration TTS", status: "PASS", tests: 4, latency: "3.40s", model: "Edge-TTS (Amharic)", cost: "$0.00" },
    { name: "Character & Style References", status: "PASS", tests: 4, latency: "18.2s", model: "Cloudflare FLUX.1", cost: "$0.00" },
    { name: "Shot Keyframes", status: "PASS", tests: 4, latency: "42.6s", model: "Cloudflare FLUX.1", cost: "$0.00" },
    { name: "Moving Video Clips", status: "PASS", tests: 4, latency: "~28 min", model: "Kaggle Wan 2.2 TI2V-5B", cost: "$0.00" },
    { name: "Original Music Score", status: "PASS", tests: 4, latency: "~6 min", model: "Kaggle ACE-Step 1.5", cost: "$0.00" },
    { name: "FFmpeg Dual Assembly", status: "PASS", tests: 4, latency: "459.8s", model: "FFmpeg 9.1 (libx264/aac)", cost: "$0.00" }
  ]
};
