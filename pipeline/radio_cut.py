"""Stage: Assemble the audio-only Step 5 radio cut from narration WAV clips."""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Any

from pipeline.common import (
    ROOT_DIR,
    get_ffmpeg_exe,
    load_storyboard,
    measure_wav_duration,
    validate_storyboard,
)

RADIO_CUT_DIR = ROOT_DIR / "outputs" / "radio_cut"


def _format_srt_timestamp(seconds: float) -> str:
    """Format seconds as SRT timestamp HH:MM:SS,mmm."""
    ms_total = max(0, round(seconds * 1000))
    hours, rem = divmod(ms_total, 3600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, ms = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def write_english_subtitles(storyboard: dict[str, Any], srt_path: Path) -> Path:
    """Export paired English subtitles aligned to the shot timeline."""
    lines: list[str] = []
    for idx, shot in enumerate(storyboard["shots"], start=1):
        start = float(shot["start_seconds"])
        offset = float(shot["audio"].get("narration_sync", {}).get("offset_seconds") or 0.0)
        end = float(shot["end_seconds"])
        sub_start = min(end - 0.5, start + offset)
        subtitle = shot["narrative"]["english_subtitle_text"].strip()
        lines.append(
            f"{idx}\n"
            f"{_format_srt_timestamp(sub_start)} --> {_format_srt_timestamp(end)}\n"
            f"{subtitle}\n"
        )
    srt_path.parent.mkdir(parents=True, exist_ok=True)
    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return srt_path


def _generate_silence_wav(duration_seconds: float, sample_rate: int, out_path: Path) -> None:
    """Write a mono 16-bit PCM silence WAV of the requested duration."""
    num_frames = max(0, int(round(duration_seconds * sample_rate)))
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"\x00\x00" * num_frames)


def _pad_and_normalize_clip(
    ffmpeg_exe: str,
    clip_path: Path,
    slot_duration: float,
    offset_seconds: float,
    sample_rate: int,
    out_wav: Path,
) -> None:
    """Place a single shot's narration inside its exact shot time slot."""
    actual_dur = measure_wav_duration(clip_path)
    if offset_seconds + actual_dur > slot_duration + 0.05:
        raise ValueError(
            f"{clip_path.name} ({offset_seconds:.2f}s + {actual_dur:.2f}s) exceeds shot slot ({slot_duration:.2f}s)."
        )

    delay_ms = int(round(offset_seconds * 1000))
    filter_expr = (
        f"aresample={sample_rate},"
        f"aformat=sample_fmts=s16:channel_layouts=mono,"
        f"adelay={delay_ms}:all=1,"
        f"apad=whole_dur={slot_duration:.3f},"
        f"atrim=duration={slot_duration:.3f}"
    )
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i",
        str(clip_path),
        "-af",
        filter_expr,
        "-ac",
        "1",
        "-ar",
        str(sample_rate),
        "-c:a",
        "pcm_s16le",
        str(out_wav),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed formatting {clip_path.name}: {res.stderr[-400:]}")


def assemble_radio_cut(
    wav_filename: str = "radio_cut_v1.wav",
    mp3_filename: str = "radio_cut_v1.mp3",
    srt_filename: str = "radio_cut_v1_en.srt",
    sample_rate: int = 24000,
) -> dict[str, Any]:
    """Concatenate all 10 narration clips into a continuous audio-only radio cut."""
    storyboard = load_storyboard()
    validate_storyboard(storyboard)
    ffmpeg_exe = get_ffmpeg_exe()

    RADIO_CUT_DIR.mkdir(parents=True, exist_ok=True)
    wav_out = RADIO_CUT_DIR / wav_filename
    mp3_out = RADIO_CUT_DIR / mp3_filename
    srt_out = RADIO_CUT_DIR / srt_filename

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        segment_paths: list[Path] = []
        for shot in storyboard["shots"]:
            sid = shot["shot_id"]
            sync = shot["audio"].get("narration_sync", {})
            rel_audio = sync.get("audio_path")
            if not rel_audio:
                raise FileNotFoundError(f"Missing narration audio_path for {sid} in storyboard.json")
            clip_path = ROOT_DIR / rel_audio
            if not clip_path.exists():
                raise FileNotFoundError(f"Narration clip does not exist: {clip_path}")

            slot_dur = float(shot["duration_seconds"])
            offset = float(sync.get("offset_seconds") or 0.0)
            seg_path = tmp / f"{sid}_slot.wav"
            _pad_and_normalize_clip(ffmpeg_exe, clip_path, slot_dur, offset, sample_rate, seg_path)
            segment_paths.append(seg_path)

        concat_file = tmp / "concat.txt"
        concat_lines = [f"file '{p.as_posix()}'" for p in segment_paths]
        concat_file.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

        raw_concat = tmp / "raw_concat.wav"
        res_concat = subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c:a",
                "pcm_s16le",
                str(raw_concat),
            ],
            capture_output=True,
            text=True,
        )
        if res_concat.returncode != 0:
            raise RuntimeError(f"FFmpeg concat failed: {res_concat.stderr[-400:]}")

        # Loudness normalize to -14 LUFS / -1 dBTP for consistent phone/headphone listening
        res_wav = subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                str(raw_concat),
                "-af",
                "loudnorm=I=-14:TP=-1:LRA=11",
                "-ar",
                str(sample_rate),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(wav_out),
            ],
            capture_output=True,
            text=True,
        )
        if res_wav.returncode != 0:
            raise RuntimeError(f"FFmpeg WAV normalization failed: {res_wav.stderr[-400:]}")

        res_mp3 = subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                str(wav_out),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                str(mp3_out),
            ],
            capture_output=True,
            text=True,
        )
        if res_mp3.returncode != 0:
            raise RuntimeError(f"FFmpeg MP3 encoding failed: {res_mp3.stderr[-400:]}")

    write_english_subtitles(storyboard, srt_out)
    final_duration = measure_wav_duration(wav_out)
    manifest = {
        "wav_path": str(wav_out.relative_to(ROOT_DIR).as_posix()),
        "mp3_path": str(mp3_out.relative_to(ROOT_DIR).as_posix()),
        "srt_path": str(srt_out.relative_to(ROOT_DIR).as_posix()),
        "duration_seconds": final_duration,
        "target_duration_seconds": storyboard["project"]["target_duration_seconds"],
        "shot_count": len(storyboard["shots"]),
        "music_included": False,
    }
    manifest_path = RADIO_CUT_DIR / "radio_cut_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Assemble audio-only Step 5 radio cut.")
    parser.parse_args()
    result = assemble_radio_cut()
    print(result)


if __name__ == "__main__":
    main()
