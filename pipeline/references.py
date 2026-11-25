"""Stage: Generate character and visual-style reference sheets via Cloudflare FLUX."""

from __future__ import annotations

import argparse
import re
import time
from pathlib import Path
from typing import Any

from pipeline.cloudflare_flux import (
    DEFAULT_FLUX_MODEL,
    FALLBACK_FLUX_MODEL,
    call_cloudflare_flux,
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
    """Verify whether real Audience Test 1 feedback or synthesis is recorded."""
    reasons: list[str] = []
    if not audience_test_path.exists():
        reasons.append(f"Missing {audience_test_path.name}.")
    else:
        text = audience_test_path.read_text(encoding="utf-8")
        responses = re.findall(r"-\s*\*Response:\*\s*(.*)", text)
        filled_responses = [r.strip() for r in responses if r.strip()]
        has_synthesis = (
            "*(Complete After Testing)*" not in text
            and "*(To be filled after real participant sessions)*" not in text
        )
        if len(filled_responses) < 18 and not has_synthesis:
            reasons.append(
                f"{audience_test_path.name} has {len(filled_responses)}/18 answered participant questions "
                "and no recorded synthesis (requires real listener feedback before Step 6 image generation)."
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
                raw_bytes = call_cloudflare_flux(
                    account_id=account_id,
                    api_token=api_token,
                    model=model,
                    prompt=spec["prompt"],
                    width=spec["width"],
                    height=spec["height"],
                    seed=spec["seed"],
                )
                latency_s = round(time.perf_counter() - t0, 3)
                actual_w, actual_h = save_validated_png(raw_bytes, out_path)
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
                sanitized_err = str(exc).replace(account_id, "<ACCOUNT_ID>").replace(api_token, "<REDACTED>")
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
                        "error": f"{type(exc).__name__}: {sanitized_err[:300]}",
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
