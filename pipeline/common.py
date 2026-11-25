"""Shared configuration, validation, caching, and logging utilities."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import wave
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import imageio_ffmpeg
from dotenv import dotenv_values
from jsonschema import Draft202012Validator

ROOT_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT_DIR / "schema" / "storyboard.schema.json"
STORYBOARD_PATH = ROOT_DIR / "storyboard.json"
RUNS_LOG_PATH = ROOT_DIR / "runs.jsonl"


def load_secret(name: str) -> str:
    """Read a credential from .env or environment variables without exposing it."""
    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        values = dotenv_values(env_file)
        val = (values.get(name) or "").strip()
        if val:
            return val
    val = (os.environ.get(name) or "").strip()
    if val:
        return val
    raise RuntimeError(f"Required credential '{name}' is not configured in .env or environment.")


def load_storyboard(path: Path = STORYBOARD_PATH) -> dict[str, Any]:
    """Load storyboard JSON from disk."""
    return json.loads(path.read_text(encoding="utf-8"))


def save_storyboard(
    storyboard: dict[str, Any],
    path: Path = STORYBOARD_PATH,
    schema_path: Path = SCHEMA_PATH,
) -> None:
    """Validate and persist updated storyboard JSON cleanly."""
    validate_storyboard(storyboard, schema_path=schema_path)
    path.write_text(
        json.dumps(storyboard, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def validate_storyboard(storyboard: dict[str, Any], schema_path: Path = SCHEMA_PATH) -> None:
    """Enforce JSON Schema Draft 2020-12 and cross-field storyboard invariants."""
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    Draft202012Validator(schema).validate(storyboard)

    shots = storyboard["shots"]
    if len(shots) != 10:
        raise ValueError(f"Expected 10 shots, found {len(shots)}.")

    shot_ids = [shot["shot_id"] for shot in shots]
    if len(set(shot_ids)) != 10:
        raise ValueError(f"Duplicate shot_id values detected: {shot_ids}")

    orders = [shot["order"] for shot in shots]
    if orders != list(range(1, 11)):
        raise ValueError(f"Shot order must be contiguous 1..10, got {orders}")

    total_duration = sum(float(shot["duration_seconds"]) for shot in shots)
    if not (60.0 <= total_duration <= 90.0):
        raise ValueError(f"Total shot duration {total_duration:.2f}s must stay within 60-90s.")

    target = float(storyboard["project"]["target_duration_seconds"])
    if abs(total_duration - target) > 1e-6:
        raise ValueError(
            f"Summed shot duration ({total_duration:.3f}s) does not match target_duration_seconds ({target:.3f}s)."
        )

    cursor = 0.0
    for shot in shots:
        start = shot.get("start_seconds")
        end = shot.get("end_seconds")
        dur = float(shot["duration_seconds"])
        if start is not None and abs(float(start) - cursor) > 1e-6:
            raise ValueError(f"{shot['shot_id']} start_seconds={start} != expected {cursor:.3f}")
        if start is not None and end is not None and abs((float(end) - float(start)) - dur) > 1e-6:
            raise ValueError(f"{shot['shot_id']} end - start != duration_seconds ({dur})")
        cursor += dur

    defined_refs = {
        ref["reference_id"]
        for ref in storyboard.get("style_guide", {}).get("reference_sheets", [])
    }
    for shot in shots:
        for ref_id in shot["visual"].get("reference_ids", []):
            if ref_id not in defined_refs:
                raise ValueError(f"{shot['shot_id']} references unknown reference_id '{ref_id}'.")


def compute_hash(payload: dict[str, Any]) -> str:
    """Compute a deterministic SHA-256 hash for input-based caching."""
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def load_cache(cache_path: Path) -> dict[str, Any]:
    """Load stage cache metadata dictionary if present."""
    if not cache_path.exists():
        return {}
    return json.loads(cache_path.read_text(encoding="utf-8"))


def save_cache(cache_path: Path, cache_data: dict[str, Any]) -> None:
    """Persist stage cache metadata dictionary."""
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(cache_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def append_run_log(record: dict[str, Any], log_path: Path = RUNS_LOG_PATH) -> None:
    """Append one structured JSONL line representing a model call."""
    entry = {"timestamp_utc": datetime.now(timezone.utc).isoformat(), **record}
    line = json.dumps(entry, ensure_ascii=False) + "\n"
    if log_path.exists() and not log_path.read_text(encoding="utf-8").strip():
        log_path.write_text(line, encoding="utf-8")
        return
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(line)


def get_ffmpeg_exe() -> str:
    """Locate ffmpeg executable via system PATH or imageio-ffmpeg bundle."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def measure_wav_duration(wav_path: Path) -> float:
    """Return exact duration of a PCM WAV file in seconds."""
    with wave.open(str(wav_path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
    if rate <= 0:
        raise ValueError(f"Invalid sample rate in {wav_path}")
    return round(frames / float(rate), 3)
