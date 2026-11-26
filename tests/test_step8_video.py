"""Unit tests for Step 8 moving video generation, Kaggle batching, and caching."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.video import (
    DEFAULT_WAN_MODEL,
    _build_kaggle_worker_script,
    _resolve_kaggle_credentials,
    build_motion_prompt,
    generate_video_clips,
    ingest_downloaded_clips,
    push_video_batch,
)


class TestStep8VideoPipeline(unittest.TestCase):
    """Verify motion prompt building, Kaggle auth normalization, mocked batching, and caching."""

    def test_build_motion_prompt_covers_all_ten_shots(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        for shot in sb["shots"]:
            motion, neg = build_motion_prompt(sb, shot)
            self.assertGreater(len(motion), 20)
            self.assertIn("static frozen image", neg)
            self.assertIn("watermark", neg)

        shot8 = next(s for s in sb["shots"] if s["shot_id"] == "shot-08")
        m8, n8 = build_motion_prompt(sb, shot8)
        self.assertIn("Fixed locked-off static tripod camera", m8)
        self.assertIn("monument appearing", n8)

    def test_resolve_kaggle_credentials_maps_kgat_token(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / ".env").write_text(
                "KAGGLE_USERNAME=exampleuser\nKAGGLE_KEY=KGAT_dummy_bearer_token_123\n",
                encoding="utf-8",
            )
            user, auth_env = _resolve_kaggle_credentials(root_dir=tmp_root)
            self.assertEqual(user, "exampleuser")
            self.assertEqual(auth_env, {"KAGGLE_API_TOKEN": "KGAT_dummy_bearer_token_123"})

    def test_worker_script_compiles_cleanly(self) -> None:
        src = _build_kaggle_worker_script(
            [
                {
                    "shot_id": "shot-02",
                    "seed": 3002,
                    "motion_prompt": "Slow pan right.",
                    "negative_prompt": "blurry, watermark",
                }
            ],
            dataset_slug="harar-monument-keyframes",
            model_id=DEFAULT_WAN_MODEL,
            width=512,
            height=512,
            fps=24,
            num_frames=73,
            steps=25,
            guidance_scale=5.0,
        )
        compile(src, "<wan22_worker>", "exec")
        self.assertIn("WanImageToVideoPipeline", src)
        self.assertIn("enable_model_cpu_offload", src)

    def test_push_ingest_and_cache_with_mocked_kaggle(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_root = Path(tmp)
            (tmp_root / "schema").mkdir()
            (tmp_root / "assets" / "keyframes").mkdir(parents=True)
            (tmp_root / "assets" / "clips").mkdir(parents=True)
            shutil.copy2(ROOT_DIR / "schema" / "storyboard.schema.json", tmp_root / "schema" / "storyboard.schema.json")
            shutil.copy2(ROOT_DIR / "storyboard.json", tmp_root / "storyboard.json")
            for kf in (ROOT_DIR / "assets" / "keyframes").glob("shot-*.png"):
                shutil.copy2(kf, tmp_root / "assets" / "keyframes" / kf.name)
            (tmp_root / "runs.jsonl").write_text("", encoding="utf-8")

            mock_api = MagicMock()
            batch_dir = tmp_root / "mock_kaggle_out"
            batch_dir.mkdir(parents=True)
            (batch_dir / "shot-01.mp4").write_bytes(b"ftypmp42" * 2000)
            (batch_dir / "batch_metrics.json").write_text(
                json.dumps([{"shot_id": "shot-01", "inference_seconds": 123.4, "peak_vram_gb": 12.9}]),
                encoding="utf-8",
            )

            with patch("pipeline.video.authenticate_kaggle_api", return_value=(mock_api, "mockuser")):
                pushed = push_video_batch(shot_ids=["shot-01"], root_dir=tmp_root, kernel_slug="mock-batch")
                self.assertEqual(pushed["pushed"], 1)
                self.assertEqual(pushed["shots"], ["shot-01"])
                self.assertEqual(mock_api.kernels_push.call_count, 1)

                ing = ingest_downloaded_clips(
                    batch_dir,
                    shot_ids=["shot-01"],
                    kernel_ref="mockuser/mock-batch",
                    root_dir=tmp_root,
                )
                self.assertEqual(ing["ingested"], 1)
                self.assertTrue((tmp_root / "assets" / "clips" / "shot-01.mp4").exists())

                # Re-running generate_video_clips hits SHA-256 cache without calling Kaggle
                cached_run = generate_video_clips(shot_ids=["shot-01"], root_dir=tmp_root)
                self.assertEqual(cached_run, {"model": DEFAULT_WAN_MODEL, "generated": 0, "cached": 1})
                self.assertEqual(mock_api.kernels_push.call_count, 1)

            rows = [
                json.loads(line)
                for line in (tmp_root / "runs.jsonl").read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["stage"], "video")
            self.assertEqual(rows[0]["shot_id"], "shot-01")
            self.assertEqual(rows[0]["latency_seconds"], 123.4)

    def test_storyboard_videos_and_run_log_verified_on_disk(self) -> None:
        sb = json.loads((ROOT_DIR / "storyboard.json").read_text(encoding="utf-8"))
        self.assertEqual(len(sb["shots"]), 10)

        for shot in sb["shots"]:
            sid = shot["shot_id"]
            self.assertTrue(shot["provenance"]["uses_ai_imagery"])
            self.assertFalse(shot["provenance"]["is_authentic_historical_photo"])

            vid_cfg = shot["generation"]["video"]
            self.assertEqual(vid_cfg["mode"], "image_to_video")
            self.assertEqual(vid_cfg["provider"], "kaggle")
            self.assertEqual(vid_cfg["model"], DEFAULT_WAN_MODEL)
            self.assertIsNotNone(vid_cfg["seed"])

            rel_path = vid_cfg["clip_path"]
            self.assertEqual(rel_path, f"assets/clips/{sid}.mp4")
            mp4_path = ROOT_DIR / rel_path
            self.assertTrue(mp4_path.exists(), f"Missing generated clip MP4: {mp4_path}")
            self.assertGreater(mp4_path.stat().st_size, 50_000, f"Clip too small: {mp4_path}")

        shots_by_id = {s["shot_id"]: s for s in sb["shots"]}
        self.assertEqual(shots_by_id["shot-03"]["generation"]["video"]["seed"], 3013)
        self.assertEqual(shots_by_id["shot-04"]["generation"]["video"]["seed"], 3014)
        self.assertEqual(shots_by_id["shot-09"]["generation"]["video"]["seed"], 3019)
        self.assertEqual(shots_by_id["shot-10"]["generation"]["video"]["seed"], 3020)

        log_rows = [
            json.loads(line)
            for line in (ROOT_DIR / "runs.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        video_success = {
            row["shot_id"]
            for row in log_rows
            if row.get("stage") == "video" and row.get("status") == "success" and row.get("seed") is not None
        }
        self.assertEqual(video_success, {f"shot-{i:02d}" for i in range(1, 11)})


if __name__ == "__main__":
    unittest.main()
