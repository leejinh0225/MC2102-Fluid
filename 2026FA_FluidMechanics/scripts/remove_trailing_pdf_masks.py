from __future__ import annotations

import argparse
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream


TEXT_OPERATORS = {b"Tj", b"TJ", b"'", b'"'}
COLOR_OPERATORS = {b"sc", b"scn", b"rg"}
FILL_OPERATORS = {b"f", b"f*", b"B", b"B*"}
UNSAFE_TAIL_OPERATORS = TEXT_OPERATORS | {b"Do", b"BI", b"ID", b"EI"}


def is_white(operands: list[object]) -> bool:
    try:
        return len(operands) == 3 and all(float(value) == 1.0 for value in operands)
    except (TypeError, ValueError):
        return False


def strip_page_masks(page: object, pdf_context: object) -> int:
    content = page.get_contents()
    if content is None:
        return 0

    stream = ContentStream(content, pdf_context)
    operations = stream.operations
    text_indices = [
        index for index, (_, operator) in enumerate(operations) if operator in TEXT_OPERATORS
    ]
    if not text_indices:
        return 0

    last_text = text_indices[-1]
    mask_start = next(
        (
            index
            for index in range(last_text + 1, len(operations))
            if operations[index][1] in COLOR_OPERATORS
            and is_white(operations[index][0])
        ),
        None,
    )
    if mask_start is None:
        return 0

    tail = operations[mask_start:]
    if any(operator in UNSAFE_TAIL_OPERATORS for _, operator in tail):
        raise ValueError("Trailing white-mask block contains text or image content")

    mask_count = sum(operator in FILL_OPERATORS for _, operator in tail)
    if mask_count == 0:
        return 0

    kept = operations[:mask_start]
    graphics_depth = sum(operator == b"q" for _, operator in kept) - sum(
        operator == b"Q" for _, operator in kept
    )
    if graphics_depth < 0:
        raise ValueError("Unbalanced graphics state before trailing mask block")
    kept.extend(([], b"Q") for _ in range(graphics_depth))

    stream.operations = kept
    page.replace_contents(stream)
    return mask_count


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Remove trailing white answer-mask rectangles from a PowerPoint PDF."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    if args.source.resolve() == args.output.resolve():
        raise ValueError("Output must be a new file; the source PDF is never overwritten")

    reader = PdfReader(args.source)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    removed_by_page: dict[int, int] = {}
    for page_number, page in enumerate(writer.pages, start=1):
        removed = strip_page_masks(page, writer)
        if removed:
            removed_by_page[page_number] = removed

    if not removed_by_page:
        raise ValueError("No trailing white-mask blocks were detected")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("wb") as output_stream:
        writer.write(output_stream)

    print(f"pages={len(writer.pages)}")
    print(f"removed_masks={sum(removed_by_page.values())}")
    print(
        "affected_pages="
        + ",".join(f"{page}:{count}" for page, count in removed_by_page.items())
    )


if __name__ == "__main__":
    main()
