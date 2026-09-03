from __future__ import annotations

import argparse
import json
from copy import deepcopy
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply a human-reviewed correction manifest to faster-whisper JSON."
    )
    parser.add_argument("raw_json", type=Path)
    parser.add_argument("corrections_json", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--basename", default="lecture")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def timestamp(seconds: float, decimal: str = ".") -> str:
    milliseconds = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{decimal}{millis:03d}"


def write_text(path: Path, content: str) -> None:
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(content, encoding="utf-8", newline="\n")
    temporary.replace(path)


def main() -> None:
    args = parse_args()
    raw_path = args.raw_json.resolve()
    corrections_path = args.corrections_json.resolve()
    output_dir = args.output_dir.resolve()

    raw: dict[str, Any] = json.loads(raw_path.read_text(encoding="utf-8"))
    manifest: dict[str, Any] = json.loads(corrections_path.read_text(encoding="utf-8"))
    segments = deepcopy(raw.get("segments", []))
    by_source_index = {int(segment["index"]): segment for segment in segments}

    corrections = manifest.get("corrections", [])
    seen: set[int] = set()
    omitted: set[int] = set()
    for correction in corrections:
        source_index = int(correction["index"])
        if source_index in seen:
            raise SystemExit(f"Duplicate correction for segment {source_index}")
        seen.add(source_index)
        if source_index not in by_source_index:
            raise SystemExit(f"Unknown source segment {source_index}")

        if correction.get("omit", False):
            omitted.add(source_index)
            continue

        reviewed_text = str(correction.get("text", "")).strip()
        if not reviewed_text:
            raise SystemExit(f"Correction {source_index} has empty text")
        segment = by_source_index[source_index]
        segment["text"] = reviewed_text
        # Word timings describe the unreviewed ASR tokens and no longer align after editing.
        segment["words"] = None
        segment["reviewed_text_changed"] = True

    reviewed_segments: list[dict[str, Any]] = []
    for segment in segments:
        source_index = int(segment["index"])
        if source_index in omitted:
            continue
        segment["source_index"] = source_index
        segment["index"] = len(reviewed_segments) + 1
        segment.setdefault("reviewed_text_changed", False)
        reviewed_segments.append(segment)

    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "txt": output_dir / f"{args.basename}.txt",
        "srt": output_dir / f"{args.basename}.srt",
        "json": output_dir / f"{args.basename}.json",
    }
    existing = [path for path in outputs.values() if path.exists()]
    if existing and not args.force:
        raise SystemExit("Reviewed output exists; pass --force to replace it")

    txt_lines = [
        f"# {manifest.get('title', 'Lecture transcript — reviewed English ASR')}",
        "# Language: English",
        f"# Review basis: {manifest.get('review_basis', 'lecture recording and source slides')}",
        "# Technical terms and obvious ASR repetitions were corrected; timestamps remain tied to the recording.",
        "",
    ]
    srt_blocks: list[str] = []
    for segment in reviewed_segments:
        start = float(segment["start"])
        end = float(segment["end"])
        text = str(segment["text"]).strip()
        txt_lines.append(f"[{timestamp(start)}–{timestamp(end)}] {text}")
        srt_blocks.append(
            f"{segment['index']}\n"
            f"{timestamp(start, ',')} --> {timestamp(end, ',')}\n"
            f"{text}"
        )

    reviewed = deepcopy(raw)
    reviewed["status"] = "reviewed"
    reviewed["segments"] = reviewed_segments
    reviewed["review"] = {
        "basis": manifest.get("review_basis"),
        "method": manifest.get("review_method"),
        "changed_segment_count": len(seen - omitted),
        "omitted_segment_count": len(omitted),
        "personal_information_removed": int(
            manifest.get("personal_information_removed", 0)
        ),
        "notes": manifest.get("notes", []),
    }

    write_text(outputs["txt"], "\n".join(txt_lines) + "\n")
    write_text(outputs["srt"], "\n\n".join(srt_blocks) + "\n")
    write_text(outputs["json"], json.dumps(reviewed, ensure_ascii=False, indent=2) + "\n")

    print(f"segments={len(reviewed_segments)}")
    print(f"changed={len(seen - omitted)}")
    print(f"omitted={len(omitted)}")
    for name, path in outputs.items():
        print(f"{name}={path}")


if __name__ == "__main__":
    main()
