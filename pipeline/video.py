"""Stage: Generate Step 8 moving video clips from keyframes using Wan 2.2 on Kaggle."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

from dotenv import dotenv_values

from pipeline.common import (
    ROOT_DIR,
    append_run_log,
    compute_hash,
    load_cache,
    load_storyboard,
    save_cache,
    save_storyboard,
    validate_storyboard,
)

CLIPS_DIR = ROOT_DIR / "assets" / "clips"
CACHE_PATH = CLIPS_DIR / "clips_cache.json"

DEFAULT_WAN_MODEL = "Wan-AI/Wan2.2-TI2V-5B-Diffusers"
DEFAULT_RESOLUTION = "480p"
DEFAULT_WIDTH = 512
DEFAULT_HEIGHT = 512
DEFAULT_FPS = 24
DEFAULT_NUM_FRAMES = 73  # 4 * 18 + 1 frames (~3.04s at 24 fps)
DEFAULT_STEPS = 25
DEFAULT_GUIDANCE_SCALE = 5.0
DEFAULT_DATASET_SLUG = "harar-monument-keyframes"

DEFAULT_NEGATIVE_VIDEO_PROMPT = (
    "static frozen image, sudden jump cut, erratic camera shake, warping buildings, "
    "flickering textures, distorted faces, extra limbs, three legs, extra fingers, "
    "morphing clothes, blurry, overlaid text, watermark, subtitles"
)

# Motion-and-camera-only instructions per shot (subject and scenery stay anchored to Step 7 keyframes).
SHOT_MOTION_PROMPTS: dict[str, dict[str, str]] = {
    "shot-01": {
        "motion_prompt": (
            "Gentle slow forward dolly camera moving into the sunlit quiet Harar residential lane, "
            "subtle dust motes drifting softly in warm morning light rays, delicate leaf movement in gentle breeze, "
            "smooth natural continuous cinema motion."
        ),
        "extra_negative": "people suddenly appearing, camera whip",
    },
    "shot-02": {
        "motion_prompt": (
            "Smooth slow cinematic pan right across the sunlit Harar roundabout, green shade tree leaves "
            "swaying gently in warm daylight breeze, soft golden atmospheric haze drifting smoothly, "
            "distant stone pedestal monument remaining calm and steady."
        ),
        "extra_negative": "readable text appearing, sudden zooming, camera tilt",
    },
    "shot-03": {
        "motion_prompt": (
            "Slow steady forward camera glide from behind at walking pace, the child in the center and two parents "
            "walking calmly forward along the tree-lined sidewalk while keeping clean separation and natural two-legged stride, "
            "gentle morning foliage breeze overhead, stable lighting without flares."
        ),
        "extra_negative": "three legs, merged limbs, extra limbs, orange flare blob, popping objects, crowded passersby, turning faces toward camera",
    },
    "shot-04": {
        "motion_prompt": (
            "Very gentle subtle forward dolly push-in, the smiling child keeps eyes clearly open and warm expression steady "
            "with soft natural breathing while holding the brown paper parcel calmly in both hands, clean balanced natural daylight without lens flare."
        ),
        "extra_negative": "lens flare, hazy washout, overexposed glow, squinting, closed distorted eyes, extra fingers, deforming parcel, fast head turn",
    },
    "shot-05": {
        "motion_prompt": (
            "Smooth slow pan left with subtle drifting evening breeze rustling hillside grasses and fabric lightly, "
            "the young adult seen from behind pausing quietly looking toward distant Harar hills in soft late-afternoon warmth."
        ),
        "extra_negative": "car rushing across frame, rapid turning, floating artifacts",
    },
    "shot-06": {
        "motion_prompt": (
            "Slow gentle backward dolly pull-out inside the quiet university study room, distant evening city lights "
            "twinkling softly beyond the window pane, subtle warm desk lamp glow, the seated student blinking softly "
            "and breathing calmly beside blank open notebooks."
        ),
        "extra_negative": "text appearing on paper, glowing screen distortion, flickering room walls",
    },
    "shot-07": {
        "motion_prompt": (
            "Steady slow forward point-of-view walking dolly along the familiar Harar avenue toward the intersection ahead, "
            "the returning young adult taking calm gentle forward steps from behind, soft overcast tree foliage swaying lightly."
        ),
        "extra_negative": "stumbling gait, sudden running, crooked buildings",
    },
    "shot-08": {
        "motion_prompt": (
            "Fixed locked-off static tripod camera with completely still framing, only soft quiet breeze gently moving "
            "distant tree leaves while the empty open roundabout center and the returning adult silhouette on the left foreground "
            "stand completely still in muted late-afternoon calm."
        ),
        "extra_negative": "camera pan, camera zoom, monument appearing, construction trucks, protesters, crowds",
    },
    "shot-09": {
        "motion_prompt": (
            "Very slow gentle pan left while the returning young adult maintains calm natural posture and soft eye blink beside "
            "the warm textured Harar street wall, even twilight exposure with steady background architecture without light flares."
        ),
        "extra_negative": "pink halo, bright spot artifact, lens flare, warping facial features, exaggerated expression shifts, fast head movement",
    },
    "shot-10": {
        "motion_prompt": (
            "Gentle slow steady backward zoom-out down the quiet sunlit Harar lane, soft evening breeze moving green tree leaves lightly "
            "while plaster walls and warm sky hold steady tone without bright glare or glowing mist."
        ),
        "extra_negative": "orange cloud blob, red fog, glowing halo, lens flare, melting walls, abrupt darkness, rapid pan",
    },
}


def build_motion_prompt(storyboard: dict[str, Any], shot: dict[str, Any]) -> tuple[str, str]:
    """Return (motion_prompt, negative_prompt) focused cleanly on camera and subtle motion."""
    sid = shot["shot_id"]
    spec = SHOT_MOTION_PROMPTS.get(sid)
    if spec:
        motion_prompt = spec["motion_prompt"].strip()
        extra_neg = spec.get("extra_negative", "").strip()
    else:
        movement = shot["visual"]["camera_movement"].replace("_", " ")
        motion_prompt = f"Smooth gentle {movement} camera motion matching the scene atmosphere, calm natural movement."
        extra_neg = ""

    neg_parts = [DEFAULT_NEGATIVE_VIDEO_PROMPT]
    if extra_neg:
        neg_parts.append(extra_neg)
    global_neg = storyboard.get("style_guide", {}).get("global_negative_prompt", "").strip()
    if global_neg:
        neg_parts.append(global_neg)
    return motion_prompt, ", ".join(p for p in neg_parts if p)


def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _resolve_kaggle_credentials(root_dir: Path = ROOT_DIR) -> tuple[str, dict[str, str]]:
    """Resolve Kaggle Bearer or legacy credentials without exposing secrets in logs."""
    env_vals: dict[str, str] = {}
    env_file = root_dir / ".env"
    if env_file.exists():
        env_vals = {k: (v or "").strip() for k, v in dotenv_values(env_file).items() if v}

    def _get(key: str) -> str:
        return (env_vals.get(key) or os.environ.get(key) or "").strip()

    username = _get("KAGGLE_USERNAME") or "danielbasaznew"
    token = _get("KAGGLE_API_TOKEN")
    legacy_key = _get("KAGGLE_KEY")

    # Kaggle v2 API tokens prefixed with KGAT_ require KAGGLE_API_TOKEN (Bearer auth),
    # whereas KAGGLE_KEY triggers legacy Basic auth and returns 401 on kernel endpoints.
    if not token and legacy_key.startswith("KGAT_"):
        token = legacy_key
        legacy_key = ""

    auth_env: dict[str, str] = {}
    if token:
        auth_env["KAGGLE_API_TOKEN"] = token
    elif username and legacy_key:
        auth_env["KAGGLE_USERNAME"] = username
        auth_env["KAGGLE_KEY"] = legacy_key
    else:
        raise RuntimeError(
            "Kaggle credentials not configured: set KAGGLE_API_TOKEN (or KAGGLE_USERNAME + KAGGLE_KEY) in .env."
        )
    return username, auth_env


def authenticate_kaggle_api(root_dir: Path = ROOT_DIR) -> tuple[Any, str]:
    """Authenticate KaggleApi cleanly using a writable scratch config directory."""
    username, auth_env = _resolve_kaggle_credentials(root_dir=root_dir)
    cfg_dir = Path(tempfile.gettempdir()) / "harar_monument_kaggle_cfg"
    cfg_dir.mkdir(parents=True, exist_ok=True)
    os.environ["KAGGLE_CONFIG_DIR"] = str(cfg_dir)

    for k in ("KAGGLE_API_TOKEN", "KAGGLE_USERNAME", "KAGGLE_KEY"):
        os.environ.pop(k, None)
    for k, val in auth_env.items():
        os.environ[k] = val

    from kaggle.api.kaggle_api_extended import KaggleApi

    api = KaggleApi()
    api.authenticate()
    resolved_user = api.config_values.get(api.CONFIG_NAME_USER) or username
    return api, resolved_user


def _build_kaggle_worker_script(
    batch_items: list[dict[str, Any]],
    *,
    dataset_slug: str,
    model_id: str,
    width: int,
    height: int,
    fps: int,
    num_frames: int,
    steps: int,
    guidance_scale: float,
) -> str:
    """Render self-contained Kaggle GPU worker script for Wan 2.2 batch inference."""
    items_json = json.dumps(batch_items, ensure_ascii=False, indent=2)
    return f'''import os
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

import gc
import json
import subprocess
import sys
import time
from pathlib import Path

subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "ftfy", "beautifulsoup4"])

import numpy as np
import torch
from PIL import Image
from accelerate.hooks import remove_hook_from_module
from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
from diffusers.utils import export_to_video
from transformers import T5TokenizerFast, UMT5EncoderModel

OUT_DIR = Path("/kaggle/working")
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_ID = {json.dumps(model_id)}
DATASET_SLUG = {json.dumps(dataset_slug)}
WIDTH = {width}
HEIGHT = {height}
FPS = {fps}
NUM_FRAMES = {num_frames}
STEPS = {steps}
GUIDANCE_SCALE = {guidance_scale}
BATCH_ITEMS = {items_json}


def _find_keyframe(filename: str) -> Path:
    direct = Path("/kaggle/input") / DATASET_SLUG / filename
    if direct.exists():
        return direct
    matches = list(Path("/kaggle/input").rglob(filename))
    assert matches, f"Keyframe {{filename}} not found under /kaggle/input"
    return matches[0]


class _DummyTextEncoder(torch.nn.Module):
    """Minimal dtype+parameter stub so diffusers and accelerate hooks run without UMT5 resident."""

    def __init__(self, target_dtype: torch.dtype) -> None:
        super().__init__()
        self._target_dtype = target_dtype
        self._dummy_param = torch.nn.Parameter(torch.zeros(1, dtype=target_dtype), requires_grad=False)

    @property
    def dtype(self) -> torch.dtype:
        return self._target_dtype


def _encode_all_prompts(items: list[dict], target_dtype: torch.dtype) -> dict[str, tuple[torch.Tensor, torch.Tensor]]:
    t0 = time.perf_counter()
    tokenizer = T5TokenizerFast.from_pretrained(MODEL_ID, subfolder="tokenizer")
    text_encoder = UMT5EncoderModel.from_pretrained(
        MODEL_ID, subfolder="text_encoder", torch_dtype=target_dtype
    ).to("cuda:0")
    text_encoder.eval()
    max_seq = 512
    encoded: dict[str, tuple[torch.Tensor, torch.Tensor]] = {{}}

    def _enc(text: str) -> torch.Tensor:
        tok = tokenizer(
            [text],
            padding="max_length",
            max_length=max_seq,
            truncation=True,
            add_special_tokens=True,
            return_attention_mask=True,
            return_tensors="pt",
        )
        ids = tok.input_ids.to("cuda:0")
        mask = tok.attention_mask.to("cuda:0")
        seq_len = int(mask.gt(0).sum(dim=1).item())
        hidden = text_encoder(ids, mask).last_hidden_state[0, :seq_len]
        padding = torch.zeros(max_seq - seq_len, hidden.shape[1], dtype=hidden.dtype, device=hidden.device)
        return torch.cat([hidden, padding], dim=0).unsqueeze(0).cpu()

    with torch.inference_mode():
        for item in items:
            sid = item["shot_id"]
            encoded[sid] = (_enc(item["motion_prompt"]), _enc(item["negative_prompt"]))

    del text_encoder, tokenizer
    gc.collect()
    torch.cuda.empty_cache()
    print(f"Pre-encoded {{len(encoded)}} shots in {{round(time.perf_counter() - t0, 2)}}s; freed UMT5 VRAM.")
    return encoded


torch.cuda.set_device(0)
target_dtype = torch.float16
embeds_map = _encode_all_prompts(BATCH_ITEMS, target_dtype)

t_load0 = time.perf_counter()
vae = AutoencoderKLWan.from_pretrained(MODEL_ID, subfolder="vae", torch_dtype=torch.float32)
pipe = WanImageToVideoPipeline.from_pretrained(
    MODEL_ID,
    vae=vae,
    text_encoder=None,
    tokenizer=None,
    torch_dtype=target_dtype,
)
pipe.text_encoder = _DummyTextEncoder(target_dtype)
if hasattr(pipe, "enable_attention_slicing"):
    pipe.enable_attention_slicing("auto")
if hasattr(pipe.vae, "enable_tiling"):
    pipe.vae.enable_tiling()
if hasattr(pipe.vae, "enable_slicing"):
    pipe.vae.enable_slicing()

pipe.enable_model_cpu_offload(gpu_id=0)
load_seconds = round(time.perf_counter() - t_load0, 2)
print(f"Loaded transformer+vae in {{load_seconds}}s")

results = []
metrics_path = OUT_DIR / "batch_metrics.json"
offload_mode = "model_cpu_offload"

for item in BATCH_ITEMS:
    sid = item["shot_id"]
    seed = int(item["seed"])
    kf_path = _find_keyframe(f"{{sid}}.png")
    img = Image.open(kf_path).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    p_emb, n_emb = embeds_map[sid]

    def _run_shot():
        try:
            torch.cuda.reset_peak_memory_stats(0)
        except Exception:
            pass
        with torch.inference_mode():
            gen = torch.Generator(device="cpu").manual_seed(seed)
            return pipe(
                image=img,
                prompt=None,
                negative_prompt=None,
                prompt_embeds=p_emb.to("cuda:0", dtype=target_dtype),
                negative_prompt_embeds=n_emb.to("cuda:0", dtype=target_dtype),
                height=HEIGHT,
                width=WIDTH,
                num_frames=NUM_FRAMES,
                guidance_scale=GUIDANCE_SCALE,
                num_inference_steps=STEPS,
                generator=gen,
            ).frames[0]

    t0 = time.perf_counter()
    try:
        frames = _run_shot()
    except torch.OutOfMemoryError:
        for mod in (pipe.vae, pipe.transformer, pipe.text_encoder):
            if mod is not None:
                remove_hook_from_module(mod, recurse=True)
        gc.collect()
        torch.cuda.empty_cache()
        pipe.enable_sequential_cpu_offload(gpu_id=0)
        offload_mode = "sequential_cpu_offload"
        t0 = time.perf_counter()
        frames = _run_shot()

    infer_seconds = round(time.perf_counter() - t0, 2)
    try:
        peak_vram_gb = round(torch.cuda.max_memory_allocated(0) / (1024 ** 3), 2)
    except Exception:
        peak_vram_gb = 0.0

    arr = np.asarray(frames)
    has_nan = bool(np.isnan(arr).any())
    std_val = round(float(arr.std()), 4)
    if has_nan or std_val < 1e-3:
        raise RuntimeError(f"{{sid}} generated invalid video frames (has_nan={{has_nan}}, std={{std_val}})")

    mp4_file = OUT_DIR / f"{{sid}}.mp4"
    export_to_video(frames, str(mp4_file), fps=FPS)

    for label, idx in [("start", 0), ("mid", len(frames) // 2), ("end", len(frames) - 1)]:
        f_val = frames[idx]
        if isinstance(f_val, Image.Image):
            f_img = f_val
        else:
            f_arr = np.asarray(f_val)
            if f_arr.dtype != np.uint8:
                f_arr = np.clip(f_arr * 255.0 if f_arr.max() <= 1.5 else f_arr, 0, 255).astype(np.uint8)
            f_img = Image.fromarray(f_arr)
        f_img.save(OUT_DIR / f"{{sid}}_{{label}}.png")

    rec = {{
        "shot_id": sid,
        "seed": seed,
        "offload_mode": offload_mode,
        "load_seconds": load_seconds,
        "inference_seconds": infer_seconds,
        "peak_vram_gb": peak_vram_gb,
        "num_frames": len(frames),
        "fps": FPS,
        "width": WIDTH,
        "height": HEIGHT,
        "steps": STEPS,
        "guidance_scale": GUIDANCE_SCALE,
        "mean_val": round(float(arr.mean()), 4),
        "std_val": std_val,
        "file_size_bytes": mp4_file.stat().st_size,
    }}
    results.append(rec)
    metrics_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Completed {{sid}}:", rec)
    gc.collect()
    torch.cuda.empty_cache()

print("ALL BATCH SHOTS COMPLETED:", len(results))
'''


def _sync_keyframes_dataset(api: Any, username: str, keyframe_paths: list[Path], dataset_slug: str) -> str:
    """Create or update a private Kaggle dataset holding the approved Step 7 keyframes."""
    dataset_ref = f"{username}/{dataset_slug}"
    unique_paths = {p.name: p for p in keyframe_paths}
    with tempfile.TemporaryDirectory() as tmp:
        stage_dir = Path(tmp)
        for p in unique_paths.values():
            shutil.copy2(p, stage_dir / p.name)
        meta = {
            "title": "Harar Monument Step 7 Keyframes",
            "id": dataset_ref,
            "licenses": [{"name": "other"}],
        }
        (stage_dir / "dataset-metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        try:
            api.dataset_create_new(str(stage_dir), public=False, quiet=True)
        except Exception:
            api.dataset_create_version(str(stage_dir), version_notes="Sync Step 7 keyframes", quiet=True)
    return dataset_ref


def _plan_shots(
    storyboard: dict[str, Any],
    cache: dict[str, Any],
    *,
    shot_ids: list[str] | None,
    model: str,
    resolution: str,
    width: int,
    height: int,
    fps: int,
    num_frames: int,
    steps: int,
    guidance_scale: float,
    force: bool,
    root_dir: Path,
) -> tuple[list[dict[str, Any]], int, list[Path]]:
    """Build generation plans for uncached shots and update storyboard metadata."""
    selected = set(shot_ids) if shot_ids else None
    uncached_items: list[dict[str, Any]] = []
    cached_count = 0
    keyframe_files: list[Path] = []

    for shot in storyboard["shots"]:
        sid = shot["shot_id"]
        if selected and sid not in selected:
            continue

        kf_rel = shot.get("generation", {}).get("image", {}).get("keyframe_path")
        if not kf_rel:
            raise FileNotFoundError(f"{sid} has no keyframe_path in storyboard.json.")
        kf_path = root_dir / kf_rel
        if not kf_path.exists():
            raise FileNotFoundError(f"Keyframe missing for {sid}: {kf_path}")
        keyframe_files.append(kf_path)

        vid_cfg = shot.setdefault("generation", {}).setdefault("video", {})
        seed = vid_cfg.get("seed")
        if seed is None:
            seed = 3000 + int(shot["order"])

        motion_prompt, negative_prompt = build_motion_prompt(storyboard, shot)
        rel_out = f"assets/clips/{sid}.mp4"
        out_path = root_dir / rel_out

        kf_sha = _file_sha256(kf_path)
        cache_payload = {
            "shot_id": sid,
            "keyframe_sha256": kf_sha,
            "model": model,
            "resolution": resolution,
            "width": width,
            "height": height,
            "fps": fps,
            "num_frames": num_frames,
            "steps": steps,
            "guidance_scale": guidance_scale,
            "seed": seed,
            "motion_prompt": motion_prompt,
            "negative_prompt": negative_prompt,
        }
        input_hash = compute_hash(cache_payload)

        vid_cfg["mode"] = "image_to_video"
        vid_cfg["provider"] = "kaggle"
        vid_cfg["model"] = model
        vid_cfg["seed"] = seed
        vid_cfg["parameters"] = {
            "resolution": resolution,
            "fps": fps,
            "num_frames": num_frames,
            "steps": steps,
            "guidance_scale": guidance_scale,
            "motion_prompt": motion_prompt,
            "extra_params": {
                "width": width,
                "height": height,
                "dtype": "float16",
                "vae_dtype": "float32",
                "offload_mode": "model_cpu_offload",
                "negative_prompt": negative_prompt,
            },
        }

        cached_entry = cache.get(sid)
        if (
            not force
            and cached_entry
            and cached_entry.get("input_hash") == input_hash
            and out_path.exists()
            and out_path.stat().st_size > 10_000
        ):
            vid_cfg["clip_path"] = rel_out
            cached_count += 1
            continue

        uncached_items.append(
            {
                "shot_id": sid,
                "seed": seed,
                "motion_prompt": motion_prompt,
                "negative_prompt": negative_prompt,
                "input_hash": input_hash,
                "rel_out": rel_out,
                "out_path": out_path,
            }
        )

    return uncached_items, cached_count, keyframe_files


def ingest_downloaded_clips(
    source_dir: Path,
    *,
    shot_ids: list[str] | None = None,
    model: str = DEFAULT_WAN_MODEL,
    resolution: str = DEFAULT_RESOLUTION,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    fps: int = DEFAULT_FPS,
    num_frames: int = DEFAULT_NUM_FRAMES,
    steps: int = DEFAULT_STEPS,
    guidance_scale: float = DEFAULT_GUIDANCE_SCALE,
    kernel_ref: str = "danielbasaznew/wan22-step8-batch",
    root_dir: Path = ROOT_DIR,
    previews_dir: Path | None = None,
) -> dict[str, Any]:
    """Verify downloaded Kaggle batch MP4 outputs, update cache/storyboard, and log to runs.jsonl."""
    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    clips_dir = root_dir / "assets" / "clips"
    cache_file = clips_dir / "clips_cache.json"
    runs_path = root_dir / "runs.jsonl"

    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)
    cache = load_cache(cache_file)
    clips_dir.mkdir(parents=True, exist_ok=True)

    uncached_items, _, _ = _plan_shots(
        storyboard,
        cache,
        shot_ids=shot_ids,
        model=model,
        resolution=resolution,
        width=width,
        height=height,
        fps=fps,
        num_frames=num_frames,
        steps=steps,
        guidance_scale=guidance_scale,
        force=True,
        root_dir=root_dir,
    )

    metrics_file = source_dir / "batch_metrics.json"
    metrics_by_shot: dict[str, dict[str, Any]] = {}
    if metrics_file.exists():
        for rec in json.loads(metrics_file.read_text(encoding="utf-8")):
            metrics_by_shot[rec["shot_id"]] = rec
    else:
        pilot_metrics = source_dir / "pilot_metrics.json"
        if pilot_metrics.exists() and len(uncached_items) == 1:
            metrics_by_shot[uncached_items[0]["shot_id"]] = json.loads(pilot_metrics.read_text(encoding="utf-8"))

    shot_map = {s["shot_id"]: s for s in storyboard["shots"]}
    ingested = 0
    for item in uncached_items:
        sid = item["shot_id"]
        candidates = [source_dir / f"{sid}.mp4", source_dir / f"{sid}_fp16.mp4"]
        src_mp4 = next((c for c in candidates if c.exists() and c.stat().st_size > 10_000), None)
        if src_mp4 is None:
            raise FileNotFoundError(f"Missing/invalid generated MP4 for {sid} in {source_dir}")

        shutil.copy2(src_mp4, item["out_path"])
        if previews_dir is not None:
            previews_dir.mkdir(parents=True, exist_ok=True)
            for suffix in ("start", "mid", "end"):
                for stem in (sid, f"{sid}_fp16"):
                    p_src = source_dir / f"{stem}_{suffix}.png"
                    if p_src.exists():
                        shutil.copy2(p_src, previews_dir / f"{sid}_{suffix}.png")
                        break

        shot_map[sid]["generation"]["video"]["clip_path"] = item["rel_out"]
        shot_metrics = metrics_by_shot.get(sid, {})
        cache[sid] = {
            "input_hash": item["input_hash"],
            "model": model,
            "seed": item["seed"],
            "resolution": resolution,
            "width": width,
            "height": height,
            "fps": fps,
            "num_frames": num_frames,
            "steps": steps,
            "guidance_scale": guidance_scale,
            "output_path": item["rel_out"],
            "metrics": shot_metrics,
        }
        save_cache(cache_file, cache)

        append_run_log(
            {
                "stage": "video",
                "shot_id": sid,
                "provider": "kaggle",
                "model": model,
                "parameters": {
                    "resolution": resolution,
                    "width": width,
                    "height": height,
                    "fps": fps,
                    "num_frames": num_frames,
                    "steps": steps,
                    "guidance_scale": guidance_scale,
                    "kaggle_kernel": kernel_ref,
                    "prompt_preview": item["motion_prompt"][:140],
                },
                "seed": item["seed"],
                "latency_seconds": shot_metrics.get("inference_seconds", 0.0),
                "estimated_cost_usd": 0.0,
                "status": "success",
                "output_path": item["rel_out"],
            },
            log_path=runs_path,
        )
        ingested += 1

    save_storyboard(storyboard, path=sb_path, schema_path=schema_path)
    return {"model": model, "ingested": ingested, "kernel": kernel_ref}


def push_video_batch(
    shot_ids: list[str] | None = None,
    model: str = DEFAULT_WAN_MODEL,
    resolution: str = DEFAULT_RESOLUTION,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    fps: int = DEFAULT_FPS,
    num_frames: int = DEFAULT_NUM_FRAMES,
    steps: int = DEFAULT_STEPS,
    guidance_scale: float = DEFAULT_GUIDANCE_SCALE,
    force: bool = False,
    root_dir: Path = ROOT_DIR,
    kernel_slug: str = "wan22-step8-batch",
) -> dict[str, Any]:
    """Submit uncached shots as a Kaggle GPU kernel and return immediately with batch metadata."""
    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    clips_dir = root_dir / "assets" / "clips"
    cache_file = clips_dir / "clips_cache.json"

    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)
    cache = load_cache(cache_file)
    clips_dir.mkdir(parents=True, exist_ok=True)

    uncached_items, cached_count, keyframe_files = _plan_shots(
        storyboard,
        cache,
        shot_ids=shot_ids,
        model=model,
        resolution=resolution,
        width=width,
        height=height,
        fps=fps,
        num_frames=num_frames,
        steps=steps,
        guidance_scale=guidance_scale,
        force=force,
        root_dir=root_dir,
    )
    save_storyboard(storyboard, path=sb_path, schema_path=schema_path)

    if not uncached_items:
        return {"model": model, "pushed": 0, "cached": cached_count, "kernel": None, "shots": []}

    api, username = authenticate_kaggle_api(root_dir=root_dir)
    dataset_ref = _sync_keyframes_dataset(api, username, keyframe_files, DEFAULT_DATASET_SLUG)
    kernel_ref = f"{username}/{kernel_slug}"

    with tempfile.TemporaryDirectory() as tmp:
        k_dir = Path(tmp) / "kernel"
        k_dir.mkdir(parents=True, exist_ok=True)
        worker_payload = [
            {
                "shot_id": item["shot_id"],
                "seed": item["seed"],
                "motion_prompt": item["motion_prompt"],
                "negative_prompt": item["negative_prompt"],
            }
            for item in uncached_items
        ]
        (k_dir / "wan22_worker.py").write_text(
            _build_kaggle_worker_script(
                worker_payload,
                dataset_slug=DEFAULT_DATASET_SLUG,
                model_id=model,
                width=width,
                height=height,
                fps=fps,
                num_frames=num_frames,
                steps=steps,
                guidance_scale=guidance_scale,
            ),
            encoding="utf-8",
        )
        (k_dir / "kernel-metadata.json").write_text(
            json.dumps(
                {
                    "id": kernel_ref,
                    "title": kernel_slug.replace("-", " "),
                    "code_file": "wan22_worker.py",
                    "language": "python",
                    "kernel_type": "script",
                    "is_private": True,
                    "enable_gpu": True,
                    "enable_tpu": False,
                    "enable_internet": True,
                    "dataset_sources": [dataset_ref],
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
        "model": model,
        "pushed": len(uncached_items),
        "cached": cached_count,
        "kernel": kernel_ref,
        "shots": [item["shot_id"] for item in uncached_items],
    }


def generate_video_clips(
    shot_ids: list[str] | None = None,
    model: str = DEFAULT_WAN_MODEL,
    resolution: str = DEFAULT_RESOLUTION,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    fps: int = DEFAULT_FPS,
    num_frames: int = DEFAULT_NUM_FRAMES,
    steps: int = DEFAULT_STEPS,
    guidance_scale: float = DEFAULT_GUIDANCE_SCALE,
    force: bool = False,
    root_dir: Path = ROOT_DIR,
    kernel_slug: str = "wan22-step8-batch",
    poll_interval_seconds: int = 45,
    timeout_minutes: int = 90,
    previews_dir: Path | None = None,
) -> dict[str, Any]:
    """Generate and cache Step 8 moving video clips on Kaggle GPU using Wan 2.2 TI2V-5B."""
    batch = push_video_batch(
        shot_ids=shot_ids,
        model=model,
        resolution=resolution,
        width=width,
        height=height,
        fps=fps,
        num_frames=num_frames,
        steps=steps,
        guidance_scale=guidance_scale,
        force=force,
        root_dir=root_dir,
        kernel_slug=kernel_slug,
    )
    if batch["pushed"] == 0:
        return {"model": model, "generated": 0, "cached": batch["cached"]}

    api, _ = authenticate_kaggle_api(root_dir=root_dir)
    kernel_ref = batch["kernel"]
    deadline = time.perf_counter() + timeout_minutes * 60

    with tempfile.TemporaryDirectory() as tmp:
        out_dl = Path(tmp) / "out"
        out_dl.mkdir(parents=True, exist_ok=True)
        while True:
            st = api.kernels_status(kernel_ref)
            status_text = str(getattr(st, "status", st))
            upper = status_text.upper()
            if "COMPLETE" in upper:
                break
            if "ERROR" in upper or "CANCEL" in upper:
                api.kernels_output(kernel_ref, path=str(out_dl))
                raise RuntimeError(f"Kaggle kernel {kernel_ref} failed: {status_text} (logs in {out_dl})")
            if time.perf_counter() > deadline:
                raise TimeoutError(f"Timed out waiting for Kaggle kernel {kernel_ref} ({timeout_minutes}m)")
            time.sleep(poll_interval_seconds)

        api.kernels_output(kernel_ref, path=str(out_dl))
        res = ingest_downloaded_clips(
            out_dl,
            shot_ids=batch["shots"],
            model=model,
            resolution=resolution,
            width=width,
            height=height,
            fps=fps,
            num_frames=num_frames,
            steps=steps,
            guidance_scale=guidance_scale,
            kernel_ref=kernel_ref,
            root_dir=root_dir,
            previews_dir=previews_dir,
        )
    return {
        "model": model,
        "generated": res["ingested"],
        "cached": batch["cached"],
        "kernel": kernel_ref,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Step 8 moving video clips on Kaggle using Wan 2.2.")
    parser.add_argument("--shots", nargs="*", help="Optional specific shot IDs to generate.")
    parser.add_argument("--model", default=DEFAULT_WAN_MODEL, help="Hugging Face Wan 2.2 model ID.")
    parser.add_argument("--resolution", default=DEFAULT_RESOLUTION, choices=["480p", "720p", "1080p"])
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    parser.add_argument("--fps", type=int, default=DEFAULT_FPS)
    parser.add_argument("--num-frames", type=int, default=DEFAULT_NUM_FRAMES)
    parser.add_argument("--steps", type=int, default=DEFAULT_STEPS)
    parser.add_argument("--guidance-scale", type=float, default=DEFAULT_GUIDANCE_SCALE)
    parser.add_argument("--kernel-slug", default="wan22-step8-batch", help="Kaggle script kernel slug.")
    parser.add_argument("--poll-seconds", type=int, default=45)
    parser.add_argument("--timeout-minutes", type=int, default=90)
    parser.add_argument("--force", action="store_true", help="Ignore cache and regenerate selected clips.")
    args = parser.parse_args()
    result = generate_video_clips(
        shot_ids=args.shots,
        model=args.model,
        resolution=args.resolution,
        width=args.width,
        height=args.height,
        fps=args.fps,
        num_frames=args.num_frames,
        steps=args.steps,
        guidance_scale=args.guidance_scale,
        force=args.force,
        kernel_slug=args.kernel_slug,
        poll_interval_seconds=args.poll_seconds,
        timeout_minutes=args.timeout_minutes,
    )
    print(result)


if __name__ == "__main__":
    main()
