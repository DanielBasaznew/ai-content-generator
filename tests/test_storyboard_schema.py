"""Lightweight validation tests for schema/storyboard.schema.json.

Uses only Python's standard library unittest and the already-installed
jsonschema package with temporary in-memory structural fixtures.
Does not create storyboard.json or real production data.
"""

from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, ValidationError

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema" / "storyboard.schema.json"


def _load_schema() -> dict:
    with SCHEMA_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _make_minimal_shot(index: int) -> dict:
    """Create a minimal in-memory shot structure for schema validation tests."""
    return {
        "shot_id": f"shot-{index:02d}",
        "order": index,
        "duration_seconds": 7.0,
        "narrative": {
            "narration_text": f"Placeholder narration text for structural check {index}.",
            "english_subtitle_text": f"Placeholder English subtitle {index}.",
            "emotional_purpose": f"Structural placeholder emotional beat {index}.",
        },
        "visual": {
            "main_prompt": f"Structural placeholder visual prompt for shot {index}.",
            "visual_style": "placeholder style",
            "subject_description": "placeholder subject",
            "environment_description": "placeholder environment",
            "lighting_atmosphere": "placeholder lighting",
            "camera_framing": "medium",
            "camera_movement": "static",
        },
        "audio": {
            "music_cue": f"cue_{index:02d}",
            "music_mood": "calm placeholder",
        },
        "editing": {
            "transition_in": "crossfade",
            "transition_out": "crossfade",
        },
        "provenance": {
            "uses_ai_imagery": True,
            "imagery_type": "ai_reconstruction",
            "is_authentic_historical_photo": False,
            "disclosure_note": "Structural test placeholder: AI reconstruction, not a historical photograph.",
        },
    }


def _make_minimal_storyboard() -> dict:
    """Build a temporary in-memory storyboard structure matching Step 4 rules."""
    return {
        "schema_version": "1.0.0",
        "project": {
            "title": "The Monument That Lives in My Memory",
            "location": "Harar, Ethiopia",
            "central_message": "Heritage lives in memories and emotions attached to places.",
            "target_duration_seconds": 70.0,
            "creative_boundaries": {
                "non_political": True,
                "no_invented_history": True,
                "distinguish_ai_reconstructions": True,
            },
        },
        "outputs": {
            "aspect_ratios": ["9:16", "16:9"],
            "vertical": {"aspect_ratio": "9:16"},
            "horizontal": {"aspect_ratio": "16:9"},
            "end_card": {
                "enabled": True,
                "duration_seconds": 3.0,
                "disclosure_text": "Created with AI tools for personal storytelling.",
            },
        },
        "narration_config": {
            "language": "to-be-selected",
            "subtitle_language": "en",
        },
        "ai_disclosure": {
            "contains_ai_generated_content": True,
            "distinguishes_reconstructions_from_archival_photos": True,
            "disclosure_statement": "Visuals, voice, and score are generated with AI tools.",
            "consent_verified": True,
        },
        "shots": [_make_minimal_shot(i) for i in range(1, 11)],
    }


class TestStoryboardSchema(unittest.TestCase):
    """Verify Draft 2020-12 compliance and structural rules of storyboard.schema.json."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.schema = _load_schema()
        cls.validator = Draft202012Validator(cls.schema)

    def test_schema_is_valid_draft_2020_12(self) -> None:
        Draft202012Validator.check_schema(self.schema)

    def test_valid_minimal_in_memory_fixture_passes(self) -> None:
        doc = _make_minimal_storyboard()
        self.validator.validate(doc)

    def test_valid_with_optional_production_fields_and_nulls(self) -> None:
        doc = _make_minimal_storyboard()
        doc["narration_config"]["voice_settings"] = {
            "provider": "gemini",
            "model": None,
            "voice_id": None,
            "speaking_style": "calm, warm",
            "speed": 1.0,
        }
        doc["shots"][0]["generation"] = {
            "image": {
                "provider": "cloudflare_workers_ai",
                "model": None,
                "seed": None,
                "parameters": {"width": 1024, "height": 1024, "steps": 4},
            },
            "video": {
                "mode": "image_to_video",
                "provider": "kaggle",
                "model": None,
                "seed": None,
                "parameters": {"resolution": "480p", "fps": 24},
            },
        }
        doc["shots"][0]["editing"]["composition"] = {
            "shared_subject_position": "center",
            "vertical_9_16": {"crop_anchor": "center", "subtitle_placement": "bottom_safe"},
            "horizontal_16_9": {"crop_anchor": "center", "subtitle_placement": "lower_third"},
        }
        self.validator.validate(doc)

    def test_rejects_wrong_shot_count(self) -> None:
        doc_short = _make_minimal_storyboard()
        doc_short["shots"] = doc_short["shots"][:9]
        with self.assertRaises(ValidationError):
            self.validator.validate(doc_short)

        doc_long = _make_minimal_storyboard()
        extra_shot = copy.deepcopy(doc_long["shots"][0])
        extra_shot["shot_id"] = "shot-11"
        doc_long["shots"].append(extra_shot)
        with self.assertRaises(ValidationError):
            self.validator.validate(doc_long)

    def test_rejects_out_of_range_target_duration(self) -> None:
        for invalid_duration in (59.5, 90.5):
            doc = _make_minimal_storyboard()
            doc["project"]["target_duration_seconds"] = invalid_duration
            with self.assertRaises(ValidationError):
                self.validator.validate(doc)

    def test_rejects_unexpected_property(self) -> None:
        doc = _make_minimal_storyboard()
        doc["unexpected_root_key"] = "not allowed"
        with self.assertRaises(ValidationError):
            self.validator.validate(doc)

    def test_rejects_invalid_aspect_ratio_config(self) -> None:
        doc = _make_minimal_storyboard()
        doc["outputs"]["aspect_ratios"] = ["9:16", "4:3"]
        with self.assertRaises(ValidationError):
            self.validator.validate(doc)

        doc2 = _make_minimal_storyboard()
        doc2["outputs"]["vertical"]["aspect_ratio"] = "16:9"
        with self.assertRaises(ValidationError):
            self.validator.validate(doc2)

    def test_rejects_contradictory_ai_provenance(self) -> None:
        doc = _make_minimal_storyboard()
        doc["shots"][0]["provenance"]["is_authentic_historical_photo"] = True
        with self.assertRaises(ValidationError):
            self.validator.validate(doc)

    def test_rejects_missing_narration_or_subtitle_fields(self) -> None:
        doc = _make_minimal_storyboard()
        del doc["shots"][0]["narrative"]["english_subtitle_text"]
        with self.assertRaises(ValidationError):
            self.validator.validate(doc)

    def test_allows_configurable_narration_language(self) -> None:
        for lang in ("Amharic", "Afaan Oromo", "English", "am"):
            doc = _make_minimal_storyboard()
            doc["narration_config"]["language"] = lang
            self.validator.validate(doc)


if __name__ == "__main__":
    unittest.main()
