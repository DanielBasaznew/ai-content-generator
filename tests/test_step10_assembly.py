"""Unit and artifact verification tests for Step 10 FFmpeg assembly."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.assembly import (
    HORIZONTAL_OUTPUT_REL,
    INTERMEDIATE_DIR_REL,
    VERTICAL_OUTPUT_REL,
    build_subtitle_cues,
    compute_shot_transition_schedule,
    probe_media,
    render_end_card_png,
    write_ass_subtitles,
)
from pipeline.common import load_storyboard


class TestStep10AssemblyHelpers(unittest.TestCase):
    """Verify deterministic transition scheduling, safe-area subtitle wrapping, and end card rendering."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.storyboard = load_storyboard(ROOT_DIR / "storyboard.json")

    def test_transition_schedule_sums_to_exact_target_duration(self) -> None:
        schedule = compute_shot_transition_schedule(self.storyboard)
        self.assertEqual(len(schedule), 10)
        # Sum of normalized segments minus the 9 xfade overlaps must equal exact target_duration_seconds (80.0s)
        total_segments = sum(item["segment_duration"] for item in schedule)
        total_overlaps = sum(item["join_after_duration"] for item in schedule[:-1])
        self.assertAlmostEqual(
            total_segments - total_overlaps,
            float(self.storyboard["project"]["target_duration_seconds"]),
            places=2,
        )
        # First join offset must sit centered on shot-01 end boundary
        self.assertAlmostEqual(
            schedule[0]["join_after_offset"] + schedule[0]["join_after_duration"] / 2.0,
            float(self.storyboard["shots"][0]["end_seconds"]),
            places=2,
        )

    def test_subtitle_wrapping_respects_aspect_safe_limits(self) -> None:
        for aspect_key in ("vertical", "horizontal"):
            cfg = self.storyboard["outputs"][aspect_key]
            max_chars = int(cfg["subtitle_style"]["max_chars_per_line"])
            max_lines = int(cfg["subtitle_style"]["max_lines"])
            cues = build_subtitle_cues(
                self.storyboard,
                max_chars_per_line=max_chars,
                max_lines=max_lines,
                root_dir=ROOT_DIR,
            )
            self.assertGreaterEqual(len(cues), 10)
            for cue in cues:
                self.assertLess(cue["start"], cue["end"])
                lines = cue["text"].split("\\N")
                self.assertLessEqual(len(lines), max_lines)
                for line in lines:
                    self.assertLessEqual(len(line), max_chars)

    def test_ass_and_end_card_render_into_temp_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            ass_v = write_ass_subtitles(self.storyboard, aspect_key="vertical", out_ass=tmp_dir / "v.ass", root_dir=ROOT_DIR)
            self.assertTrue(ass_v.exists())
            ass_text = ass_v.read_text(encoding="utf-8")
            self.assertIn("PlayResX: 1080", ass_text)
            self.assertIn("PlayResY: 1920", ass_text)

            card_h = render_end_card_png(self.storyboard, aspect_key="horizontal", out_png=tmp_dir / "card_h.png")
            self.assertTrue(card_h.exists())
            self.assertGreater(card_h.stat().st_size, 10_000)


class TestStep10OnDiskDeliverables(unittest.TestCase):
    """Verify final 9:16 and 16:9 exported MP4s and intermediate isolation on disk."""

    def test_both_final_mp4_exports_exist_with_exact_specs(self) -> None:
        sb = load_storyboard(ROOT_DIR / "storyboard.json")
        expected_dur = float(sb["project"]["target_duration_seconds"]) + float(sb["outputs"]["end_card"]["duration_seconds"])

        v_path = ROOT_DIR / VERTICAL_OUTPUT_REL
        h_path = ROOT_DIR / HORIZONTAL_OUTPUT_REL
        self.assertTrue(v_path.exists(), f"Missing deliverable: {v_path}")
        self.assertTrue(h_path.exists(), f"Missing deliverable: {h_path}")

        # Deliverables directories must not contain stray intermediate build clutter
        v_files = [p.name for p in (ROOT_DIR / "outputs" / "vertical").iterdir() if p.is_file()]
        h_files = [p.name for p in (ROOT_DIR / "outputs" / "horizontal").iterdir() if p.is_file()]
        self.assertEqual(v_files, [v_path.name])
        self.assertEqual(h_files, [h_path.name])

        for path, exp_w, exp_h in ((v_path, 1080, 1920), (h_path, 1920, 1080)):
            probe = probe_media(path)
            self.assertEqual(probe["width"], exp_w)
            self.assertEqual(probe["height"], exp_h)
            self.assertEqual(probe["fps"], "24/1")
            self.assertEqual(probe["video_codec"], "h264")
            self.assertEqual(probe["audio_codec"], "aac")
            self.assertEqual(probe["sample_rate_hz"], 48000)
            self.assertEqual(probe["channels"], 2)
            self.assertAlmostEqual(probe["duration_seconds"], expected_dur, delta=0.15)
            self.assertAlmostEqual(probe["integrated_lufs"], -14.0, delta=0.8)
            self.assertLessEqual(probe["true_peak_dbtp"], -0.8)

        manifest_path = ROOT_DIR / INTERMEDIATE_DIR_REL / "assembly_manifest.json"
        self.assertTrue(manifest_path.exists())
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["vertical_output"], VERTICAL_OUTPUT_REL)
        self.assertEqual(manifest["horizontal_output"], HORIZONTAL_OUTPUT_REL)


if __name__ == "__main__":
    unittest.main()
