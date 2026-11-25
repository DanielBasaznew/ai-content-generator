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

    def test_audience_test_1_gate_blocks_when_pending(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            aud = tmp_dir / "AUDIENCE_TEST_1.md"
            des = tmp_dir / "DESIGN.md"
            aud.write_text("## 4. Synthesis *(Complete After Testing)*\n- *(To be filled after real participant sessions)*\n", encoding="utf-8")
            des.write_text("#### Test 1: Radio Cut\n- **Date:** Pending\n#### Test 2: Near-Final Cut\n", encoding="utf-8")
            complete, reasons = check_audience_test_1_complete(audience_test_path=aud, design_path=des)
            self.assertFalse(complete)
            self.assertGreaterEqual(len(reasons), 2)

    def test_audience_test_1_gate_passes_on_recorded_project_docs(self) -> None:
        complete, reasons = check_audience_test_1_complete()
        self.assertTrue(complete, msg=f"Unexpected gate failure: {reasons}")

    def test_storyboard_reference_ids_and_generated_pngs(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        refs = sb["style_guide"]["reference_sheets"]
        self.assertEqual(len(refs), 4)
        for ref in refs:
            rid = ref["reference_id"]
            self.assertIn(rid, REFERENCE_SPECS)
            self.assertTrue(ref["ai_generated"])
            rel_path = ref["file_path"]
            self.assertIsNotNone(rel_path)
            img_path = ROOT_DIR / rel_path
            self.assertTrue(img_path.exists(), f"Missing generated reference PNG: {img_path}")
            with Image.open(img_path) as img:
                self.assertEqual(img.size, (REFERENCE_SPECS[rid]["width"], REFERENCE_SPECS[rid]["height"]))

        log_rows = [
            json.loads(line)
            for line in (ROOT_DIR / "runs.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        ref_success = {
            row["shot_id"]
            for row in log_rows
            if row.get("stage") == "references" and row.get("status") == "success" and row.get("seed") is not None
        }
        self.assertEqual(
            ref_success,
            {"ref_narrator_child", "ref_narrator_adult", "ref_harar_roundabout_memory", "ref_harar_streets"},
        )

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
                patch("pipeline.cloudflare_flux.requests.post", return_value=mock_resp) as mock_post,
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
