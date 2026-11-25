"""Shared Cloudflare Workers AI FLUX client with retries, input resizing, and PNG validation."""

from __future__ import annotations

import base64
import io
import time
from pathlib import Path

import requests
from PIL import Image

DEFAULT_FLUX_MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
FALLBACK_FLUX_MODEL = "@cf/black-forest-labs/flux-1-schnell"


def prepare_reference_image_bytes(
    image_path: Path,
    max_dim: int = 512,
    crop_box_norm: tuple[float, float, float, float] | None = None,
) -> bytes:
    """Load, optionally crop, downscale (<=512px), and encode a reference PNG for Workers AI."""
    with Image.open(image_path) as img:
        rgb = img.convert("RGB")
        if crop_box_norm is not None:
            w, h = rgb.size
            x0, y0, x1, y1 = crop_box_norm
            rgb = rgb.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
        rgb.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        rgb.save(buf, format="PNG")
        return buf.getvalue()


def call_cloudflare_flux(
    account_id: str,
    api_token: str,
    model: str,
    prompt: str,
    width: int,
    height: int,
    seed: int,
    input_images: list[tuple[str, bytes]] | None = None,
    timeout: int = 120,
) -> bytes:
    """Invoke Cloudflare Workers AI FLUX endpoint with bounded retries and return image bytes."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    headers = {"Authorization": f"Bearer {api_token}"}

    max_attempts = 4
    last_exc: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            if "flux-2" in model:
                # Cloudflare flux-2-klein-4b requires multipart/form-data (fixed 4 steps)
                files: dict[str, tuple[str | None, str | bytes] | tuple[str, bytes, str]] = {
                    "prompt": (None, prompt),
                    "width": (None, str(width)),
                    "height": (None, str(height)),
                    "seed": (None, str(seed)),
                }
                for idx, (fname, img_bytes) in enumerate((input_images or [])[:4]):
                    files[f"input_image_{idx}"] = (fname, img_bytes, "image/png")
                resp = requests.post(url, headers=headers, files=files, timeout=timeout)
            else:
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
            retryable = any(
                code in msg for code in ("429", "500", "502", "503", "504", "Timeout", "Connection")
            )
            if not retryable or attempt == max_attempts:
                raise
            time.sleep(min(30.0, 2.0 * (2 ** (attempt - 1))))

    assert last_exc is not None
    raise last_exc


def save_validated_png(raw_bytes: bytes, out_path: Path, min_dim: int = 256) -> tuple[int, int]:
    """Decode generated image bytes, validate non-empty dimensions, and save as PNG."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(raw_bytes)) as img:
        rgb = img.convert("RGB")
        width, height = rgb.size
        if width < min_dim or height < min_dim:
            raise ValueError(f"Generated image too small: {width}x{height}")
        rgb.save(out_path, format="PNG")
    return width, height
