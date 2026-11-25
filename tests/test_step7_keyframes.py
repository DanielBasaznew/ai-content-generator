"""Unit tests for Step 7 shot keyframe generation, reference prep, and verification."""

from __future__ import annotations

import base64
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.cloudflare_flux import DEFAULT_FLUX_MODEL, prepare_reference_image_bytes
from pipeline.keyframes import (
    CHARACTER_PANEL_CROPS,
    SHOT_CHARACTER_VIEW,
    build_keyframe_prompt,
    generate_keyframes,
)


def _dummy_png_b64(width: int = 1024, height: int = 1024) -> str:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), color=(185, 138, 92)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


class TestStep7Keyframes(unittest.TestCase):
    """Verify Step 7 keyframe prompts, <=512px reference prep, caching, and disk outputs."""

    def test_prepare_reference_image_bytes_downscales_and_crops(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "char_sheet.png"
            Image.new("RGB", (1344, 768), color=(200, 150, 100)).save(src, format="PNG")

            full_bytes = prepare_reference_image_bytes(src, max_dim=512)
            with Image.open(io.BytesIO(full_bytes)) as full_img:
                self.assertLessEqual(max(full_img.size), 512)

            back_bytes = prepare_reference_image_bytes(
                src, max_dim=512, crop_box_norm=CHARACTER_PANEL_CROPS["back"]
            )
            with Image.open(io.BytesIO(back_bytes)) as back_img:
                self.assertLessEqual(max(back_img.size), 512)
                self.assertLess(back_img.width, back_img.height)

    def test_build_keyframe_prompt_includes_identity_style_and_framing(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        shot4 = next(s for s in sb["shots"] if s["shot_id"] == "shot-04")
        prompt = build_keyframe_prompt(sb, shot4)
        self.assertIn("not a collage", prompt)
        self.assertIn("middle 56% safe frame", prompt)
        self.assertIn("Match the character identity, skin tone, curly hair, and exact outfit", prompt)
        self.assertIn("No text, no subtitles", prompt)

    def test_storyboard_keyframes_and_run_log_verified_on_disk(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        self.assertEqual(len(sb["shots"]), 10)

        for shot in sb["shots"]:
            sid = shot["shot_id"]
            self.assertTrue(shot["provenance"]["uses_ai_imagery"])
            self.assertFalse(shot["provenance"]["is_authentic_historical_photo"])

            img_cfg = shot["generation"]["image"]
            self.assertEqual(img_cfg["provider"], "cloudflare_workers_ai")
            self.assertEqual(img_cfg["model"], DEFAULT_FLUX_MODEL)
            self.assertIsNotNone(img_cfg["seed"])

            rel_path = img_cfg["keyframe_path"]
            self.assertEqual(rel_path, f"assets/keyframes/{sid}.png")
            kf_path = ROOT_DIR / rel_path
            self.assertTrue(kf_path.exists(), f"Missing generated keyframe PNG: {kf_path}")
            with Image.open(kf_path) as img:
                self.assertEqual(img.size, (1024, 1024))

        shot8 = next(s for s in sb["shots"] if s["shot_id"] == "shot-08")
        self.assertEqual(shot8["editing"]["composition"]["vertical_9_16"]["crop_anchor"], "left")

        log_rows = [
            json.loads(line)
            for line in (ROOT_DIR / "runs.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        kf_success = {
            row["shot_id"]
            for row in log_rows
            if row.get("stage") == "keyframes" and row.get("status") == "success" and row.get("seed") is not None
        }
        self.assertEqual(kf_success, {f"shot-{i:02d}" for i in range(1, 11)})

    def test_generate_keyframes_with_mocked_cloudflare_and_caching(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "schema").mkdir()
            (tmp_root / "assets" / "references").mkdir(parents=True)
            (tmp_root / "assets" / "keyframes").mkdir(parents=True)
            shutil.copy2(ROOT_DIR / "schema" / "storyboard.schema.json", tmp_root / "schema" / "storyboard.schema.json")
            shutil.copy2(ROOT_DIR / "storyboard.json", tmp_root / "storyboard.json")
            for ref_file in (ROOT_DIR / "assets" / "references").glob("*.png"):
                shutil.copy2(ref_file, tmp_root / "assets" / "references" / ref_file.name)
            (tmp_root / "runs.jsonl").write_text("", encoding="utf-8")

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.headers = {"content-type": "application/json"}
            mock_resp.text = '{"success": true}'
            mock_resp.json.return_value = {
                "success": True,
                "result": {"image": _dummy_png_b64(1024, 1024)},
            }

            with (
                patch("pipeline.keyframes.load_secret", side_effect=lambda k: f"mock_{k}"),
                patch("pipeline.cloudflare_flux.requests.post", return_value=mock_resp) as mock_post,
            ):
                res1 = generate_keyframes(root_dir=tmp_root)
                self.assertEqual(res1, {"model": DEFAULT_FLUX_MODEL, "generated": 10, "cached": 0})
                self.assertEqual(mock_post.call_count, 10)

                # Verify shot-03 (3rd call) sends two <=512px input_image_* attachments
                shot3_call_files = mock_post.call_args_list[2].kwargs["files"]
                self.assertIn("input_image_0", shot3_call_files)
                self.assertIn("input_image_1", shot3_call_files)
                self.assertIn("shot-03", SHOT_CHARACTER_VIEW)

                # Verify second run hits SHA-256 cache for all 10 shots
                res2 = generate_keyframes(root_dir=tmp_root)
                self.assertEqual(res2, {"model": DEFAULT_FLUX_MODEL, "generated": 0, "cached": 10})
                self.assertEqual(mock_post.call_count, 10)

            updated_sb = json.loads((tmp_root / "storyboard.json").read_text(encoding="utf-8"))
            for shot in updated_sb["shots"]:
                rel = shot["generation"]["image"]["keyframe_path"]
                self.assertIsNotNone(rel)
                self.assertTrue((tmp_root / rel).exists())

            log_lines = [
                json.loads(line)
                for line in (tmp_root / "runs.jsonl").read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            self.assertEqual(len(log_lines), 10)
            self.assertTrue(all(line["stage"] == "keyframes" and line["seed"] is not None for line in log_lines))


if __name__ == "__main__":
    unittest.main()
