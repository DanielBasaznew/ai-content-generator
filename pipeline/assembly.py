"""Stage 10: Deterministically assemble final 9:16 and 16:9 films from storyboard.json via FFmpeg."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
import textwrap
import time
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from pipeline.common import (
    ROOT_DIR,
    compute_hash,
    get_ffmpeg_exe,
    load_cache,
    load_storyboard,
    measure_wav_duration,
    save_cache,
    save_storyboard,
    validate_storyboard,
)
from pipeline.radio_cut import _pad_and_normalize_clip

OUTPUTS_DIR = ROOT_DIR / "outputs"
VERTICAL_OUTPUT_REL = "outputs/vertical/harar_monument_vertical_9x16.mp4"
HORIZONTAL_OUTPUT_REL = "outputs/horizontal/harar_monument_horizontal_16x9.mp4"
INTERMEDIATE_DIR_REL = "outputs/intermediate"


def _resolve_ffprobe_exe(ffmpeg_exe: str) -> str:
    """Resolve companion ffprobe binary next to ffmpeg, or fall back to PATH."""
    cand = Path(ffmpeg_exe).with_name("ffprobe" + Path(ffmpeg_exe).suffix)
    if cand.exists():
        return str(cand)
    return "ffprobe"


def _run_subprocess(cmd: list[str], label: str) -> str:
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"{label} failed ({' '.join(cmd[:6])}): {res.stderr[-800:]}")
    return res.stderr


def probe_media(media_path: Path, ffmpeg_exe: str | None = None) -> dict[str, Any]:
    """Inspect video and audio stream metadata via ffprobe and measure ebur128 loudness."""
    ff = ffmpeg_exe or get_ffmpeg_exe()
    ffprobe = _resolve_ffprobe_exe(ff)
    res = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels",
            "-of",
            "json",
            str(media_path),
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {media_path}: {res.stderr[-400:]}")
    info = json.loads(res.stdout)

    video_stream = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    audio_stream = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), {})

    ebur_stderr = _run_subprocess(
        [ff, "-i", str(media_path), "-vn", "-af", "volumedetect,ebur128=peak=true", "-f", "null", "-"],
        f"Audio inspection for {media_path.name}",
    )
    lufs_m = re.findall(r"\bI:\s*([-\d.]+)\s*LUFS", ebur_stderr)
    lra_m = re.findall(r"\bLRA:\s*([-\d.]+)\s*LU", ebur_stderr)
    tp_m = re.findall(r"\bPeak:\s*([-\d.]+)\s*dBFS", ebur_stderr)
    mean_m = re.findall(r"mean_volume:\s*([-\d.]+)\s*dB", ebur_stderr)
    max_m = re.findall(r"max_volume:\s*([-\d.]+)\s*dB", ebur_stderr)

    fmt = info.get("format", {})
    return {
        "path": str(media_path),
        "duration_seconds": round(float(fmt.get("duration", 0.0)), 3),
        "size_bytes": int(fmt.get("size", media_path.stat().st_size)),
        "video_codec": video_stream.get("codec_name"),
        "width": int(video_stream.get("width", 0)),
        "height": int(video_stream.get("height", 0)),
        "fps": video_stream.get("r_frame_rate"),
        "pix_fmt": video_stream.get("pix_fmt"),
        "audio_codec": audio_stream.get("codec_name"),
        "sample_rate_hz": int(audio_stream.get("sample_rate", 0)) if audio_stream.get("sample_rate") else None,
        "channels": int(audio_stream.get("channels", 0)) if audio_stream.get("channels") else None,
        "integrated_lufs": float(lufs_m[-1]) if lufs_m else None,
        "loudness_range_lu": float(lra_m[-1]) if lra_m else None,
        "true_peak_dbtp": float(tp_m[-1]) if tp_m else (float(max_m[-1]) if max_m else None),
        "mean_volume_db": float(mean_m[-1]) if mean_m else None,
    }


def _escape_ffmpeg_filter_path(path: Path) -> str:
    """Escape file paths cleanly for FFmpeg filter arguments (Windows drive colons & quotes)."""
    posix = path.resolve().as_posix()
    return posix.replace(":", "\\:").replace("'", "\\'")


def _greedy_wrap(words: list[str], limit: int) -> list[str]:
    lines: list[str] = []
    cur = ""
    for w in words:
        cand = f"{cur} {w}".strip() if cur else w
        if len(cand) <= limit:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _balance_two_lines(text: str, max_chars_per_line: int) -> str | None:
    """Wrap text cleanly into 1 or 2 visually balanced lines without single-word orphans."""
    text = text.strip()
    if len(text) <= max_chars_per_line:
        return text
    words = text.split()
    greedy = _greedy_wrap(words, max_chars_per_line)
    if len(greedy) > 2:
        return None
    # Try tightening the target wrap width toward 50% of text length while staying <= 2 lines
    best = greedy
    for target in range(max(12, len(text) // 2 + 2), max_chars_per_line + 1):
        cand = _greedy_wrap(words, target)
        if len(cand) == 2 and all(len(line) <= max_chars_per_line for line in cand):
            best = cand
            break
    return "\\N".join(best)


def _wrap_text_lines(text: str, max_chars_per_line: int, max_lines: int) -> list[str]:
    """Split subtitle text into chunks, each cleanly wrapped to at most `max_lines` balanced lines."""
    if max_lines == 2:
        balanced = _balance_two_lines(text, max_chars_per_line)
        if balanced is not None:
            return [balanced]
    else:
        greedy = _greedy_wrap(text.split(), max_chars_per_line)
        if len(greedy) <= max_lines:
            return ["\\N".join(greedy)]

    # Prefer natural punctuation boundaries (sentence end first, then commas/semicolons)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]
    if len(sentences) >= 2:
        chunks: list[str] = []
        for s in sentences:
            chunks.extend(_wrap_text_lines(s, max_chars_per_line, max_lines))
        return chunks

    clauses = [c.strip() for c in re.split(r"(?<=[,;:])\s+", text.strip()) if c.strip()]
    if len(clauses) >= 2 and min(len(c) for c in clauses) >= 14:
        chunks = []
        for c in clauses:
            chunks.extend(_wrap_text_lines(c, max_chars_per_line, max_lines))
        return chunks

    words = text.split()
    mid = len(words) // 2
    return [
        *_wrap_text_lines(" ".join(words[:mid]), max_chars_per_line, max_lines),
        *_wrap_text_lines(" ".join(words[mid:]), max_chars_per_line, max_lines),
    ]


def build_subtitle_cues(
    storyboard: dict[str, Any],
    *,
    max_chars_per_line: int,
    max_lines: int,
    root_dir: Path = ROOT_DIR,
) -> list[dict[str, Any]]:
    """Build aspect-safe subtitle cues aligned with each shot's actual spoken narration timing."""
    cues: list[dict[str, Any]] = []
    for shot in storyboard["shots"]:
        start = float(shot["start_seconds"])
        end = float(shot["end_seconds"])
        sync = shot["audio"]["narration_sync"]
        offset = float(sync.get("offset_seconds") or 0.0)
        wav_rel = sync.get("audio_path")
        actual_dur = float(sync.get("actual_duration_seconds") or 0.0)
        if wav_rel and (root_dir / wav_rel).exists():
            actual_dur = measure_wav_duration(root_dir / wav_rel)

        cue_start = min(end - 0.5, start + offset)
        cue_end = min(end - 0.1, cue_start + actual_dur + 0.35) if actual_dur > 0 else end
        if cue_end - cue_start < 1.5:
            cue_end = end

        text = shot["narrative"]["english_subtitle_text"].strip()
        chunks = _wrap_text_lines(text, max_chars_per_line=max_chars_per_line, max_lines=max_lines)
        total_chars = max(1, sum(len(c.replace("\\N", " ")) for c in chunks))
        cursor = cue_start
        span = cue_end - cue_start
        for idx, chunk in enumerate(chunks):
            if idx == len(chunks) - 1:
                seg_end = cue_end
            else:
                share = len(chunk.replace("\\N", " ")) / float(total_chars)
                seg_end = min(cue_end - 0.8, cursor + max(1.6, span * share))
            cues.append({"start": round(cursor, 3), "end": round(seg_end, 3), "text": chunk})
            cursor = seg_end
    return cues


def _format_ass_timestamp(seconds: float) -> str:
    cs_total = max(0, round(seconds * 100))
    hours, rem = divmod(cs_total, 360_000)
    minutes, rem = divmod(rem, 6_000)
    secs, cs = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"


def write_ass_subtitles(
    storyboard: dict[str, Any],
    *,
    aspect_key: str,
    out_ass: Path,
    root_dir: Path = ROOT_DIR,
) -> Path:
    """Write aspect-specific ASS subtitle script respecting safe_area margins and max line rules."""
    out_cfg = storyboard["outputs"][aspect_key]
    width = int(out_cfg["width"])
    height = int(out_cfg["height"])
    safe = out_cfg["safe_area"]
    sub_style = out_cfg["subtitle_style"]

    margin_l = int(safe["horizontal_margin_px"])
    margin_r = int(safe["horizontal_margin_px"])
    margin_v = int(safe["bottom_margin_px"])
    font_size = 50 if width < height else 44
    max_chars = int(sub_style["max_chars_per_line"])
    max_lines = int(sub_style["max_lines"])

    cues = build_subtitle_cues(
        storyboard,
        max_chars_per_line=max_chars,
        max_lines=max_lines,
        root_dir=root_dir,
    )

    header = "\n".join(
        [
            "[Script Info]",
            f"Title: {storyboard['project']['title']} ({aspect_key})",
            "ScriptType: v4.00+",
            f"PlayResX: {width}",
            f"PlayResY: {height}",
            "WrapStyle: 2",
            "ScaledBorderAndShadow: yes",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
            "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,Arial,{font_size},&H00F6F1EA,&H000000FF,&H0012100E,&H960C0B0A,"
            f"1,0,0,0,100,100,0.4,0,1,3,1,2,{margin_l},{margin_r},{margin_v},1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]
    )
    events = [
        f"Dialogue: 0,{_format_ass_timestamp(c['start'])},{_format_ass_timestamp(c['end'])},Default,,0,0,0,,{c['text']}"
        for c in cues
    ]
    out_ass.parent.mkdir(parents=True, exist_ok=True)
    out_ass.write_text(header + "\n" + "\n".join(events) + "\n", encoding="utf-8")
    return out_ass


def _load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        ["C:/Windows/Fonts/arialbd.ttf", "arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/arial.ttf", "arial.ttf"]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def render_end_card_png(
    storyboard: dict[str, Any],
    *,
    aspect_key: str,
    out_png: Path,
) -> Path:
    """Render a clean AI disclosure end card PNG inside aspect safe areas."""
    out_cfg = storyboard["outputs"][aspect_key]
    width = int(out_cfg["width"])
    height = int(out_cfg["height"])
    safe = out_cfg["safe_area"]
    title = storyboard["project"]["title"]
    disclosure = storyboard["outputs"]["end_card"]["disclosure_text"].strip()
    is_vertical = height > width

    img = Image.new("RGB", (width, height), (18, 16, 15))
    draw = ImageDraw.Draw(img)

    # Smooth subtle warm terracotta glow in the background matching Harar twilight palette
    cx, cy = width // 2, int(height * 0.48)
    for step in range(48, 0, -1):
        ratio = step / 48.0
        rx = int((width * 0.48) * ratio)
        ry = int((height * 0.34) * ratio)
        delta = (1.0 - ratio) * 18.0
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(int(18 + delta * 1.25), int(16 + delta * 0.9), int(15 + delta * 0.65)))

    horiz_pad = int(safe["horizontal_margin_px"])
    wrap_chars = 34 if is_vertical else 58

    font_badge = _load_font(30 if is_vertical else 28, bold=True)
    font_title = _load_font(54 if is_vertical else 56, bold=True)
    font_body = _load_font(36 if is_vertical else 34, bold=False)
    font_meta = _load_font(25 if is_vertical else 24, bold=False)

    title_lines = textwrap.wrap(title, width=26 if is_vertical else 44)
    body_lines = textwrap.wrap(disclosure, width=wrap_chars)
    meta_lines = (
        [
            "Voice: Gemini TTS (Amharic)",
            "Visuals: FLUX.2 klein & Wan 2.2  |  Music: ACE-Step 1.5",
        ]
        if is_vertical
        else ["Voice: Gemini TTS (Amharic)  |  Visuals: FLUX.2 klein & Wan 2.2  |  Music: ACE-Step 1.5"]
    )

    y = int(height * (0.31 if is_vertical else 0.28))
    badge_text = "AI DISCLOSURE"
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox[2] - bbox[0]
    draw.text(((width - bw) // 2, y), badge_text, font=font_badge, fill=(214, 154, 79))
    y += 56

    rule_half = 120 if is_vertical else 180
    draw.line([(cx - rule_half, y), (cx + rule_half, y)], fill=(200, 122, 83), width=3)
    y += 42

    for line in title_lines:
        tb = draw.textbbox((0, 0), line, font=font_title)
        draw.text(((width - (tb[2] - tb[0])) // 2, y), line, font=font_title, fill=(244, 238, 229))
        y += int((tb[3] - tb[1]) * 1.35)
    y += 32

    for line in body_lines:
        bb = draw.textbbox((0, 0), line, font=font_body)
        lw = bb[2] - bb[0]
        x = max(horiz_pad, (width - lw) // 2)
        draw.text((x, y), line, font=font_body, fill=(224, 217, 206))
        y += int((bb[3] - bb[1]) * 1.45)

    y += 44
    draw.line([(cx - rule_half, y), (cx + rule_half, y)], fill=(110, 96, 84), width=2)
    y += 28
    for line in meta_lines:
        mb = draw.textbbox((0, 0), line, font=font_meta)
        draw.text(((width - (mb[2] - mb[0])) // 2, y), line, font=font_meta, fill=(176, 168, 156))
        y += int((mb[3] - mb[1]) * 1.4)

    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, format="PNG")
    return out_png


def compute_shot_transition_schedule(storyboard: dict[str, Any]) -> list[dict[str, float]]:
    """Compute per-shot normalized clip lengths & xfade offsets so story totals target_duration_seconds."""
    shots = storyboard["shots"]
    n = len(shots)
    joins: list[dict[str, Any]] = []
    for i in range(n - 1):
        ed = shots[i].get("editing", {})
        dur = float(ed.get("transition_duration_seconds") or 0.6)
        dur = max(0.3, min(dur, 0.8))
        out_kind = str(ed.get("transition_out") or "crossfade")
        xfade_name = "fadeblack" if out_kind == "fade_to_black" else "fade"
        joins.append({"duration": dur, "transition": xfade_name, "boundary": float(shots[i]["end_seconds"])})

    schedule: list[dict[str, float]] = []
    for i, shot in enumerate(shots):
        base_dur = float(shot["duration_seconds"])
        left_pad = joins[i - 1]["duration"] / 2.0 if i > 0 else 0.0
        right_pad = joins[i]["duration"] / 2.0 if i < n - 1 else 0.0
        seg_dur = round(base_dur + left_pad + right_pad, 3)
        schedule.append(
            {
                "segment_duration": seg_dur,
                "join_after_duration": joins[i]["duration"] if i < n - 1 else 0.0,
                "join_after_offset": round(joins[i]["boundary"] - joins[i]["duration"] / 2.0, 3) if i < n - 1 else 0.0,
                "join_after_transition": joins[i]["transition"] if i < n - 1 else "none",
            }
        )
    return schedule


def _build_crop_x_expr(crop_anchor: str) -> str:
    """Return horizontal crop x-expression on 1:1 source for 9:16 extraction."""
    if crop_anchor == "left":
        return "0"
    if crop_anchor == "right":
        return "iw-ih*9/16"
    return "(iw-ih*9/16)/2"


def _render_normalized_shot(
    ffmpeg_exe: str,
    shot: dict[str, Any],
    segment_duration: float,
    *,
    aspect_key: str,
    target_w: int,
    target_h: int,
    fps: int,
    out_mp4: Path,
    root_dir: Path,
) -> None:
    """Extend a shot clip smoothly to segment_duration and frame it for 9:16 or 16:9."""
    vid_rel = shot.get("generation", {}).get("video", {}).get("clip_path")
    img_rel = shot.get("generation", {}).get("image", {}).get("keyframe_path")
    clip_path = (root_dir / vid_rel) if vid_rel else None

    comp = shot.get("editing", {}).get("composition", {})
    ratio_key = "vertical_9_16" if aspect_key == "vertical" else "horizontal_16_9"
    crop_anchor = str(comp.get(ratio_key, {}).get("crop_anchor") or "center")
    cam_move = str(shot.get("visual", {}).get("camera_movement") or "static")

    # Subtle 1.35x temporal slowdown via linear frame blending (~4.10s smooth Wan motion),
    # then hold final clean frame with optional whisper-soft micro-zoom (0% -> 4%) on moving shots.
    is_static = cam_move == "static"
    slow_frames = 99  # ~4.125s at 24 fps
    total_frames = max(slow_frames + 1, int(round(segment_duration * fps)))
    tail_frames = max(1, total_frames - slow_frames)

    if clip_path and clip_path.exists():
        pad_tail = max(0.5, segment_duration - 3.8 + 0.5)
        input_args = ["-i", str(clip_path)]
        base_motion = (
            f"setpts=1.35*PTS,"
            f"framerate=fps={fps},"
            f"tpad=stop_mode=clone:stop_duration={pad_tail:.3f},"
            f"trim=duration={segment_duration:.3f},"
            f"setpts=PTS-STARTPTS"
        )
    elif img_rel and (root_dir / img_rel).exists():
        # Deterministic Ken Burns fallback on still keyframe if video clip unavailable
        input_args = ["-loop", "1", "-t", f"{segment_duration:.3f}", "-i", str(root_dir / img_rel)]
        base_motion = f"fps={fps},trim=duration={segment_duration:.3f},setpts=PTS-STARTPTS"
        slow_frames = 0
        tail_frames = total_frames
    else:
        raise FileNotFoundError(f"Missing both clip and keyframe for {shot['shot_id']}")

    zoom_expr = (
        "1"
        if is_static
        else f"if(lt(on,{slow_frames}),1,1+0.07*(on-{slow_frames})/{tail_frames})"
    )

    if aspect_key == "vertical":
        crop_x = _build_crop_x_expr(crop_anchor)
        # Upscale 2x prior to zoompan so gentle tail zoom interpolates smoothly without pixel stairstepping.
        vf = (
            f"[0:v]{base_motion},"
            f"crop=w='ih*9/16':h='ih':x='{crop_x}':y='0',"
            f"scale={target_w * 2}:{target_h * 2}:flags=lanczos,"
            f"zoompan=z='{zoom_expr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={target_w}x{target_h}:fps={fps},"
            f"unsharp=3:3:0.35,"
            f"trim=duration={segment_duration:.3f},setpts=PTS-STARTPTS,"
            f"format=yuv420p,setsar=1[vout]"
        )
    else:
        # Preserve 100% of 1:1 vertical framing (no sliced heads/hands) centered cleanly at 1080x1080
        # over a softly darkened, Gaussian-blurred color-matched ambient motion bed at 1920x1080.
        vf = (
            f"[0:v]{base_motion},split=2[fg_src][bg_src];"
            f"[bg_src]scale={target_w}:{target_h}:force_original_aspect_ratio=increase:flags=bilinear,"
            f"crop={target_w}:{target_h},gblur=sigma=36,eq=brightness=-0.16:saturation=0.85,"
            f"trim=duration={segment_duration:.3f},setpts=PTS-STARTPTS[bg];"
            f"[fg_src]scale=2160:2160:flags=lanczos,"
            f"zoompan=z='{zoom_expr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1080:fps={fps},"
            f"unsharp=3:3:0.35,trim=duration={segment_duration:.3f},setpts=PTS-STARTPTS[fg];"
            f"[bg][fg]overlay=(W-w)/2:0:shortest=1,fps={fps},format=yuv420p,setsar=1[vout]"
        )

    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    _run_subprocess(
        [
            ffmpeg_exe,
            "-y",
            *input_args,
            "-filter_complex",
            vf,
            "-map",
            "[vout]",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "16",
            "-pix_fmt",
            "yuv420p",
            str(out_mp4),
        ],
        f"Normalize {shot['shot_id']} ({aspect_key})",
    )


def build_master_audio_mix(
    ffmpeg_exe: str,
    storyboard: dict[str, Any],
    *,
    out_wav: Path,
    work_dir: Path,
    root_dir: Path = ROOT_DIR,
) -> dict[str, Any]:
    """Build synchronized voice stem, duck music beneath voice, and two-pass normalize to target LUFS."""
    music_rel = storyboard.get("music_plan", {}).get("audio_path")
    if not music_rel or not (root_dir / music_rel).exists():
        raise FileNotFoundError(f"Selected score not found: {music_rel}")
    music_path = root_dir / music_rel

    story_dur = float(storyboard["project"]["target_duration_seconds"])
    end_card_dur = float(storyboard["outputs"]["end_card"]["duration_seconds"])
    total_dur = story_dur + end_card_dur
    audio_cfg = storyboard["outputs"]["audio_mix"]
    target_lufs = float(audio_cfg.get("target_lufs", -14.0))
    true_peak = float(audio_cfg.get("true_peak_db", -1.0))
    duck_enabled = bool(audio_cfg.get("music_ducking_enabled", True))
    sample_rate = 48000

    # Assemble single-source voice stem directly from storyboard narration clips
    voice_segs: list[Path] = []
    for shot in storyboard["shots"]:
        sync = shot["audio"]["narration_sync"]
        clip = root_dir / sync["audio_path"]
        seg = work_dir / f"{shot['shot_id']}_voice.wav"
        _pad_and_normalize_clip(
            ffmpeg_exe,
            clip,
            slot_duration=float(shot["duration_seconds"]),
            offset_seconds=float(sync.get("offset_seconds") or 0.0),
            sample_rate=24000,
            out_wav=seg,
        )
        voice_segs.append(seg)

    concat_txt = work_dir / "voice_concat.txt"
    concat_txt.write_text("\n".join(f"file '{p.as_posix()}'" for p in voice_segs) + "\n", encoding="utf-8")
    voice_raw = work_dir / "voice_80s.wav"
    _run_subprocess(
        [ffmpeg_exe, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-c:a", "pcm_s16le", str(voice_raw)],
        "Concat voice stem",
    )

    # Pre-level voice to target LUFS before mixing so ducking behaves consistently across edits
    voice_leveled = work_dir / "voice_48k_83s.wav"
    _run_subprocess(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(voice_raw),
            "-af",
            f"aresample={sample_rate},aformat=sample_fmts=fltp:channel_layouts=stereo,loudnorm=I={target_lufs}:TP={true_peak}:LRA=11,apad=whole_dur={total_dur:.3f},atrim=duration={total_dur:.3f}",
            "-ar",
            str(sample_rate),
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(voice_leveled),
        ],
        "Level voice stem",
    )

    fade_out_start = max(0.0, total_dur - end_card_dur)
    if duck_enabled:
        mix_filter = (
            f"[0:a]aformat=sample_fmts=fltp:sample_rates={sample_rate}:channel_layouts=stereo,asplit=2[voice_mix][voice_sc];"
            f"[1:a]aformat=sample_fmts=fltp:sample_rates={sample_rate}:channel_layouts=stereo,"
            f"atrim=0:{total_dur:.3f},afade=t=in:st=0:d=0.6,afade=t=out:st={fade_out_start:.3f}:d={end_card_dur:.3f},"
            f"volume=-14dB[music_pre];"
            f"[music_pre][voice_sc]sidechaincompress=threshold=0.02:ratio=6:attack=300:release=1500[music_ducked];"
            f"[voice_mix][music_ducked]amix=inputs=2:duration=first:normalize=0[outa]"
        )
    else:
        mix_filter = (
            f"[0:a]aformat=sample_fmts=fltp:sample_rates={sample_rate}:channel_layouts=stereo[voice_mix];"
            f"[1:a]aformat=sample_fmts=fltp:sample_rates={sample_rate}:channel_layouts=stereo,"
            f"atrim=0:{total_dur:.3f},afade=t=out:st={fade_out_start:.3f}:d={end_card_dur:.3f},volume=-16dB[music_low];"
            f"[voice_mix][music_low]amix=inputs=2:duration=first:normalize=0[outa]"
        )

    raw_mix = work_dir / "master_mix_raw.wav"
    _run_subprocess(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(voice_leveled),
            "-i",
            str(music_path),
            "-filter_complex",
            mix_filter,
            "-map",
            "[outa]",
            "-ar",
            str(sample_rate),
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(raw_mix),
        ],
        "Duck and mix audio stems",
    )

    # Two-pass loudnorm per Appendix B recommendation for accurate -14 LUFS / -1.0 dBTP
    pass1_stderr = _run_subprocess(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(raw_mix),
            "-af",
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:print_format=json",
            "-f",
            "null",
            "-",
        ],
        "Loudnorm pass 1",
    )
    json_match = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", pass1_stderr, flags=re.S)
    if json_match:
        stats = json.loads(json_match[-1])
        ln_filter = (
            f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11:"
            f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
            f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
            f"offset={stats['target_offset']}:linear=true:print_format=summary"
        )
    else:
        ln_filter = f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11"

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    _run_subprocess(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(raw_mix),
            "-af",
            f"{ln_filter},atrim=duration={total_dur:.3f}",
            "-ar",
            str(sample_rate),
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(out_wav),
        ],
        "Loudnorm pass 2",
    )
    return {"mix_wav": str(out_wav), "duration_seconds": measure_wav_duration(out_wav), "two_pass": bool(json_match)}


def _assemble_single_aspect(
    ffmpeg_exe: str,
    storyboard: dict[str, Any],
    *,
    aspect_key: str,
    out_mp4: Path,
    audio_mix_wav: Path,
    intermediate_dir: Path,
    root_dir: Path,
) -> dict[str, Any]:
    """Assemble all 10 shots + transitions + subtitles + AI disclosure end card for one aspect ratio."""
    t0 = time.perf_counter()
    out_cfg = storyboard["outputs"][aspect_key]
    target_w = int(out_cfg["width"])
    target_h = int(out_cfg["height"])
    fps = int(storyboard["project"]["fps"])
    end_card_dur = float(storyboard["outputs"]["end_card"]["duration_seconds"])
    schedule = compute_shot_transition_schedule(storyboard)

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        shot_mp4s: list[Path] = []
        for idx, shot in enumerate(storyboard["shots"]):
            seg_path = work / f"norm_{shot['shot_id']}.mp4"
            _render_normalized_shot(
                ffmpeg_exe,
                shot,
                schedule[idx]["segment_duration"],
                aspect_key=aspect_key,
                target_w=target_w,
                target_h=target_h,
                fps=fps,
                out_mp4=seg_path,
                root_dir=root_dir,
            )
            shot_mp4s.append(seg_path)

        # Chain 9 transitions across 10 clips
        cmd_inputs: list[str] = []
        for p in shot_mp4s:
            cmd_inputs.extend(["-i", str(p)])

        filter_parts: list[str] = []
        # Apply opening fade-from-black on Shot 1 honoring editing.transition_in
        shot1_fade = float(storyboard["shots"][0]["editing"].get("transition_duration_seconds") or 0.8)
        filter_parts.append(f"[0:v]fade=t=in:st=0:d={shot1_fade:.2f}[v0]")
        prev_label = "[v0]"

        for i in range(len(shot_mp4s) - 1):
            next_label = f"[{i + 1}:v]"
            out_label = f"[vx{i}]"
            tr = schedule[i]["join_after_transition"]
            d = schedule[i]["join_after_duration"]
            off = schedule[i]["join_after_offset"]
            filter_parts.append(f"{prev_label}{next_label}xfade=transition={tr}:duration={d:.3f}:offset={off:.3f}{out_label}")
            prev_label = out_label

        # Closing fade-to-black on Shot 10 + subtitle burn-in on 80.0s film timeline
        story_dur = float(storyboard["project"]["target_duration_seconds"])
        shot10_fade = float(storyboard["shots"][-1]["editing"].get("transition_duration_seconds") or 1.0)
        ass_path = write_ass_subtitles(
            storyboard,
            aspect_key=aspect_key,
            out_ass=intermediate_dir / f"subtitles_{aspect_key}.ass",
            root_dir=root_dir,
        )
        ass_escaped = _escape_ffmpeg_filter_path(ass_path)
        filter_parts.append(
            f"{prev_label}fade=t=out:st={max(0.0, story_dur - shot10_fade):.3f}:d={shot10_fade:.2f},"
            f"ass='{ass_escaped}',trim=duration={story_dur:.3f},setpts=PTS-STARTPTS[story_v]"
        )

        story_video = work / f"story_{aspect_key}.mp4"
        _run_subprocess(
            [
                ffmpeg_exe,
                "-y",
                *cmd_inputs,
                "-filter_complex",
                ";".join(filter_parts),
                "-map",
                "[story_v]",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "18",
                "-pix_fmt",
                "yuv420p",
                "-r",
                str(fps),
                str(story_video),
            ],
            f"Join & subtitle {aspect_key}",
        )

        # Render 3.0s AI disclosure end card cleanly with subtle fade in/out
        card_png = render_end_card_png(
            storyboard,
            aspect_key=aspect_key,
            out_png=intermediate_dir / f"end_card_{aspect_key}.png",
        )
        end_card_mp4 = work / f"end_card_{aspect_key}.mp4"
        _run_subprocess(
            [
                ffmpeg_exe,
                "-y",
                "-loop",
                "1",
                "-t",
                f"{end_card_dur:.3f}",
                "-i",
                str(card_png),
                "-vf",
                f"fps={fps},format=yuv420p,fade=t=in:st=0:d=0.4,fade=t=out:st={max(0.0, end_card_dur - 0.45):.2f}:d=0.45,setsar=1",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "16",
                "-pix_fmt",
                "yuv420p",
                "-r",
                str(fps),
                str(end_card_mp4),
            ],
            f"Render end card {aspect_key}",
        )

        # Concatenate 80.0s film + 3.0s end card and mux normalized 83.0s stereo audio mix
        out_mp4.parent.mkdir(parents=True, exist_ok=True)
        _run_subprocess(
            [
                ffmpeg_exe,
                "-y",
                "-i",
                str(story_video),
                "-i",
                str(end_card_mp4),
                "-i",
                str(audio_mix_wav),
                "-filter_complex",
                "[0:v][1:v]concat=n=2:v=1:a=0[full_v]",
                "-map",
                "[full_v]",
                "-map",
                "2:a",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "18",
                "-profile:v",
                "high",
                "-level",
                "4.1",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-ar",
                "48000",
                "-shortest",
                str(out_mp4),
            ],
            f"Final mux {aspect_key}",
        )

    probe = probe_media(out_mp4, ffmpeg_exe=ffmpeg_exe)
    probe["render_seconds"] = round(time.perf_counter() - t0, 2)
    return probe


def assemble_final_films(
    *,
    root_dir: Path = ROOT_DIR,
    force: bool = False,
) -> dict[str, Any]:
    """Assemble final 9:16 vertical and 16:9 horizontal MP4 deliverables from storyboard.json."""
    sb_path = root_dir / "storyboard.json"
    schema_path = root_dir / "schema" / "storyboard.schema.json"
    storyboard = load_storyboard(sb_path)
    validate_storyboard(storyboard, schema_path=schema_path)

    intermediate_dir = root_dir / INTERMEDIATE_DIR_REL
    intermediate_dir.mkdir(parents=True, exist_ok=True)
    cache_path = intermediate_dir / "assembly_cache.json"
    cache = load_cache(cache_path)

    asset_fingerprints: dict[str, Any] = {}
    for shot in storyboard["shots"]:
        sid = shot["shot_id"]
        clip_rel = shot.get("generation", {}).get("video", {}).get("clip_path")
        aud_rel = shot["audio"]["narration_sync"]["audio_path"]
        kf_rel = shot.get("generation", {}).get("image", {}).get("keyframe_path")
        for tag, rel in (("clip", clip_rel), ("audio", aud_rel), ("keyframe", kf_rel)):
            if rel and (root_dir / rel).exists():
                st = (root_dir / rel).stat()
                asset_fingerprints[f"{sid}:{tag}"] = f"{rel}:{st.st_size}:{int(st.st_mtime)}"
    music_rel = storyboard["music_plan"]["audio_path"]
    if music_rel and (root_dir / music_rel).exists():
        st = (root_dir / music_rel).stat()
        asset_fingerprints["music"] = f"{music_rel}:{st.st_size}:{int(st.st_mtime)}"

    payload = {
        "outputs": storyboard["outputs"],
        "project": storyboard["project"],
        "music_plan": {"audio_path": music_rel},
        "shots": [
            {
                "shot_id": s["shot_id"],
                "duration_seconds": s["duration_seconds"],
                "subtitle": s["narrative"]["english_subtitle_text"],
                "offset": s["audio"]["narration_sync"]["offset_seconds"],
                "editing": s.get("editing"),
            }
            for s in storyboard["shots"]
        ],
        "assets": asset_fingerprints,
    }
    input_hash = compute_hash(payload)

    targets = {
        "vertical": root_dir / VERTICAL_OUTPUT_REL,
        "horizontal": root_dir / HORIZONTAL_OUTPUT_REL,
    }

    ffmpeg_exe = get_ffmpeg_exe()
    assembled = 0
    cached = 0
    exports: dict[str, Any] = {}

    need_build = any(
        force or cache.get(k, {}).get("input_hash") != input_hash or not path.exists() or path.stat().st_size < 100_000
        for k, path in targets.items()
    )

    audio_stats: dict[str, Any] | None = None
    master_mix_wav = intermediate_dir / "master_mix_83s.wav"
    if need_build:
        with tempfile.TemporaryDirectory() as audio_tmp:
            audio_stats = build_master_audio_mix(
                ffmpeg_exe,
                storyboard,
                out_wav=master_mix_wav,
                work_dir=Path(audio_tmp),
                root_dir=root_dir,
            )

    for aspect_key, out_mp4 in targets.items():
        if (
            not force
            and cache.get(aspect_key, {}).get("input_hash") == input_hash
            and out_mp4.exists()
            and out_mp4.stat().st_size > 100_000
        ):
            exports[aspect_key] = cache[aspect_key]["probe"]
            cached += 1
            continue

        probe = _assemble_single_aspect(
            ffmpeg_exe,
            storyboard,
            aspect_key=aspect_key,
            out_mp4=out_mp4,
            audio_mix_wav=master_mix_wav,
            intermediate_dir=intermediate_dir,
            root_dir=root_dir,
        )
        exports[aspect_key] = probe
        cache[aspect_key] = {
            "input_hash": input_hash,
            "output_path": str(out_mp4.relative_to(root_dir)).replace("\\", "/"),
            "probe": probe,
        }
        save_cache(cache_path, cache)
        assembled += 1

    # Save non-schema-breaking manifest separately and update storyboard's schema-allowed notes if needed.
    manifest = {
        "assembled": assembled,
        "cached": cached,
        "vertical_output": VERTICAL_OUTPUT_REL,
        "horizontal_output": HORIZONTAL_OUTPUT_REL,
        "audio_mix": audio_stats or {"mix_wav": str(master_mix_wav)},
        "exports": exports,
    }
    (intermediate_dir / "assembly_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Assemble final 9:16 and 16:9 Harar Heritage Short MP4s.")
    parser.add_argument("--force", action="store_true", help="Rebuild both exports even when inputs match cache.")
    args = parser.parse_args()
    result = assemble_final_films(force=args.force)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
