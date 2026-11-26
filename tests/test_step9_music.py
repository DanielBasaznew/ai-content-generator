"""Unit tests for Step 9 ACE-Step 1.5 music candidate generation, auditioning, and selection."""

from __future__ import annotations

import json
import math
import shutil
import struct
import sys
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.music import (
    DEFAULT_ACESTEP_MODEL,
    MUSIC_CANDIDATE_SPECS,
    _build_acestep_worker_script,
    _flatten_generation_jobs,
    assemble_two_part_candidate,
    audition_candidates,
    ingest_downloaded_music,
    push_music_batch,
    select_score,
)


def _write_sine_wav(path: Path, duration_s: float = 4.0, sr: int = 48000, freq: float = 220.0) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    n_frames = int(round(duration_s * sr))
    frames = bytearray()
    for i in range(n_frames):
        val = int(8000 * math.sin(2.0 * math.pi * freq * (i / sr)))
        frames.extend(struct.pack("<hh", val, val))
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(bytes(frames))


class TestStep9MusicPipeline(unittest.TestCase):
    """Verify ACE-Step 1.5 specs, worker script, mocked Kaggle flow, audition mix, and score selection."""

    def test_music_candidate_specs_are_strictly_instrumental(self) -> None:
        jobs = _flatten_generation_jobs(MUSIC_CANDIDATE_SPECS)
        self.assertGreaterEqual(len(MUSIC_CANDIDATE_SPECS), 3)
        self.assertEqual(len(jobs), 5)
        for job in jobs:
            self.assertTrue(job["instrumental"])
            self.assertEqual(job["lyrics"], "[Instrumental]")
            self.assertGreaterEqual(job["bpm"], 40)
            self.assertGreater(len(job["caption"]), 30)

    def test_acestep_worker_script_compiles_cleanly(self) -> None:
        jobs = _flatten_generation_jobs(MUSIC_CANDIDATE_SPECS)
        src = _build_acestep_worker_script(
            jobs,
            dit_config="acestep-v15-turbo",
            lm_model="acestep-5Hz-lm-1.7B",
            inference_steps=8,
            shift=3.0,
        )
        compile(src, "<acestep_worker>", "exec")
        self.assertIn("JOBS = json.loads(", src)
        jobs_line = next(line for line in src.splitlines() if line.startswith("JOBS = json.loads("))
        ns: dict[str, object] = {"json": json}
        exec(jobs_line, ns)
        self.assertEqual(len(ns["JOBS"]), 5)  # type: ignore[arg-type]
        self.assertIn("AceStepHandler", src)
        self.assertIn("generate_music", src)
        self.assertIn('backend="pt"', src)

    def test_two_part_crossfade_and_mocked_push_ingest_select(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "schema").mkdir()
            (tmp_root / "outputs" / "radio_cut").mkdir(parents=True)
            shutil.copy2(ROOT_DIR / "schema" / "storyboard.schema.json", tmp_root / "schema" / "storyboard.schema.json")
            shutil.copy2(ROOT_DIR / "storyboard.json", tmp_root / "storyboard.json")
            (tmp_root / "runs.jsonl").write_text("", encoding="utf-8")

            # Dummy radio cut voice track (5s mono)
            _write_sine_wav(tmp_root / "outputs" / "radio_cut" / "radio_cut_v1.wav", duration_s=5.0, sr=24000, freq=330.0)

            # Test two-part crossfade helper cleanly on 4s + 4s clips -> 6.0s output
            part_a = tmp_root / "part_a.wav"
            part_b = tmp_root / "part_b.wav"
            joined = tmp_root / "joined.wav"
            _write_sine_wav(part_a, duration_s=4.0, sr=48000, freq=261.6)
            _write_sine_wav(part_b, duration_s=4.0, sr=48000, freq=220.0)
            stats = assemble_two_part_candidate(part_a, part_b, joined, crossfade_seconds=2.0, target_duration=6.0)
            self.assertAlmostEqual(stats["duration_seconds"], 6.0, places=2)

            mock_api = MagicMock()
            with patch("pipeline.music.authenticate_kaggle_api", return_value=(mock_api, "mockuser")):
                pushed = push_music_batch(root_dir=tmp_root, kernel_slug="mock-music")
                self.assertEqual(pushed["pushed"], 5)
                self.assertEqual(mock_api.kernels_push.call_count, 1)

            # Simulate Kaggle output WAVs (> 100 KB each)
            src_out = tmp_root / "kaggle_music_out"
            src_out.mkdir()
            metrics = []
            for job in _flatten_generation_jobs(MUSIC_CANDIDATE_SPECS):
                jid = job["job_id"]
                _write_sine_wav(src_out / f"{jid}.wav", duration_s=4.0, sr=48000, freq=240.0)
                metrics.append({"job_id": jid, "inference_seconds": 12.5, "used_thinking_lm": True})
            (src_out / "music_metrics.json").write_text(json.dumps(metrics), encoding="utf-8")

            ing = ingest_downloaded_music(src_out, kernel_ref="mockuser/mock-music", root_dir=tmp_root)
            self.assertEqual(ing["ingested"], 5)
            self.assertTrue((tmp_root / "assets" / "music" / "candidates" / "cand_04_two_part_arc.wav").exists())

            aud = audition_candidates(root_dir=tmp_root)
            self.assertEqual(len(aud), 4)
            for item in aud:
                self.assertTrue((tmp_root / item["audition_mp3"]).exists())
                self.assertGreater(item["raw_stats"]["integrated_lufs"], -60.0)

            sel = select_score(
                "cand_01_felt_piano_strings",
                rationale="Warm uncluttered voice support in test.",
                target_duration=3.5,
                root_dir=tmp_root,
            )
            self.assertEqual(sel["selected"], "cand_01_felt_piano_strings")
            self.assertAlmostEqual(sel["stats"]["duration_seconds"], 3.5, places=2)
            self.assertTrue((tmp_root / "assets" / "music" / "selected_score.wav").exists())

            updated_sb = json.loads((tmp_root / "storyboard.json").read_text(encoding="utf-8"))
            self.assertEqual(updated_sb["music_plan"]["model"], DEFAULT_ACESTEP_MODEL)
            self.assertTrue(updated_sb["music_plan"]["instrumental_only"])
            self.assertEqual(updated_sb["music_plan"]["audio_path"], "assets/music/selected_score.wav")

            log_rows = [
                json.loads(line)
                for line in (tmp_root / "runs.jsonl").read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            self.assertEqual(len(log_rows), 5)
            self.assertTrue(all(r["stage"] == "music" and r["seed"] is not None for r in log_rows))


class TestStep9OnDiskArtifacts(unittest.TestCase):
    """Verify generated Step 9 ACE-Step candidate files, audition mixes, selected 83s score, and storyboard sync."""

    def test_selected_score_and_candidates_exist_and_match_storyboard(self) -> None:
        music_dir = ROOT_DIR / "assets" / "music"
        selected_wav = music_dir / "selected_score.wav"
        self.assertTrue(selected_wav.exists(), "assets/music/selected_score.wav missing")
        self.assertGreater(selected_wav.stat().st_size, 5_000_000)

        with wave.open(str(selected_wav), "rb") as wf:
            self.assertEqual(wf.getframerate(), 48000)
            self.assertEqual(wf.getnchannels(), 2)
            duration = wf.getnframes() / float(wf.getframerate())
            self.assertAlmostEqual(duration, 83.0, delta=0.1)

        metrics_path = music_dir / "audition_metrics.json"
        self.assertTrue(metrics_path.exists())
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        self.assertEqual(len(metrics), 4)
        for item in metrics:
            self.assertTrue((ROOT_DIR / item["raw_wav"]).exists())
            self.assertTrue((ROOT_DIR / item["audition_mp3"]).exists())
            self.assertGreater(item["raw_stats"]["integrated_lufs"], -60.0)

        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        mp = sb["music_plan"]
        self.assertEqual(mp["provider"], "kaggle_ace_step")
        self.assertTrue(mp["instrumental_only"])
        self.assertEqual(mp["audio_path"], "assets/music/selected_score.wav")
        self.assertEqual(mp["seed"], 4003)
        self.assertEqual(mp["extra_params"]["selected_candidate_id"], "cand_03_chamber_piano_pad")

        runs = [json.loads(line) for line in (ROOT_DIR / "runs.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
        music_runs = [r for r in runs if r.get("stage") == "music" and r.get("status") == "success"]
        self.assertEqual(len(music_runs), 5)


if __name__ == "__main__":
    unittest.main()
