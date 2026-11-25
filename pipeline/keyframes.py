"""Stage: Generate 10 shot keyframes conditioned on Step 6 reference sheets."""

from __future__ import annotations

import argparse
import time
from pathlib import Path
from typing import Any

from pipeline.cloudflare_flux import (
    DEFAULT_FLUX_MODEL,
    call_cloudflare_flux,
    prepare_reference_image_bytes,
    save_validated_png,
)
from pipeline.common import (
    ROOT_DIR,
    append_run_log,
    compute_hash,
    load_cache,
    load_secret,
    load_storyboard,
    save_cache,
    save_storyboard,
    validate_storyboard,
)

KEYFRAMES_DIR = ROOT_DIR / "assets" / "keyframes"
CACHE_PATH = KEYFRAMES_DIR / "keyframes_cache.json"
DEFAULT_WIDTH = 1024
DEFAULT_HEIGHT = 1024
DEFAULT_STEPS = 4

# Optional normalized crop boxes (x0, y0, x1, y1) for 3-view character sheets so
# FLUX.2 klein sees a single clean character view instead of a 3-panel collage.
CHARACTER_PANEL_CROPS: dict[str, tuple[float, float, float, float]] = {
    "front": (0.0, 0.0, 0.34, 1.0),
    "three_quarter": (0.33, 0.0, 0.67, 1.0),
    "back": (0.66, 0.0, 1.0, 1.0),
}

# Shots facing away / walking away use the back panel; others use the 3/4 or front panel.
SHOT_CHARACTER_VIEW: dict[str, str] = {
    "shot-03": "back",
    "shot-04": "three_quarter",
    "shot-05": "back",
    "shot-06": "three_quarter",
    "shot-07": "back",
    "shot-08": "back",
    "shot-09": "three_quarter",
}


def build_keyframe_prompt(storyboard: dict[str, Any], shot: dict[str, Any]) -> str:
    """Assemble a consistent FLUX keyframe prompt from storyboard metadata."""
    style_block = storyboard.get("style_guide", {}).get("shared_style_block", "").strip()
    vis = shot["visual"]
    framing = vis["camera_framing"].replace("_", " ")
    ref_ids = vis.get("reference_ids", [])

    parts = [
        "Single cohesive cinematic photograph frame (not a collage, not a multi-view turnaround sheet).",
        vis["main_prompt"].strip(),
        f"Subject: {vis['subject_description'].strip()}.",
        f"Environment: {vis['environment_description'].strip()}.",
        f"Lighting and atmosphere: {vis['lighting_atmosphere'].strip()}.",
        f"Camera framing: {framing}, primary subject centered inside the middle 56% safe frame so both 9:16 vertical and 16:9 horizontal crops frame cleanly.",
    ]
    if any(r.startswith("ref_narrator_") for r in ref_ids):
        parts.append("Match the character identity, skin tone, curly hair, and exact outfit from the reference image.")
    if "ref_harar_roundabout_memory" in ref_ids:
        parts.append(
            "Match the sunlit tree-lined roundabout and distant soft generalized stone pedestal mood from the reference image without readable inscriptions."
        )
    if style_block:
        parts.append(style_block)
    parts.append("No text, no subtitles, no watermark, no split screen, no archival photo border.")
    return " ".join(parts)


def _load_shot_reference_inputs(
    storyboard: dict[str, Any],
    shot: dict[str, Any],
    root_dir: Path,
) -> tuple[list[tuple[str, bytes]], list[str]]:
    """Prepare downscaled <=512px reference images for a shot's reference_ids."""
    ref_lookup = {
        ref["reference_id"]: ref
        for ref in storyboard.get("style_guide", {}).get("reference_sheets", [])
    }
    sid = shot["shot_id"]
    attachments: list[tuple[str, bytes]] = []
    used_hashes: list[str] = []

    for rid in shot["visual"].get("reference_ids", []):
        ref = ref_lookup.get(rid)
        if not ref or not ref.get("file_path"):
            raise FileNotFoundError(
                f"Reference sheet '{rid}' for {sid} has no generated file_path in storyboard.json."
            )
        ref_path = root_dir / ref["file_path"]
        if not ref_path.exists():
            raise FileNotFoundError(f"Reference image file missing: {ref_path}")

        crop_norm = None
        if ref.get("type") == "character":
            view_name = SHOT_CHARACTER_VIEW.get(sid, "three_quarter")
            crop_norm = CHARACTER_PANEL_CROPS[view_name]

        img_bytes = prepare_reference_image_bytes(ref_path, max_dim=512, crop_box_norm=crop_norm)
        attachments.append((f"{rid}.png", img_bytes))
        used_hashes.append(f"{rid}:{compute_hash({'b64_len': len(img_bytes), 'crop': crop_norm})[:12]}")

    return attachments, used_hashes


def generate_keyframes(
    shot_ids: list[str] | None = None,
    model: str = DEFAULT_FLUX_MODEL,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    force: bool = False,
    root_dir: Path = ROOT_DIR,
) -> dict[str, Any]:
    """Generate and cache Step 7 keyframes for storyboard shots."""
    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    keyframes_dir = root_dir / "assets" / "keyframes"
    cache_file = keyframes_dir / "keyframes_cache.json"
    runs_path = root_dir / "runs.jsonl"

    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)

    account_id = load_secret("CLOUDFLARE_ACCOUNT_ID")
    api_token = load_secret("CLOUDFLARE_API_TOKEN")

    cache = load_cache(cache_file)
    keyframes_dir.mkdir(parents=True, exist_ok=True)
    selected = set(shot_ids) if shot_ids else None

    generated = 0
    cached = 0

    try:
        for shot in storyboard["shots"]:
            sid = shot["shot_id"]
            if selected and sid not in selected:
                continue

            img_cfg = shot.setdefault("generation", {}).setdefault("image", {})
            seed = img_cfg.get("seed")
            if seed is None:
                seed = 2000 + int(shot["order"])

            prompt = build_keyframe_prompt(storyboard, shot)
            attachments, ref_sigs = _load_shot_reference_inputs(storyboard, shot, root_dir)
            rel_out = f"assets/keyframes/{sid}.png"
            out_path = root_dir / rel_out

            cache_payload = {
                "shot_id": sid,
                "model": model,
                "prompt": prompt,
                "width": width,
                "height": height,
                "seed": seed,
                "ref_sigs": ref_sigs,
            }
            input_hash = compute_hash(cache_payload)
            cached_entry = cache.get(sid)

            img_cfg["provider"] = "cloudflare_workers_ai"
            img_cfg["model"] = model
            img_cfg["seed"] = seed
            img_cfg["parameters"] = {
                "width": width,
                "height": height,
                "steps": DEFAULT_STEPS,
                "extra_params": {
                    "reference_ids": shot["visual"].get("reference_ids", []),
                    "character_panel": SHOT_CHARACTER_VIEW.get(sid),
                },
            }

            if (
                not force
                and cached_entry
                and cached_entry.get("input_hash") == input_hash
                and out_path.exists()
                and out_path.stat().st_size > 1000
            ):
                img_cfg["keyframe_path"] = rel_out
                cached += 1
                continue

            t0 = time.perf_counter()
            try:
                raw_bytes = call_cloudflare_flux(
                    account_id=account_id,
                    api_token=api_token,
                    model=model,
                    prompt=prompt,
                    width=width,
                    height=height,
                    seed=seed,
                    input_images=attachments,
                )
                latency_s = round(time.perf_counter() - t0, 3)
                actual_w, actual_h = save_validated_png(raw_bytes, out_path)
                img_cfg["keyframe_path"] = rel_out

                cache[sid] = {
                    "input_hash": input_hash,
                    "model": model,
                    "seed": seed,
                    "width": actual_w,
                    "height": actual_h,
                    "output_path": rel_out,
                }
                save_cache(cache_file, cache)

                append_run_log(
                    {
                        "stage": "keyframes",
                        "shot_id": sid,
                        "provider": "cloudflare_workers_ai",
                        "model": model,
                        "parameters": {
                            "width": actual_w,
                            "height": actual_h,
                            "steps": DEFAULT_STEPS,
                            "reference_ids": shot["visual"].get("reference_ids", []),
                            "character_panel": SHOT_CHARACTER_VIEW.get(sid),
                            "prompt_preview": prompt[:140],
                        },
                        "seed": seed,
                        "latency_seconds": latency_s,
                        "estimated_cost_usd": 0.0,
                        "status": "success",
                        "output_path": rel_out,
                    },
                    log_path=runs_path,
                )
                generated += 1
            except Exception as exc:
                latency_s = round(time.perf_counter() - t0, 3)
                sanitized_err = str(exc).replace(account_id, "<ACCOUNT_ID>").replace(api_token, "<REDACTED>")
                append_run_log(
                    {
                        "stage": "keyframes",
                        "shot_id": sid,
                        "provider": "cloudflare_workers_ai",
                        "model": model,
                        "parameters": {"width": width, "height": height, "steps": DEFAULT_STEPS},
                        "seed": seed,
                        "latency_seconds": latency_s,
                        "estimated_cost_usd": 0.0,
                        "status": "error",
                        "error": f"{type(exc).__name__}: {sanitized_err[:300]}",
                    },
                    log_path=runs_path,
                )
                raise
    finally:
        save_storyboard(storyboard, path=sb_path, schema_path=schema_path)

    return {"model": model, "generated": generated, "cached": cached}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Step 7 keyframes conditioned on reference sheets.")
    parser.add_argument("--shots", nargs="*", help="Optional specific shot IDs to generate.")
    parser.add_argument("--model", default=DEFAULT_FLUX_MODEL, help="Cloudflare Workers AI FLUX model ID.")
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH, help="Keyframe width.")
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT, help="Keyframe height.")
    parser.add_argument("--force", action="store_true", help="Ignore cache and regenerate selected keyframes.")
    args = parser.parse_args()
    result = generate_keyframes(
        shot_ids=args.shots,
        model=args.model,
        width=args.width,
        height=args.height,
        force=args.force,
    )
    print(result)


if __name__ == "__main__":
    main()
