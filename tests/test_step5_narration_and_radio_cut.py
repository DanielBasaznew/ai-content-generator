"""Verification and unit tests for Step 5 narration and radio-cut pipeline."""

from __future__ import annotations

import json
import sys
import unittest
import wave
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.common import compute_hash, measure_wav_duration, validate_storyboard
from pipeline.narration import _extract_retry_after, _write_audio_as_wav

STORYBOARD_PATH = ROOT_DIR / "storyboard.json"
RUNS_LOG_PATH = ROOT_DIR / "runs.jsonl"
RADIO_CUT_DIR = ROOT_DIR / "outputs" / "radio_cut"


class TestStep5NarrationAndRadioCut(unittest.TestCase):
    """Verify pipeline helpers, generated narration clips, and assembled radio cut."""

    def test_compute_hash_is_deterministic_across_key_order(self) -> None:
        a = compute_hash({"shot_id": "shot-01", "voice": "Charon", "text": "ሐረር"})
        b = compute_hash({"text": "ሐረር", "shot_id": "shot-01", "voice": "Charon"})
        self.assertEqual(a, b)

    def test_extract_retry_after_parses_429_hints(self) -> None:
        self.assertAlmostEqual(_extract_retry_after("Please retry in 49.243s."), 49.243)
        self.assertAlmostEqual(_extract_retry_after("'retryDelay': '49s'"), 49.0)
        self.assertIsNone(_extract_retry_after("Generic error"))

    def test_validate_storyboard_rejects_duplicate_ids_and_bad_sum(self) -> None:
        sb = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))
        sb_dup = json.loads(json.dumps(sb))
        sb_dup["shots"][1]["shot_id"] = sb_dup["shots"][0]["shot_id"]
        with self.assertRaises(ValueError):
            validate_storyboard(sb_dup)

        sb_bad_sum = json.loads(json.dumps(sb))
        sb_bad_sum["shots"][0]["duration_seconds"] = 3.5
        with self.assertRaises(ValueError):
            validate_storyboard(sb_bad_sum)

    def test_write_audio_as_wav_wraps_pcm_cleanly(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "sample.wav"
            pcm_silence = b"\x00\x00" * 2400  # 0.1s at 24 kHz
            sr = _write_audio_as_wav(pcm_silence, "audio/L16;codec=pcm;rate=24000", out)
            self.assertEqual(sr, 24000)
            self.assertAlmostEqual(measure_wav_duration(out), 0.1, places=3)

    def test_all_ten_narration_clips_exist_and_fit_slots(self) -> None:
        sb = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))
        validate_storyboard(sb)
        for shot in sb["shots"]:
            sync = shot["audio"]["narration_sync"]
            rel = sync["audio_path"]
            self.assertIsNotNone(rel)
            wav_path = ROOT_DIR / rel
            self.assertTrue(wav_path.exists(), f"Missing WAV: {wav_path}")
            self.assertGreater(wav_path.stat().st_size, 1000)

            with wave.open(str(wav_path), "rb") as wf:
                self.assertEqual(wf.getnchannels(), 1)
                self.assertEqual(wf.getsampwidth(), 2)
                self.assertEqual(wf.getframerate(), 24000)
                measured = wf.getnframes() / float(wf.getframerate())

            self.assertAlmostEqual(sync["actual_duration_seconds"], measured, delta=0.01)
            offset = float(sync.get("offset_seconds") or 0.0)
            self.assertLessEqual(offset + measured, float(shot["duration_seconds"]))

    def test_radio_cut_outputs_and_runs_jsonl_are_valid(self) -> None:
        wav_out = RADIO_CUT_DIR / "radio_cut_v1.wav"
        mp3_out = RADIO_CUT_DIR / "radio_cut_v1.mp3"
        srt_out = RADIO_CUT_DIR / "radio_cut_v1_en.srt"
        manifest_out = RADIO_CUT_DIR / "radio_cut_manifest.json"

        for p in (wav_out, mp3_out, srt_out, manifest_out):
            self.assertTrue(p.exists(), f"Missing radio cut output: {p}")
            self.assertGreater(p.stat().st_size, 100)

        sb = json.loads(STORYBOARD_PATH.read_text(encoding="utf-8"))
        manifest = json.loads(manifest_out.read_text(encoding="utf-8"))
        self.assertFalse(manifest["music_included"])
        self.assertEqual(manifest["shot_count"], 10)
        self.assertAlmostEqual(
            measure_wav_duration(wav_out),
            float(sb["project"]["target_duration_seconds"]),
            delta=0.05,
        )

        lines = [
            json.loads(line)
            for line in RUNS_LOG_PATH.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        success_shots = {
            row["shot_id"]
            for row in lines
            if row.get("stage") == "narration" and row.get("status") == "success"
        }
        self.assertEqual(success_shots, {f"shot-{i:02d}" for i in range(1, 11)})


if __name__ == "__main__":
    unittest.main()
