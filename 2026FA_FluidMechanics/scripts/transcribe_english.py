from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


DEFAULT_PROMPT = (
    "This is an English university lecture on fluid mechanics. "
    "Technical terms include fluid statics, fluid dynamics, continuum, density, "
    "control volume, control surface, Eulerian description, viscosity, dynamic viscosity, "
    "kinematic viscosity, Newtonian fluid, dimensions, units, mass, force, pressure, "
    "specific weight, specific gravity, velocity field, and flow analysis."
)

DEFAULT_HOTWORDS = (
    "fluid mechanics, fluid statics, fluid dynamics, continuum, density, rho, "
    "control volume, control surface, Eulerian, viscosity, dynamic viscosity, "
    "kinematic viscosity, Newtonian fluid, Reynolds number"
)


_DLL_DIRECTORY_HANDLES: list[Any] = []


def configure_windows_cuda_dlls() -> list[Path]:
    """Expose CUDA runtime DLLs installed by NVIDIA's official pip wheels."""
    if sys.platform != "win32":
        return []

    site_packages = Path(sys.prefix) / "Lib" / "site-packages"
    candidates = [
        site_packages / "nvidia" / "cublas" / "bin",
        site_packages / "nvidia" / "cudnn" / "bin",
        site_packages / "nvidia" / "cuda_nvrtc" / "bin",
    ]
    available = [path for path in candidates if path.is_dir()]
    if not available:
        return []

    os.environ["PATH"] = os.pathsep.join(
        [*(str(path) for path in available), os.environ.get("PATH", "")]
    )
    if hasattr(os, "add_dll_directory"):
        for path in available:
            _DLL_DIRECTORY_HANDLES.append(os.add_dll_directory(str(path)))
    return available


@dataclass
class TranscriptSegment:
    index: int
    start: float
    end: float
    text: str
    average_log_probability: float
    no_speech_probability: float
    words: list[dict[str, Any]] | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Transcribe one private English lecture video or audio file with faster-whisper "
            "and write review-ready TXT, SRT, and JSON files."
        )
    )
    parser.add_argument("input_media", type=Path, help="Private lecture video or audio file")
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Private staging or tracked transcript directory",
    )
    parser.add_argument("--basename", default="lecture", help="Output basename; default: lecture")
    parser.add_argument("--model", default="turbo", help="Whisper model name or local model path")
    parser.add_argument("--device", choices=("auto", "cuda", "cpu"), default="auto")
    parser.add_argument(
        "--compute-type",
        default="default",
        help="CTranslate2 compute type, such as default, float16, int8_float16, or int8",
    )
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--vad-min-silence-ms", type=int, default=1000)
    parser.add_argument("--no-vad", action="store_true", help="Disable silence filtering")
    parser.add_argument("--word-timestamps", action="store_true")
    parser.add_argument("--initial-prompt", default=DEFAULT_PROMPT)
    parser.add_argument(
        "--model-cache",
        type=Path,
        help="Model cache directory; defaults to private-materials/models/faster-whisper",
    )
    parser.add_argument("--offline", action="store_true", help="Use only an already cached model")
    parser.add_argument("--force", action="store_true", help="Replace existing transcript outputs")
    return parser.parse_args()


def timestamp_text(seconds: float) -> str:
    milliseconds = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def timestamp_srt(seconds: float) -> str:
    return timestamp_text(seconds).replace(".", ",")


def atomic_write(path: Path, content: str) -> None:
    temporary = path.with_name(f".{path.name}.tmp")
    with temporary.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write(content)
    temporary.replace(path)


def main() -> None:
    args = parse_args()
    input_media = args.input_media.resolve()
    if not input_media.is_file():
        raise SystemExit(f"Input media does not exist or is not a file: {input_media}")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", args.basename):
        raise SystemExit("--basename may contain only letters, numbers, underscores, and hyphens")
    if args.beam_size < 1:
        raise SystemExit("--beam-size must be at least 1")
    if args.vad_min_silence_ms < 0:
        raise SystemExit("--vad-min-silence-ms cannot be negative")

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "txt": output_dir / f"{args.basename}.txt",
        "srt": output_dir / f"{args.basename}.srt",
        "json": output_dir / f"{args.basename}.json",
    }
    existing = [path for path in outputs.values() if path.exists()]
    if existing and not args.force:
        joined = "\n".join(f"- {path}" for path in existing)
        raise SystemExit(f"Transcript output already exists; use --force to replace it:\n{joined}")

    cuda_dll_directories = configure_windows_cuda_dlls()
    if cuda_dll_directories:
        print(
            "Using NVIDIA pip runtime DLLs from: "
            + ", ".join(str(path) for path in cuda_dll_directories),
            file=sys.stderr,
        )

    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        requirements = Path(__file__).with_name("requirements-stt.txt")
        raise SystemExit(
            "faster-whisper is not installed. Create a local virtual environment and run:\n"
            f"python -m pip install -r \"{requirements}\""
        ) from error

    repository_root = Path(__file__).resolve().parents[2]
    model_cache = (
        args.model_cache.resolve()
        if args.model_cache
        else repository_root / "private-materials" / "models" / "faster-whisper"
    )
    model_cache.mkdir(parents=True, exist_ok=True)

    print(
        f"Loading model={args.model} device={args.device} compute_type={args.compute_type}",
        file=sys.stderr,
    )
    model = WhisperModel(
        args.model,
        device=args.device,
        compute_type=args.compute_type,
        download_root=str(model_cache),
        local_files_only=args.offline,
    )

    vad_enabled = not args.no_vad
    transcribe_options: dict[str, Any] = {
        "language": "en",
        "task": "transcribe",
        "beam_size": args.beam_size,
        "vad_filter": vad_enabled,
        "word_timestamps": args.word_timestamps,
        "initial_prompt": args.initial_prompt,
        "hotwords": DEFAULT_HOTWORDS,
        "log_progress": True,
    }
    if vad_enabled:
        transcribe_options["vad_parameters"] = {
            "min_silence_duration_ms": args.vad_min_silence_ms
        }

    segment_stream, info = model.transcribe(str(input_media), **transcribe_options)
    transcript_segments: list[TranscriptSegment] = []
    for source_segment in segment_stream:
        text = source_segment.text.strip()
        if not text:
            continue
        words = None
        if args.word_timestamps and source_segment.words:
            words = [
                {
                    "start": round(float(word.start), 3),
                    "end": round(float(word.end), 3),
                    "word": word.word,
                    "probability": round(float(word.probability), 6),
                }
                for word in source_segment.words
            ]
        transcript_segments.append(
            TranscriptSegment(
                index=len(transcript_segments) + 1,
                start=round(float(source_segment.start), 3),
                end=round(float(source_segment.end), 3),
                text=text,
                average_log_probability=round(float(source_segment.avg_logprob), 6),
                no_speech_probability=round(float(source_segment.no_speech_prob), 6),
                words=words,
            )
        )

    if not transcript_segments:
        raise SystemExit("No speech segments were detected; no transcript files were written")

    txt_lines = [
        "# Lecture transcript — unreviewed ASR",
        "# Language: English",
        "# Review technical terms and personal information before publication.",
        "",
    ]
    srt_blocks = []
    for segment in transcript_segments:
        txt_lines.append(
            f"[{timestamp_text(segment.start)}–{timestamp_text(segment.end)}] {segment.text}"
        )
        srt_blocks.append(
            f"{segment.index}\n"
            f"{timestamp_srt(segment.start)} --> {timestamp_srt(segment.end)}\n"
            f"{segment.text}"
        )

    metadata = {
        "schema_version": 1,
        "status": "unreviewed_asr",
        "engine": "faster-whisper",
        "model": args.model,
        "requested_device": args.device,
        "requested_compute_type": args.compute_type,
        "requested_language": "en",
        "detected_language": getattr(info, "language", None),
        "language_probability": round(float(getattr(info, "language_probability", 0.0)), 6),
        "duration_seconds": round(float(getattr(info, "duration", 0.0)), 3),
        "duration_after_vad_seconds": round(
            float(getattr(info, "duration_after_vad", 0.0) or 0.0), 3
        ),
        "vad_enabled": vad_enabled,
        "vad_min_silence_ms": args.vad_min_silence_ms if vad_enabled else None,
        "word_timestamps": args.word_timestamps,
        "segments": [asdict(segment) for segment in transcript_segments],
    }

    atomic_write(outputs["txt"], "\n".join(txt_lines) + "\n")
    atomic_write(outputs["srt"], "\n\n".join(srt_blocks) + "\n")
    atomic_write(outputs["json"], json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")

    print(f"segments={len(transcript_segments)}")
    print(f"detected_language={metadata['detected_language']}")
    print(f"language_probability={metadata['language_probability']}")
    for name, path in outputs.items():
        print(f"{name}={path}")


if __name__ == "__main__":
    main()
