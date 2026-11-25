"""Contract and cross-field validation tests for the live storyboard.json."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT_DIR / "schema" / "storyboard.schema.json"
STORYBOARD_PATH = ROOT_DIR / "storyboard.json"
NARRATION_REVIEW_PATH = ROOT_DIR / "docs" / "NARRATION_REVIEW.md"


class TestStoryboardContract(unittest.TestCase):
    """Validate storyboard.json against schema and cross-field project constraints."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        cls.storyboard = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))
        cls.narration_review = NARRATION_REVIEW_PATH.read_text(encoding="utf-8")

    def test_storyboard_matches_json_schema(self) -> None:
        Draft202012Validator(self.schema).validate(self.storyboard)

    def test_ten_shots_unique_ids_and_contiguous_order(self) -> None:
        shots = self.storyboard["shots"]
        self.assertEqual(len(shots), 10)
        shot_ids = [shot["shot_id"] for shot in shots]
        self.assertEqual(len(set(shot_ids)), 10)
        orders = [shot["order"] for shot in shots]
        self.assertEqual(orders, list(range(1, 11)))

    def test_duration_bounds_and_continuous_timeline(self) -> None:
        shots = self.storyboard["shots"]
        total_duration = sum(shot["duration_seconds"] for shot in shots)
        self.assertGreaterEqual(total_duration, 60.0)
        self.assertLessEqual(total_duration, 90.0)
        self.assertAlmostEqual(
            total_duration,
            self.storyboard["project"]["target_duration_seconds"],
            places=6,
        )

        cursor = 0.0
        for shot in shots:
            self.assertAlmostEqual(shot["start_seconds"], cursor, places=6)
            expected_end = shot["start_seconds"] + shot["duration_seconds"]
            self.assertAlmostEqual(shot["end_seconds"], expected_end, places=6)
            cursor = shot["end_seconds"]

    def test_reference_ids_and_ai_provenance_integrity(self) -> None:
        defined_refs = {
            ref["reference_id"]
            for ref in self.storyboard["style_guide"]["reference_sheets"]
        }
        for shot in self.storyboard["shots"]:
            for ref_id in shot["visual"].get("reference_ids", []):
                self.assertIn(ref_id, defined_refs)
            self.assertTrue(shot["provenance"]["uses_ai_imagery"])
            self.assertFalse(shot["provenance"]["is_authentic_historical_photo"])

    def test_narration_and_subtitles_synced_with_review_doc(self) -> None:
        for shot in self.storyboard["shots"]:
            self.assertIn(shot["narrative"]["narration_text"], self.narration_review)
            self.assertIn(
                shot["narrative"]["english_subtitle_text"],
                self.narration_review,
            )


if __name__ == "__main__":
    unittest.main()
