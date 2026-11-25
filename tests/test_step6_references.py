"""Unit tests for Step 6 reference-sheet preparation and Audience Test 1 gate."""

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

from pipeline.references import (
    DEFAULT_FLUX_MODEL,
    REFERENCE_SPECS,
    check_audience_test_1_complete,
    generate_references,
)


def _dummy_png_b64(width: int = 512, height: int = 512) -> str:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), color=(190, 140, 95)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


class TestStep6ReferencesPrep(unittest.TestCase):
    """Verify Step 6 reference specs, gating, caching, and mocked Cloudflare generation."""

    def test_audience_test_1_gate_blocks_when_incomplete(self) -> None:
        complete, reasons = check_audience_test_1_complete()
        self.assertFalse(complete)
        self.assertGreaterEqual(len(reasons), 1)
        with self.assertRaises(RuntimeError):
            generate_references(require_audience_test_1=True)

    def test_storyboard_reference_ids_have_specs_and_remain_ungenerated(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        refs = sb["style_guide"]["reference_sheets"]
        self.assertEqual(len(refs), 4)
        for ref in refs:
            self.assertIn(ref["reference_id"], REFERENCE_SPECS)
            self.assertIsNone(ref["file_path"])
            self.assertTrue(ref["ai_generated"])

    def test_generate_references_with_mocked_cloudflare_and_caching(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "schema").mkdir()
            (tmp_root / "docs").mkdir()
            (tmp_root / "assets" / "references").mkdir(parents=True)
            shutil.copy2(ROOT_DIR / "schema" / "storyboard.schema.json", tmp_root / "schema" / "storyboard.schema.json")
            shutil.copy2(ROOT_DIR / "storyboard.json", tmp_root / "storyboard.json")
            (tmp_root / "runs.jsonl").write_text("", encoding="utf-8")

            # Simulate completed Audience Test 1 and DESIGN.md in temp workspace
            (tmp_root / "docs" / "AUDIENCE_TEST_1.md").write_text(
                "\n".join(["   - *Response:* Clear and emotional."] * 18),
                encoding="utf-8",
            )
            (tmp_root / "DESIGN.md").write_text(
                "#### Test 1: Radio Cut (Audio Prototype)\n- **Date:** 2026-11-26\n#### Test 2: Near-Final Cut\n",
                encoding="utf-8",
            )

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.headers = {"content-type": "application/json"}
            mock_resp.text = '{"success": true}'
            mock_resp.json.return_value = {
                "success": True,
                "result": {"image": _dummy_png_b64(1024, 1024)},
            }

            with (
                patch("pipeline.references.load_secret", side_effect=lambda k: f"mock_{k}"),
                patch("pipeline.references.requests.post", return_value=mock_resp) as mock_post,
            ):
                res1 = generate_references(root_dir=tmp_root)
                self.assertEqual(res1, {"model": DEFAULT_FLUX_MODEL, "generated": 4, "cached": 0})
                self.assertEqual(mock_post.call_count, 4)

                # Verify multipart form usage for flux-2-klein-4b
                first_call_kwargs = mock_post.call_args_list[0].kwargs
                self.assertIn("files", first_call_kwargs)
                self.assertIn("prompt", first_call_kwargs["files"])

                # Verify caching skips all 4 on second run
                res2 = generate_references(root_dir=tmp_root)
                self.assertEqual(res2, {"model": DEFAULT_FLUX_MODEL, "generated": 0, "cached": 4})
                self.assertEqual(mock_post.call_count, 4)

            updated_sb = json.loads((tmp_root / "storyboard.json").read_text(encoding="utf-8"))
            for ref in updated_sb["style_guide"]["reference_sheets"]:
                rel = ref["file_path"]
                self.assertIsNotNone(rel)
                self.assertTrue((tmp_root / rel).exists())

            log_lines = [
                json.loads(line)
                for line in (tmp_root / "runs.jsonl").read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            self.assertEqual(len(log_lines), 4)
            self.assertTrue(all(line["stage"] == "references" and line["seed"] is not None for line in log_lines))


if __name__ == "__main__":
    unittest.main()
