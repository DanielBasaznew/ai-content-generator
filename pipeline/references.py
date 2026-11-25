"""Stage: Generate character and visual-style reference sheets via Cloudflare FLUX."""

from __future__ import annotations

import argparse
import base64
import io
import re
import time
from pathlib import Path
from typing import Any

import requests
from PIL import Image

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

DEFAULT_FLUX_MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
FALLBACK_FLUX_MODEL = "@cf/black-forest-labs/flux-1-schnell"
REFERENCES_DIR = ROOT_DIR / "assets" / "references"
CACHE_PATH = REFERENCES_DIR / "references_cache.json"
AUDIENCE_TEST_1_PATH = ROOT_DIR / "docs" / "AUDIENCE_TEST_1.md"
DESIGN_PATH = ROOT_DIR / "DESIGN.md"

# Canonical prompts aligned with docs/CHARACTER_REFERENCE_SHEET.md and docs/VISUAL_STYLE_SHEET.md
REFERENCE_SPECS: dict[str, dict[str, Any]] = {
    "ref_narrator_child": {
        "prompt": (
            "Character reference sheet on a neutral warm cream studio background, "
            "fictional generic Ethiopian child age 8, warm medium-brown skin, short cropped "
            "tightly curled black hair, soft natural child facial proportions, gentle warm dark eyes, "
            "wearing a clean off-white collared cotton shirt under a muted warm ochre-mustard knit vest, "
            "dark brown casual shorts, natural subtle expression, three clean views side by side "
            "(front view, three-quarter view, back view), warm soft daylight, 35mm film grain texture, "
            "realistic documentary film look, no text, no labels, no borders, no archival sepia frame."
        ),
        "width": 1344,
        "height": 768,
        "seed": 1001,
    },
    "ref_narrator_adult": {
        "prompt": (
            "Character reference sheet on a neutral warm gray studio background, "
            "fictional generic Ethiopian young adult age 22, warm medium-brown skin, short cropped "
            "tightly curled black hair, calm reflective dark eyes, subtle natural features consistent "
            "with an older version of the child character, wearing an off-white cotton shirt under "
            "a muted slate-navy overshirt and dark casual trousers, three clean views side by side "
            "(front view, three-quarter view, back view), soft overcast daylight, 35mm film grain texture, "
            "realistic cinematic film look, no text, no labels, no borders."
        ),
        "width": 1344,
        "height": 768,
        "seed": 1002,
    },
    "ref_harar_roundabout_memory": {
        "prompt": (
            "Environment memory reconstruction reference of a wide sunlit roundabout plaza in Harar, "
            "Ethiopia, ringed by green shade trees and soft golden daylight, distant gentle silhouette "
            "of a stone pedestal landmark centered in soft atmospheric depth without crisp architectural "
            "details or plaques, center-balanced framing suitable for 9:16 and 16:9 crops, "
            "warm 35mm film grain aesthetic, clearly artistic memory impression, no text, no archival photo border."
        ),
        "width": 1024,
        "height": 1024,
        "seed": 1003,
    },
    "ref_harar_streets": {
        "prompt": (
            "Environment mood board reference of a quiet sunlit residential lane in Harar, Ethiopia, "
            "warm earth-toned plastered walls, textured wooden doorways, gentle shade tree foliage, "
            "warm morning sunlight with subtle dust haze, center-aligned street path suitable for both "
            "9:16 and 16:9 framing, 35mm film grain aesthetic, no text, no readable signs, no borders."
        ),
        "width": 1024,
        "height": 1024,
        "seed": 1004,
    },
}


def check_audience_test_1_complete(
    audience_test_path: Path = AUDIENCE_TEST_1_PATH,
    design_path: Path = DESIGN_PATH,
) -> tuple[bool, list[str]]:
    """Verify whether real Audience Test 1 responses (>=3 listeners) are recorded."""
    reasons: list[str] = []
    if not audience_test_path.exists():
        reasons.append(f"Missing {audience_test_path.name}.")
    else:
        text = audience_test_path.read_text(encoding="utf-8")
        responses = re.findall(r"-\s*\*Response:\*\s*(.*)", text)
        filled_responses = [r.strip() for r in responses if r.strip()]
        # Each participant form has 6 questions -> >=18 answers for 3 participants
        if len(filled_responses) < 18:
            reasons.append(
                f"{audience_test_path.name} has {len(filled_responses)}/18 answered participant questions "
                "(requires at least 3 real listeners before Step 6 image generation)."
            )

    if not design_path.exists():
        reasons.append(f"Missing {design_path.name}.")
    else:
        design_text = design_path.read_text(encoding="utf-8")
        test1_block = re.search(
            r"####\s*Test 1:.*?(?=####\s*Test 2:|\Z)",
            design_text,
            flags=re.DOTALL,
        )
        if not test1_block:
            reasons.append("Test 1 section not found in DESIGN.md.")
        else:
            block = test1_block.group(0)
            if "Pending" in block:
                reasons.append("DESIGN.md Section 9 (Test 1: Radio Cut) still contains 'Pending'.")

    return len(reasons) == 0, reasons


def _call_cloudflare_flux(
    account_id: str,
    api_token: str,
    model: str,
    prompt: str,
    width: int,
    height: int,
    seed: int,
    timeout: int = 120,
) -> bytes:
    """Invoke Cloudflare Workers AI FLUX endpoint with bounded retries and return PNG/image bytes."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    headers = {"Authorization": f"Bearer {api_token}"}

    max_attempts = 4
    last_exc: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            if "flux-2" in model:
                # Cloudflare flux-2-klein-4b requires multipart/form-data (fixed 4 steps)
                files = {
                    "prompt": (None, prompt),
                    "width": (None, str(width)),
                    "height": (None, str(height)),
                    "seed": (None, str(seed)),
                }
                resp = requests.post(url, headers=headers, files=files, timeout=timeout)
            else:
                # Fallback @cf/black-forest-labs/flux-1-schnell expects application/json
                payload = {"prompt": prompt, "steps": 4}
                resp = requests.post(url, headers=headers, json=payload, timeout=timeout)

            if resp.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"Transient HTTP {resp.status_code} from Cloudflare Workers AI")
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            if "application/json" in content_type or resp.text.lstrip().startswith("{"):
                data = resp.json()
                if not data.get("success", True):
                    raise RuntimeError(f"Cloudflare API error: {data.get('errors')}")
                b64_img = (data.get("result") or {}).get("image")
                if not b64_img:
                    raise RuntimeError("Cloudflare response missing result.image base64 field.")
                return base64.b64decode(b64_img)
            return resp.content
        except Exception as exc:
            last_exc = exc
            msg = str(exc)
            retryable = any(code in msg for code in ("429", "500", "502", "503", "504", "Timeout", "Connection"))
            if not retryable or attempt == max_attempts:
                raise
            time.sleep(min(30.0, 2.0 * (2 ** (attempt - 1))))

    assert last_exc is not None
    raise last_exc


def _save_validated_png(raw_bytes: bytes, out_path: Path) -> tuple[int, int]:
    """Decode generated image bytes, validate non-empty dimensions, and save as PNG."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(raw_bytes)) as img:
        rgb = img.convert("RGB")
        width, height = rgb.size
        if width < 256 or height < 256:
            raise ValueError(f"Generated reference image too small: {width}x{height}")
        rgb.save(out_path, format="PNG")
    return width, height


def generate_references(
    ref_ids: list[str] | None = None,
    model: str = DEFAULT_FLUX_MODEL,
    force: bool = False,
    require_audience_test_1: bool = True,
    root_dir: Path = ROOT_DIR,
) -> dict[str, Any]:
    """Generate Step 6 character and environment reference PNGs into assets/references/."""
    if require_audience_test_1:
        ok, reasons = check_audience_test_1_complete(
            audience_test_path=root_dir / "docs" / "AUDIENCE_TEST_1.md",
            design_path=root_dir / "DESIGN.md",
        )
        if not ok:
            raise RuntimeError(
                "Step 6 image generation blocked until Audience Test 1 is complete: "
                + " ".join(reasons)
            )

    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    refs_dir = root_dir / "assets" / "references"
    cache_file = refs_dir / "references_cache.json"
    runs_path = root_dir / "runs.jsonl"

    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)

    account_id = load_secret("CLOUDFLARE_ACCOUNT_ID")
    api_token = load_secret("CLOUDFLARE_API_TOKEN")

    cache = load_cache(cache_file)
    refs_dir.mkdir(parents=True, exist_ok=True)
    selected = set(ref_ids) if ref_ids else None

    generated = 0
    cached = 0
    try:
        for ref in storyboard.get("style_guide", {}).get("reference_sheets", []):
            rid = ref["reference_id"]
            if selected and rid not in selected:
                continue
            if rid not in REFERENCE_SPECS:
                raise KeyError(f"No reference prompt specification defined for '{rid}'.")

            spec = REFERENCE_SPECS[rid]
            rel_out = f"assets/references/{rid}.png"
            out_path = root_dir / rel_out

            cache_payload = {
                "reference_id": rid,
                "model": model,
                "prompt": spec["prompt"],
                "width": spec["width"],
                "height": spec["height"],
                "seed": spec["seed"],
            }
            input_hash = compute_hash(cache_payload)
            cached_entry = cache.get(rid)

            if (
                not force
                and cached_entry
                and cached_entry.get("input_hash") == input_hash
                and out_path.exists()
                and out_path.stat().st_size > 1000
            ):
                ref["file_path"] = rel_out
                cached += 1
                continue

            t0 = time.perf_counter()
            try:
                raw_bytes = _call_cloudflare_flux(
                    account_id=account_id,
                    api_token=api_token,
                    model=model,
                    prompt=spec["prompt"],
                    width=spec["width"],
                    height=spec["height"],
                    seed=spec["seed"],
                )
                latency_s = round(time.perf_counter() - t0, 3)
                actual_w, actual_h = _save_validated_png(raw_bytes, out_path)
                ref["file_path"] = rel_out

                cache[rid] = {
                    "input_hash": input_hash,
                    "model": model,
                    "seed": spec["seed"],
                    "width": actual_w,
                    "height": actual_h,
                    "output_path": rel_out,
                }
                save_cache(cache_file, cache)

                append_run_log(
                    {
                        "stage": "references",
                        "shot_id": rid,
                        "provider": "cloudflare_workers_ai",
                        "model": model,
                        "parameters": {
                            "width": actual_w,
                            "height": actual_h,
                            "steps": 4,
                        },
                        "seed": spec["seed"],
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
                append_run_log(
                    {
                        "stage": "references",
                        "shot_id": rid,
                        "provider": "cloudflare_workers_ai",
                        "model": model,
                        "parameters": {"width": spec["width"], "height": spec["height"]},
                        "seed": spec["seed"],
                        "latency_seconds": latency_s,
                        "estimated_cost_usd": 0.0,
                        "status": "error",
                        "error": f"{type(exc).__name__}: {str(exc)[:300]}",
                    },
                    log_path=runs_path,
                )
                raise
    finally:
        save_storyboard(storyboard, path=sb_path, schema_path=schema_path)

    return {"model": model, "generated": generated, "cached": cached}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Step 6 character & visual-style reference sheets.")
    parser.add_argument("--refs", nargs="*", help="Optional specific reference IDs to generate.")
    parser.add_argument("--model", default=DEFAULT_FLUX_MODEL, help="Cloudflare Workers AI FLUX model ID.")
    parser.add_argument("--force", action="store_true", help="Ignore cache and regenerate selected references.")
    args = parser.parse_args()
    result = generate_references(ref_ids=args.refs, model=args.model, force=args.force)
    print(result)


if __name__ == "__main__":
    main()
