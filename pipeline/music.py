"""Stage: Generate Step 9 original instrumental music candidates via ACE-Step 1.5 on Kaggle."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Any

from pipeline.common import (
    ROOT_DIR,
    append_run_log,
    compute_hash,
    get_ffmpeg_exe,
    load_cache,
    load_storyboard,
    measure_wav_duration,
    save_cache,
    save_storyboard,
    validate_storyboard,
)
from pipeline.video import authenticate_kaggle_api

MUSIC_DIR = ROOT_DIR / "assets" / "music"
CANDIDATES_DIR = MUSIC_DIR / "candidates"
AUDITIONS_DIR = MUSIC_DIR / "auditions"
CACHE_PATH = MUSIC_DIR / "music_cache.json"

DEFAULT_ACESTEP_MODEL = "ACE-Step/Ace-Step1.5 (acestep-v15-turbo + acestep-5Hz-lm-1.7B)"
DEFAULT_DIT_CONFIG = "acestep-v15-turbo"
DEFAULT_LM_MODEL = "acestep-5Hz-lm-1.7B"
DEFAULT_INFERENCE_STEPS = 8
DEFAULT_SHIFT = 3.0
DEFAULT_TARGET_DURATION = 83.0  # 80.0s 10-shot timeline + 3.0s AI disclosure end card

# 4 instrumental underscore candidates varying tempo, key, timbre, and continuous vs 2-part arc.
MUSIC_CANDIDATE_SPECS: list[dict[str, Any]] = [
    {
        "candidate_id": "cand_01_felt_piano_strings",
        "title": "Felt Piano & Warm Chamber Cello",
        "kind": "single",
        "bpm": 72,
        "keyscale": "D Minor",
        "timesignature": "4",
        "duration": 84.0,
        "seed": 4001,
        "caption": (
            "Intimate minimal documentary film score, warm soft felt piano arpeggios and gentle sustained chamber cello, "
            "spacious uncluttered midrange leaving clear room for spoken narration, nostalgic warmth easing into tender longing "
            "and peaceful resolution, pure instrumental underscore, no percussion, no vocals"
        ),
        "lyrics": "[Instrumental]",
        "instrumental": True,
    },
    {
        "candidate_id": "cand_02_acoustic_plucked_theme",
        "title": "Ethiopian-Inspired Acoustic Plucked Strings & Piano",
        "kind": "single",
        "bpm": 78,
        "keyscale": "F Major",
        "timesignature": "4",
        "duration": 84.0,
        "seed": 4002,
        "caption": (
            "Warm reflective heritage film underscore, subtle East African pentatonic acoustic plucked harp and soft nylon guitar "
            "paired with gentle upright felt piano chords, warm nostalgic morning sunlight feeling softening into quiet contemplative calm, "
            "pure instrumental, no drums, no vocals, no chanting"
        ),
        "lyrics": "[Instrumental]",
        "instrumental": True,
    },
    {
        "candidate_id": "cand_03_chamber_piano_pad",
        "title": "Sparse Felt Piano & Airy String Pad",
        "kind": "single",
        "bpm": 66,
        "keyscale": "A Minor",
        "timesignature": "4",
        "duration": 84.0,
        "seed": 4003,
        "caption": (
            "Minimalist understated cinematic underscore, sparse delicate upright piano motifs over warm airy string pad swells, "
            "unhurried emotional restraint designed beneath calm voiceover, gentle melancholy softening into hopeful peaceful closure, "
            "pure instrumental, no drums, no singing"
        ),
        "lyrics": "[Instrumental]",
        "instrumental": True,
    },
    {
        "candidate_id": "cand_04_two_part_arc",
        "title": "Two-Movement Crossfaded Arc (Warmth -> Reflection)",
        "kind": "two_part",
        "bpm": 74,
        "keyscale": "C Major -> A Minor",
        "timesignature": "4",
        "duration": 84.0,
        "crossfade_seconds": 4.0,
        "segments": [
            {
                "segment_id": "cand_04_part_a",
                "bpm": 74,
                "keyscale": "C Major",
                "timesignature": "4",
                "duration": 44.0,
                "seed": 4004,
                "caption": (
                    "Warm hopeful childhood memory underscore, delicate acoustic nylon guitar fingerpicking and soft upright piano melody, "
                    "gentle sunlit Harar morning nostalgia, spacious open mix, pure instrumental, no percussion, no vocals"
                ),
                "lyrics": "[Instrumental]",
                "instrumental": True,
            },
            {
                "segment_id": "cand_04_part_b",
                "bpm": 74,
                "keyscale": "A Minor",
                "timesignature": "4",
                "duration": 44.0,
                "seed": 4005,
                "caption": (
                    "Tender reflective felt piano and soft sustained cello in relative minor shifting gently toward a peaceful warm major cadence, "
                    "calm contemplative acceptance without dramatic percussion, pure instrumental underscore, no vocals"
                ),
                "lyrics": "[Instrumental]",
                "instrumental": True,
            },
        ],
    },
]


def _flatten_generation_jobs(specs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Expand candidate specs (including two-part segments) into individual ACE-Step generation jobs."""
    jobs: list[dict[str, Any]] = []
    for spec in specs:
        if spec.get("kind") == "two_part":
            for seg in spec["segments"]:
                jobs.append({"candidate_id": spec["candidate_id"], **seg, "job_id": seg["segment_id"]})
        else:
            jobs.append({**spec, "job_id": spec["candidate_id"]})
    return jobs


def _build_acestep_worker_script(
    jobs: list[dict[str, Any]],
    *,
    dit_config: str,
    lm_model: str,
    inference_steps: int,
    shift: float,
) -> str:
    """Render self-contained Kaggle GPU worker script for ACE-Step 1.5 music generation."""
    jobs_json = json.dumps(jobs, ensure_ascii=False)
    return f'''import gc
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

OUT_DIR = Path("/kaggle/working")
OUT_DIR.mkdir(parents=True, exist_ok=True)
REPO_DIR = Path("/tmp/ace_step_repo")
CKPT_DIR = REPO_DIR / "checkpoints"

if not REPO_DIR.exists():
    subprocess.check_call(["git", "clone", "--depth", "1", "https://github.com/ACE-Step/ACE-Step-1.5.git", str(REPO_DIR)])

# Install ACE-Step lightweight runtime packages without overwriting Kaggle's CUDA PyTorch build.
pkgs = [
    "transformers>=4.51.0,<4.58.0",
    "diffusers>=0.37.0,<0.39.0",
    "accelerate>=1.12.0",
    "loguru",
    "soundfile",
    "scipy",
    "einops",
    "vector-quantize-pytorch>=1.27.15",
    "pywavelets",
    "numba",
    "modelscope",
    "toml",
    "PyYAML",
]
try:
    import torchaudio  # noqa: F401
except Exception:
    pkgs.append("torchaudio")
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *pkgs])
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "--no-deps", "--ignore-requires-python", "-e", str(REPO_DIR)])

sys.path.insert(0, str(REPO_DIR))

from huggingface_hub import snapshot_download
import torch
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationConfig, GenerationParams, generate_music

t_dl0 = time.perf_counter()
CKPT_DIR.mkdir(parents=True, exist_ok=True)
snapshot_download(repo_id="ACE-Step/Ace-Step1.5", local_dir=str(CKPT_DIR))
dl_seconds = round(time.perf_counter() - t_dl0, 2)
print(f"Downloaded ACE-Step1.5 checkpoints in {{dl_seconds}}s")

t_init0 = time.perf_counter()
dit_handler = AceStepHandler()
dit_status, dit_ok = dit_handler.initialize_service(
    project_root=str(REPO_DIR),
    config_path={json.dumps(dit_config)},
    device="cuda",
    offload_to_cpu=False,
)
print("DiT init:", dit_ok, dit_status)
if not dit_ok:
    raise RuntimeError(f"DiT initialization failed: {{dit_status}}")

llm_handler = LLMHandler()
llm_status, llm_ok = llm_handler.initialize(
    checkpoint_dir=str(CKPT_DIR),
    lm_model_path={json.dumps(lm_model)},
    backend="pt",
    device="cuda",
    offload_to_cpu=True,
)
print("LM init:", llm_ok, llm_status)
init_seconds = round(time.perf_counter() - t_init0, 2)

JOBS = json.loads({repr(jobs_json)})
INFERENCE_STEPS = {inference_steps}
SHIFT = {shift}

metrics = []
metrics_path = OUT_DIR / "music_metrics.json"
raw_save_dir = Path("/tmp/acestep_raw")
raw_save_dir.mkdir(parents=True, exist_ok=True)

for job in JOBS:
    jid = job["job_id"]
    use_thinking = bool(llm_ok)
    params = GenerationParams(
        task_type="text2music",
        caption=job["caption"],
        lyrics=job.get("lyrics", "[Instrumental]"),
        instrumental=bool(job.get("instrumental", True)),
        bpm=int(job["bpm"]),
        keyscale=str(job["keyscale"]),
        timesignature=str(job.get("timesignature", "4")),
        duration=float(job["duration"]),
        inference_steps=INFERENCE_STEPS,
        shift=SHIFT,
        seed=int(job["seed"]),
        use_cot_metas=False,
        use_cot_caption=False,
        use_cot_language=False,
        thinking=use_thinking,
        enable_normalization=True,
        normalization_db=-1.0,
    )
    cfg = GenerationConfig(
        batch_size=1,
        use_random_seed=False,
        seeds=[int(job["seed"])],
        audio_format="wav",
    )

    t0 = time.perf_counter()
    result = generate_music(dit_handler, llm_handler if use_thinking else None, params, cfg, save_dir=str(raw_save_dir))
    infer_seconds = round(time.perf_counter() - t0, 2)
    if not result.success or not result.audios:
        raise RuntimeError(f"ACE-Step failed on {{jid}}: {{result.error}} | {{result.status_message}}")

    audio_info = result.audios[0]
    src_path = Path(audio_info.get("path", ""))
    dst_path = OUT_DIR / f"{{jid}}.wav"
    if src_path.exists():
        shutil.copy2(src_path, dst_path)
    else:
        import soundfile as sf
        tensor = audio_info["tensor"].detach().cpu().numpy()
        if tensor.ndim == 2 and tensor.shape[0] <= 2:
            tensor = tensor.T
        sf.write(str(dst_path), tensor, int(audio_info.get("sample_rate", 48000)))

    try:
        peak_gb = round(torch.cuda.max_memory_allocated(0) / (1024 ** 3), 2)
    except Exception:
        peak_gb = 0.0

    rec = {{
        "job_id": jid,
        "candidate_id": job["candidate_id"],
        "seed": int(job["seed"]),
        "bpm": int(job["bpm"]),
        "keyscale": str(job["keyscale"]),
        "duration_requested": float(job["duration"]),
        "used_thinking_lm": use_thinking,
        "download_seconds": dl_seconds,
        "init_seconds": init_seconds,
        "inference_seconds": infer_seconds,
        "peak_vram_gb": peak_gb,
        "sample_rate": int(audio_info.get("sample_rate", 48000)),
        "file_size_bytes": dst_path.stat().st_size,
        "time_costs": (result.extra_outputs or {{}}).get("time_costs", {{}}),
    }}
    metrics.append(rec)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Generated {{jid}}:", rec)
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

print("ALL MUSIC JOBS COMPLETED:", len(metrics))
'''


def _run_ffmpeg(cmd: list[str]) -> str:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg command failed ({' '.join(cmd[:6])}): {res.stderr[-500:]}")
    return res.stderr


def _analyze_wav_metrics(ffmpeg_exe: str, wav_path: Path) -> dict[str, Any]:
    """Measure exact duration, sample rate, mean volume, max volume, and integrated LUFS."""
    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        ch = wf.getnchannels()
        dur = round(wf.getnframes() / float(sr), 3)

    stderr = _run_ffmpeg([ffmpeg_exe, "-i", str(wav_path), "-af", "volumedetect,ebur128", "-f", "null", "-"])
    mean_m = re.findall(r"mean_volume:\s*([-\d.]+)\s*dB", stderr)
    max_m = re.findall(r"max_volume:\s*([-\d.]+)\s*dB", stderr)
    lufs_m = re.findall(r"\bI:\s*([-\d.]+)\s*LUFS", stderr)
    lra_m = re.findall(r"\bLRA:\s*([-\d.]+)\s*LU", stderr)
    return {
        "duration_seconds": dur,
        "sample_rate_hz": sr,
        "channels": ch,
        "mean_volume_db": float(mean_m[-1]) if mean_m else None,
        "max_volume_db": float(max_m[-1]) if max_m else None,
        "integrated_lufs": float(lufs_m[-1]) if lufs_m else None,
        "loudness_range_lu": float(lra_m[-1]) if lra_m else None,
    }


def push_music_batch(
    *,
    root_dir: Path = ROOT_DIR,
    kernel_slug: str = "acestep-step9-candidates",
    dit_config: str = DEFAULT_DIT_CONFIG,
    lm_model: str = DEFAULT_LM_MODEL,
    inference_steps: int = DEFAULT_INFERENCE_STEPS,
    shift: float = DEFAULT_SHIFT,
    force: bool = False,
) -> dict[str, Any]:
    """Push Kaggle GPU notebook to generate uncached ACE-Step 1.5 music candidate jobs."""
    music_dir = root_dir / "assets" / "music"
    candidates_dir = music_dir / "candidates"
    cache_file = music_dir / "music_cache.json"
    candidates_dir.mkdir(parents=True, exist_ok=True)
    cache = load_cache(cache_file)

    all_jobs = _flatten_generation_jobs(MUSIC_CANDIDATE_SPECS)
    uncached_jobs: list[dict[str, Any]] = []
    cached_count = 0

    for job in all_jobs:
        jid = job["job_id"]
        out_wav = candidates_dir / f"{jid}.wav"
        payload = {
            "job_id": jid,
            "model": DEFAULT_ACESTEP_MODEL,
            "dit_config": dit_config,
            "lm_model": lm_model,
            "inference_steps": inference_steps,
            "shift": shift,
            **{k: job[k] for k in ("bpm", "keyscale", "timesignature", "duration", "seed", "caption", "lyrics", "instrumental")},
        }
        input_hash = compute_hash(payload)
        job["input_hash"] = input_hash
        cached_entry = cache.get(jid)
        if not force and cached_entry and cached_entry.get("input_hash") == input_hash and out_wav.exists() and out_wav.stat().st_size > 100_000:
            cached_count += 1
            continue
        uncached_jobs.append(job)

    if not uncached_jobs:
        return {"model": DEFAULT_ACESTEP_MODEL, "pushed": 0, "cached": cached_count, "jobs": [], "kernel": None}

    api, username = authenticate_kaggle_api(root_dir=root_dir)
    kernel_ref = f"{username}/{kernel_slug}"

    with tempfile.TemporaryDirectory() as tmp:
        k_dir = Path(tmp) / "kernel"
        k_dir.mkdir(parents=True, exist_ok=True)
        (k_dir / "acestep_worker.py").write_text(
            _build_acestep_worker_script(
                uncached_jobs,
                dit_config=dit_config,
                lm_model=lm_model,
                inference_steps=inference_steps,
                shift=shift,
            ),
            encoding="utf-8",
        )
        (k_dir / "kernel-metadata.json").write_text(
            json.dumps(
                {
                    "id": kernel_ref,
                    "title": kernel_slug.replace("-", " "),
                    "code_file": "acestep_worker.py",
                    "language": "python",
                    "kernel_type": "script",
                    "is_private": True,
                    "enable_gpu": True,
                    "enable_tpu": False,
                    "enable_internet": True,
                    "dataset_sources": [],
                    "competition_sources": [],
                    "kernel_sources": [],
                    "model_sources": [],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        api.kernels_push(str(k_dir), acc="NvidiaTeslaT4")

    return {
        "model": DEFAULT_ACESTEP_MODEL,
        "pushed": len(uncached_jobs),
        "cached": cached_count,
        "jobs": [j["job_id"] for j in uncached_jobs],
        "kernel": kernel_ref,
    }


def assemble_two_part_candidate(
    part_a: Path,
    part_b: Path,
    out_wav: Path,
    *,
    crossfade_seconds: float = 4.0,
    target_duration: float = 84.0,
) -> dict[str, Any]:
    """Crossfade two generated score movements cleanly into one stereo 48kHz WAV candidate."""
    ffmpeg_exe = get_ffmpeg_exe()
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(part_a),
            "-i",
            str(part_b),
            "-filter_complex",
            f"[0:a][1:a]acrossfade=d={crossfade_seconds:.2f}:c1=tri:c2=tri,atrim=0:{target_duration:.3f}[outa]",
            "-map",
            "[outa]",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(out_wav),
        ]
    )
    return _analyze_wav_metrics(ffmpeg_exe, out_wav)


def ingest_downloaded_music(
    source_dir: Path,
    *,
    kernel_ref: str = "danielbasaznew/acestep-step9-candidates",
    root_dir: Path = ROOT_DIR,
) -> dict[str, Any]:
    """Verify downloaded ACE-Step WAV files, build two-part track, cache, and log to runs.jsonl."""
    music_dir = root_dir / "assets" / "music"
    candidates_dir = music_dir / "candidates"
    cache_file = music_dir / "music_cache.json"
    runs_path = root_dir / "runs.jsonl"
    candidates_dir.mkdir(parents=True, exist_ok=True)
    cache = load_cache(cache_file)

    metrics_file = source_dir / "music_metrics.json"
    metrics_by_job = {
        m["job_id"]: m for m in (json.loads(metrics_file.read_text(encoding="utf-8")) if metrics_file.exists() else [])
    }

    ffmpeg_exe = get_ffmpeg_exe()
    jobs = _flatten_generation_jobs(MUSIC_CANDIDATE_SPECS)
    ingested = 0

    for job in jobs:
        jid = job["job_id"]
        src_wav = source_dir / f"{jid}.wav"
        if not src_wav.exists() or src_wav.stat().st_size < 100_000:
            raise FileNotFoundError(f"Missing or invalid ACE-Step audio output: {src_wav}")

        dst_wav = candidates_dir / f"{jid}.wav"
        shutil.copy2(src_wav, dst_wav)
        audio_stats = _analyze_wav_metrics(ffmpeg_exe, dst_wav)
        job_metrics = metrics_by_job.get(jid, {})

        payload = {
            "job_id": jid,
            "model": DEFAULT_ACESTEP_MODEL,
            "dit_config": DEFAULT_DIT_CONFIG,
            "lm_model": DEFAULT_LM_MODEL,
            "inference_steps": DEFAULT_INFERENCE_STEPS,
            "shift": DEFAULT_SHIFT,
            **{k: job[k] for k in ("bpm", "keyscale", "timesignature", "duration", "seed", "caption", "lyrics", "instrumental")},
        }
        cache[jid] = {
            "input_hash": compute_hash(payload),
            "candidate_id": job["candidate_id"],
            "model": DEFAULT_ACESTEP_MODEL,
            "seed": job["seed"],
            "bpm": job["bpm"],
            "keyscale": job["keyscale"],
            "output_path": str(dst_wav.relative_to(root_dir)).replace("\\", "/"),
            "generation_metrics": job_metrics,
            "audio_stats": audio_stats,
        }
        save_cache(cache_file, cache)

        append_run_log(
            {
                "stage": "music",
                "shot_id": jid,
                "provider": "kaggle_ace_step",
                "model": DEFAULT_ACESTEP_MODEL,
                "parameters": {
                    "dit_config": DEFAULT_DIT_CONFIG,
                    "lm_model": DEFAULT_LM_MODEL if job_metrics.get("used_thinking_lm", True) else None,
                    "bpm": job["bpm"],
                    "keyscale": job["keyscale"],
                    "duration_seconds": job["duration"],
                    "inference_steps": DEFAULT_INFERENCE_STEPS,
                    "shift": DEFAULT_SHIFT,
                    "instrumental": True,
                    "kaggle_kernel": kernel_ref,
                    "prompt_preview": job["caption"][:140],
                },
                "seed": job["seed"],
                "latency_seconds": job_metrics.get("inference_seconds", 0.0),
                "estimated_cost_usd": 0.0,
                "status": "success",
                "output_path": str(dst_wav.relative_to(root_dir)).replace("\\", "/"),
            },
            log_path=runs_path,
        )
        ingested += 1

    # Assemble combined cand_04_two_part_arc.wav from parts A and B
    for spec in MUSIC_CANDIDATE_SPECS:
        if spec.get("kind") == "two_part":
            cid = spec["candidate_id"]
            part_a = candidates_dir / f"{spec['segments'][0]['segment_id']}.wav"
            part_b = candidates_dir / f"{spec['segments'][1]['segment_id']}.wav"
            combined = candidates_dir / f"{cid}.wav"
            stats = assemble_two_part_candidate(
                part_a,
                part_b,
                combined,
                crossfade_seconds=float(spec["crossfade_seconds"]),
                target_duration=float(spec["duration"]),
            )
            cache[cid] = {
                "input_hash": compute_hash({"parts": [part_a.name, part_b.name], "xfade": spec["crossfade_seconds"]}),
                "candidate_id": cid,
                "model": DEFAULT_ACESTEP_MODEL,
                "seed": f"{spec['segments'][0]['seed']}+{spec['segments'][1]['seed']}",
                "bpm": spec["bpm"],
                "keyscale": spec["keyscale"],
                "output_path": str(combined.relative_to(root_dir)).replace("\\", "/"),
                "audio_stats": stats,
            }
            save_cache(cache_file, cache)

    return {"model": DEFAULT_ACESTEP_MODEL, "ingested": ingested, "kernel": kernel_ref}


def audition_candidates(
    *,
    root_dir: Path = ROOT_DIR,
    narration_wav: Path | None = None,
) -> list[dict[str, Any]]:
    """Mix every candidate softly under the Amharic radio cut with sidechain ducking for listening review."""
    ffmpeg_exe = get_ffmpeg_exe()
    music_dir = root_dir / "assets" / "music"
    candidates_dir = music_dir / "candidates"
    auditions_dir = music_dir / "auditions"
    auditions_dir.mkdir(parents=True, exist_ok=True)

    voice_path = narration_wav or (root_dir / "outputs" / "radio_cut" / "radio_cut_v1.wav")
    if not voice_path.exists():
        raise FileNotFoundError(f"Radio cut narration WAV required for auditioning: {voice_path}")

    report: list[dict[str, Any]] = []
    for spec in MUSIC_CANDIDATE_SPECS:
        cid = spec["candidate_id"]
        cand_wav = candidates_dir / f"{cid}.wav"
        if not cand_wav.exists():
            raise FileNotFoundError(f"Candidate score WAV missing: {cand_wav}")

        raw_stats = _analyze_wav_metrics(ffmpeg_exe, cand_wav)
        audition_mp3 = auditions_dir / f"audition_{cid}.mp3"

        # Match Appendix B ducking recipe: sidechaincompress threshold=0.02, ratio=6, attack=300ms, release=1500ms
        # Music trimmed/faded to 83.0s (80.0s voice + 3.0s end card), padded voice to 83.0s for fair auditioning.
        filter_complex = (
            "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
            "apad=whole_dur=83.000,asplit=2[voice_mix][voice_sc];"
            "[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
            "atrim=0:83.000,afade=t=in:st=0:d=0.8,afade=t=out:st=80.0:d=3.0,"
            "volume=-14dB[music_pre];"
            "[music_pre][voice_sc]sidechaincompress=threshold=0.02:ratio=6:attack=300:release=1500[music_ducked];"
            "[voice_mix][music_ducked]amix=inputs=2:duration=longest:normalize=0,"
            "loudnorm=I=-14:TP=-1:LRA=11[outa]"
        )
        _run_ffmpeg(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                str(voice_path),
                "-i",
                str(cand_wav),
                "-filter_complex",
                filter_complex,
                "-map",
                "[outa]",
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(audition_mp3),
            ]
        )
        report.append(
            {
                "candidate_id": cid,
                "title": spec["title"],
                "bpm": spec["bpm"],
                "keyscale": spec["keyscale"],
                "raw_wav": str(cand_wav.relative_to(root_dir)).replace("\\", "/"),
                "audition_mp3": str(audition_mp3.relative_to(root_dir)).replace("\\", "/"),
                "raw_stats": raw_stats,
            }
        )

    (music_dir / "audition_metrics.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def select_score(
    candidate_id: str,
    *,
    rationale: str,
    target_duration: float = DEFAULT_TARGET_DURATION,
    root_dir: Path = ROOT_DIR,
) -> dict[str, Any]:
    """Prepare selected score WAV to exact film duration (83.0s) and update storyboard.json."""
    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)

    spec = next((s for s in MUSIC_CANDIDATE_SPECS if s["candidate_id"] == candidate_id), None)
    if spec is None:
        raise ValueError(f"Unknown music candidate_id '{candidate_id}'")

    src_wav = root_dir / "assets" / "music" / "candidates" / f"{candidate_id}.wav"
    if not src_wav.exists():
        raise FileNotFoundError(f"Candidate WAV not found: {src_wav}")

    selected_wav = root_dir / "assets" / "music" / "selected_score.wav"
    ffmpeg_exe = get_ffmpeg_exe()
    fade_out_start = max(0.0, target_duration - 3.0)
    src_dur = measure_wav_duration(src_wav)
    if src_dur + 0.05 < target_duration:
        raise ValueError(f"Candidate {candidate_id} ({src_dur}s) is shorter than required {target_duration}s.")

    _run_ffmpeg(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(src_wav),
            "-af",
            (
                f"atrim=0:{target_duration:.3f},"
                "afade=t=in:st=0:d=0.8,"
                f"afade=t=out:st={fade_out_start:.3f}:d=3.0,"
                "loudnorm=I=-16:TP=-1:LRA=11"
            ),
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(selected_wav),
        ]
    )
    selected_stats = _analyze_wav_metrics(ffmpeg_exe, selected_wav)

    if spec.get("kind") == "two_part":
        seed_val = int(spec["segments"][0]["seed"])
        prompt_text = " | ".join(s["caption"] for s in spec["segments"])
    else:
        seed_val = int(spec["seed"])
        prompt_text = spec["caption"]

    storyboard["music_plan"] = {
        "provider": "kaggle_ace_step",
        "model": DEFAULT_ACESTEP_MODEL,
        "instrumental_only": True,
        "tempo_bpm": int(spec["bpm"]),
        "musical_key": str(spec["keyscale"]),
        "overall_prompt": prompt_text,
        "seed": seed_val,
        "audio_path": "assets/music/selected_score.wav",
        "extra_params": {
            "selected_candidate_id": candidate_id,
            "source_candidate_wav": f"assets/music/candidates/{candidate_id}.wav",
            "prepared_duration_seconds": selected_stats["duration_seconds"],
            "sample_rate_hz": selected_stats["sample_rate_hz"],
            "channels": selected_stats["channels"],
            "integrated_lufs": selected_stats["integrated_lufs"],
            "max_volume_db": selected_stats["max_volume_db"],
            "fade_in_seconds": 0.8,
            "fade_out_seconds": 3.0,
            "inference_steps": DEFAULT_INFERENCE_STEPS,
            "shift": DEFAULT_SHIFT,
            "audition_rationale": rationale,
        },
    }
    save_storyboard(storyboard, path=sb_path, schema_path=schema_path)
    return {"selected": candidate_id, "audio_path": "assets/music/selected_score.wav", "stats": selected_stats}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate and audition Step 9 ACE-Step 1.5 score candidates.")
    sub = parser.add_subparsers(dest="command", required=True)

    p_push = sub.add_parser("push", help="Submit uncached ACE-Step candidate batch to Kaggle GPU.")
    p_push.add_argument("--kernel-slug", default="acestep-step9-candidates")
    p_push.add_argument("--force", action="store_true")

    p_ingest = sub.add_parser("ingest", help="Ingest downloaded WAVs from Kaggle output directory.")
    p_ingest.add_argument("source_dir", type=Path)
    p_ingest.add_argument("--kernel-ref", default="danielbasaznew/acestep-step9-candidates")

    sub.add_parser("audition", help="Create sidechain-ducked narration + music audition mixes.")

    p_select = sub.add_parser("select", help="Prepare final 83.0s selected_score.wav and update storyboard.json.")
    p_select.add_argument("candidate_id")
    p_select.add_argument("--rationale", required=True)

    args = parser.parse_args()
    if args.command == "push":
        print(push_music_batch(kernel_slug=args.kernel_slug, force=args.force))
    elif args.command == "ingest":
        print(ingest_downloaded_music(args.source_dir, kernel_ref=args.kernel_ref))
    elif args.command == "audition":
        print(json.dumps(audition_candidates(), indent=2))
    elif args.command == "select":
        print(json.dumps(select_score(args.candidate_id, rationale=args.rationale), indent=2))


if __name__ == "__main__":
    main()
