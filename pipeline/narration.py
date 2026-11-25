"""Stage: Amharic narration synthesis via Gemini TTS with caching and retries."""

from __future__ import annotations

import argparse
import io
import re
import time
import wave
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

from pipeline.common import (
    ROOT_DIR,
    append_run_log,
    compute_hash,
    load_cache,
    load_secret,
    load_storyboard,
    measure_wav_duration,
    save_cache,
    save_storyboard,
    validate_storyboard,
)

DEFAULT_TTS_MODEL = "gemini-3.8-flash-tts"
DEFAULT_VOICE_NAME = "Charon"
DEFAULT_MIN_INTERVAL_SECONDS = 21.0  # Free-tier gemini-3.8-flash-tts allows 3 requests/minute
NARRATION_DIR = ROOT_DIR / "assets" / "narration"
CACHE_PATH = NARRATION_DIR / "narration_cache.json"


class TransientTTSError(RuntimeError):
    """Retryable error for Gemini TTS calls."""

    def __init__(self, message: str, retry_after_seconds: float | None = None) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


def _extract_retry_after(message: str) -> float | None:
    """Parse Gemini API retryDelay / 'retry in Xs' hints from 429 messages."""
    m1 = re.search(r"retry in ([0-9]+(?:\.[0-9]+)?)s", message, re.IGNORECASE)
    if m1:
        return float(m1.group(1))
    m2 = re.search(r"retryDelay['\"]?:\s*['\"]([0-9]+)s['\"]", message)
    if m2:
        return float(m2.group(1))
    return None


def _parse_pcm_rate(mime_type: str | None) -> int:
    """Extract sample rate from audio mime type, defaulting to 24000 Hz."""
    if mime_type:
        match = re.search(r"rate=(\d+)", mime_type)
        if match:
            return int(match.group(1))
    return 24000


def _write_audio_as_wav(raw_bytes: bytes, mime_type: str | None, out_path: Path) -> int:
    """Write Gemini audio payload (WAV or raw L16 PCM) to a standard 16-bit WAV file."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if raw_bytes[:4] == b"RIFF":
        out_path.write_bytes(raw_bytes)
        with wave.open(io.BytesIO(raw_bytes), "rb") as wf:
            return wf.getframerate()

    sample_rate = _parse_pcm_rate(mime_type)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(raw_bytes)
    return sample_rate


def _extract_audio_part(response: Any) -> tuple[bytes, str | None]:
    """Extract audio bytes and mime type from a Gemini generate_content response."""
    candidates = getattr(response, "candidates", None) or []
    for cand in candidates:
        content = getattr(cand, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                return inline.data, getattr(inline, "mime_type", None)
    raise RuntimeError("Gemini TTS response did not contain inline audio data.")


def _synthesize_with_retry(
    client: genai.Client,
    model: str,
    voice_name: str,
    language_code: str | None,
    prompt_text: str,
) -> tuple[bytes, str | None, dict[str, Any]]:
    """Invoke Gemini TTS with rate-limit-aware retries."""
    max_attempts = 5
    last_exc: Exception | None = None
    speech_cfg = types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
        ),
        language_code=language_code,
    )
    config = types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=speech_cfg,
    )

    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt_text,
                config=config,
            )
            audio_bytes, mime_type = _extract_audio_part(response)
            usage = getattr(response, "usage_metadata", None)
            usage_info = {
                "prompt_tokens": getattr(usage, "prompt_token_count", None) if usage else None,
                "output_tokens": getattr(usage, "candidates_token_count", None) if usage else None,
                "total_tokens": getattr(usage, "total_token_count", None) if usage else None,
            }
            return audio_bytes, mime_type, usage_info
        except Exception as exc:
            msg = str(exc)
            is_transient = any(
                code in msg for code in ("429", "500", "502", "503", "504", "RESOURCE_EXHAUSTED", "UNAVAILABLE")
            )
            if not is_transient or attempt == max_attempts:
                raise
            hint = _extract_retry_after(msg)
            delay = (hint + 2.0) if hint is not None else min(65.0, 4.0 * (2 ** (attempt - 1)))
            last_exc = exc
            time.sleep(delay)

    assert last_exc is not None
    raise last_exc


def generate_narration(
    shot_ids: list[str] | None = None,
    model_override: str | None = None,
    voice_override: str | None = None,
    force: bool = False,
    style_prefix: str = "",
    min_interval_seconds: float = DEFAULT_MIN_INTERVAL_SECONDS,
    client: Any | None = None,
) -> dict[str, Any]:
    """Generate cached Amharic narration WAV clips for storyboard shots."""
    storyboard = load_storyboard()
    validate_storyboard(storyboard)

    narration_cfg = storyboard["narration_config"]
    voice_cfg = narration_cfg.setdefault("voice_settings", {})
    model = model_override or voice_cfg.get("model") or DEFAULT_TTS_MODEL
    voice_name = voice_override or voice_cfg.get("voice_id") or DEFAULT_VOICE_NAME
    language_code = narration_cfg.get("language_code") or "am"
    speaking_style = voice_cfg.get("speaking_style") or "calm, warm, reflective, unhurried"

    voice_cfg["provider"] = "gemini"
    voice_cfg["model"] = model
    voice_cfg["voice_id"] = voice_name

    if client is None:
        api_key = load_secret("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)

    cache = load_cache(CACHE_PATH)
    NARRATION_DIR.mkdir(parents=True, exist_ok=True)
    selected_ids = set(shot_ids) if shot_ids else None

    generated_count = 0
    cached_count = 0
    sample_rate_hz: int | None = None
    last_api_call_at: float | None = None

    try:
        for shot in storyboard["shots"]:
            sid = shot["shot_id"]
            if selected_ids and sid not in selected_ids:
                continue

            text = shot["narrative"]["narration_text"].strip()
            if not text:
                continue

            prompt_text = f"{style_prefix}{text}" if style_prefix else text
            rel_out = f"assets/narration/{sid}.wav"
            out_path = ROOT_DIR / rel_out

            cache_payload = {
                "shot_id": sid,
                "model": model,
                "voice_name": voice_name,
                "language_code": language_code,
                "prompt_text": prompt_text,
            }
            input_hash = compute_hash(cache_payload)
            cached_entry = cache.get(sid)

            if (
                not force
                and cached_entry
                and cached_entry.get("input_hash") == input_hash
                and out_path.exists()
                and out_path.stat().st_size > 44
            ):
                duration_s = measure_wav_duration(out_path)
                sync = shot["audio"].setdefault("narration_sync", {})
                sync["audio_path"] = rel_out
                sync["actual_duration_seconds"] = duration_s
                sample_rate_hz = cached_entry.get("sample_rate_hz") or sample_rate_hz
                cached_count += 1
                continue

            if last_api_call_at is not None and min_interval_seconds > 0:
                elapsed = time.monotonic() - last_api_call_at
                if elapsed < min_interval_seconds:
                    time.sleep(min_interval_seconds - elapsed)

            t0 = time.perf_counter()
            last_api_call_at = time.monotonic()
            try:
                audio_bytes, mime_type, usage_info = _synthesize_with_retry(
                    client=client,
                    model=model,
                    voice_name=voice_name,
                    language_code=language_code,
                    prompt_text=prompt_text,
                )
                latency_s = round(time.perf_counter() - t0, 3)
                sr = _write_audio_as_wav(audio_bytes, mime_type, out_path)
                duration_s = measure_wav_duration(out_path)
                sample_rate_hz = sr

                sync = shot["audio"].setdefault("narration_sync", {})
                sync["audio_path"] = rel_out
                sync["actual_duration_seconds"] = duration_s

                cache[sid] = {
                    "input_hash": input_hash,
                    "model": model,
                    "voice_name": voice_name,
                    "sample_rate_hz": sr,
                    "duration_seconds": duration_s,
                    "output_path": rel_out,
                }
                save_cache(CACHE_PATH, cache)

                append_run_log(
                    {
                        "stage": "narration",
                        "shot_id": sid,
                        "provider": "gemini",
                        "model": model,
                        "parameters": {
                            "voice_name": voice_name,
                            "language_code": language_code,
                            "speaking_style": speaking_style,
                            "style_prefix_used": bool(style_prefix),
                            "sample_rate_hz": sr,
                        },
                        "seed": None,
                        "latency_seconds": latency_s,
                        "usage": usage_info,
                        "estimated_cost_usd": 0.0,
                        "status": "success",
                        "output_path": rel_out,
                        "duration_seconds": duration_s,
                    }
                )
                generated_count += 1
            except Exception as exc:
                latency_s = round(time.perf_counter() - t0, 3)
                append_run_log(
                    {
                        "stage": "narration",
                        "shot_id": sid,
                        "provider": "gemini",
                        "model": model,
                        "parameters": {
                            "voice_name": voice_name,
                            "language_code": language_code,
                        },
                        "seed": None,
                        "latency_seconds": latency_s,
                        "estimated_cost_usd": 0.0,
                        "status": "error",
                        "error": f"{type(exc).__name__}: {str(exc)[:300]}",
                    }
                )
                raise
    finally:
        if sample_rate_hz is not None:
            voice_cfg["sample_rate_hz"] = sample_rate_hz
        save_storyboard(storyboard)
    return {
        "model": model,
        "voice_name": voice_name,
        "generated": generated_count,
        "cached": cached_count,
        "sample_rate_hz": sample_rate_hz,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Amharic narration WAVs using Gemini TTS.")
    parser.add_argument("--shots", nargs="*", help="Optional specific shot IDs to regenerate.")
    parser.add_argument("--model", default=None, help="Override Gemini TTS model name.")
    parser.add_argument("--voice", default=None, help="Override prebuilt Gemini voice name.")
    parser.add_argument("--force", action="store_true", help="Ignore cache and regenerate selected shots.")
    args = parser.parse_args()

    result = generate_narration(
        shot_ids=args.shots,
        model_override=args.model,
        voice_override=args.voice,
        force=args.force,
    )
    print(result)


if __name__ == "__main__":
    main()
