from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.hrefs: list[str] = []
        self.srcs: list[str] = []
        self.images_without_alt = 0
        self.source_sections = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if values.get("href"):
            self.hrefs.append(values["href"] or "")
        if values.get("src"):
            self.srcs.append(values["src"] or "")
        if tag == "img" and not (values.get("alt") or "").strip():
            self.images_without_alt += 1
        if tag == "section" and "source-section" in (values.get("class") or "").split():
            self.source_sections += 1


def fail(errors: list[str]) -> None:
    print(f"LECTURE_SITE_VALIDATION_FAILED ({len(errors)})")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 4:
        print("usage: validate_lecture_site.py <site-dir> <lecture-html> <expected-pages>")
        raise SystemExit(2)

    site_dir = Path(sys.argv[1]).resolve()
    page_path = site_dir / sys.argv[2]
    expected = int(sys.argv[3])
    errors: list[str] = []

    if not page_path.is_file():
        fail([f"missing HTML: {page_path}"])

    html = page_path.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(html)

    duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate ids: {', '.join(duplicates)}")
    if parser.images_without_alt:
        errors.append(f"images without alt: {parser.images_without_alt}")
    if parser.source_sections != expected:
        errors.append(f"expected {expected} source sections, found {parser.source_sections}")
    if re.search(r"\{\{[A-Z0-9_가-힣]+\}\}", html):
        errors.append("unresolved template placeholder")
    if re.search(r"에델|노이슈반트|마스터|메이드|츠ン데레", html, re.IGNORECASE):
        errors.append("private persona text found")
    if re.search(r"학습 목표|자가\s*점검|Learning goals?|Self check", html, re.IGNORECASE):
        errors.append("excluded study-planning section found")
    if re.search(
        r"private-materials|file://|(?<![A-Za-z])[A-Za-z]:[\\/]|youtube\.com|youtu\.be|"
        r"<\s*(?:video|audio|source)\b|\.(?:mp4|mkv|mov|webm|avi|m4v|flv|wmv|mpg|mpeg|ts|mts|m2ts|wav|m4a|mp3|aac|flac|opus|ogg)(?:[\"'?#\s]|$)",
        html,
        re.IGNORECASE,
    ):
        errors.append("private recording or local media reference found")
    if "concept-summary" not in parser.ids:
        errors.append("missing standalone concept summary")

    for href in parser.hrefs:
        if href.startswith("#"):
            if href[1:] not in parser.ids:
                errors.append(f"missing anchor target: {href}")
            continue
        if re.match(r"^(?:https?:|mailto:|tel:)", href):
            continue
        target = (page_path.parent / href.split("?", 1)[0].split("#", 1)[0]).resolve()
        if href and not target.exists():
            errors.append(f"missing local href: {href}")

    slide_srcs = [src for src in parser.srcs if re.search(r"/slide-\d{2}\.jpg$", src)]
    if len(slide_srcs) != expected:
        errors.append(f"expected {expected} slide images, found {len(slide_srcs)}")
    for index, src in enumerate(slide_srcs, start=1):
        expected_name = f"slide-{index:02d}.jpg"
        if not src.endswith(expected_name):
            errors.append(f"slide order mismatch at {index}: {src}")
        image_path = (page_path.parent / src).resolve()
        if not image_path.is_file():
            errors.append(f"missing slide image: {src}")
            continue
        with Image.open(image_path) as image:
            if image.size != (1440, 1080):
                errors.append(f"wrong slide dimensions {src}: {image.size}")

    hero_match = re.search(r'<section class="hero">([\s\S]*?)</section>', html)
    if not hero_match:
        errors.append("missing hero section")
    else:
        hero_hrefs = re.findall(r'href=["\']([^"\']+)["\']', hero_match.group(1))
        expected_pdf_suffixes = [
            f"/lecture_notes/{page_path.stem}_note.pdf",
            f"/lecture_notes/{page_path.stem}_original.pdf",
        ]
        if len(hero_hrefs) != 3:
            errors.append("hero must contain cleaned PDF, original PDF, and lecture index actions")
        else:
            if not hero_hrefs[0].endswith(expected_pdf_suffixes[0]):
                errors.append("hero first action must download the cleaned PDF")
            if not hero_hrefs[1].endswith(expected_pdf_suffixes[1]):
                errors.append("hero second action must download the original PDF")
            if hero_hrefs[2] != "index.html":
                errors.append("hero third action must return to the lecture index")

    if errors:
        fail(errors)
    print(f"LECTURE_SITE_VALIDATION_OK page={page_path.name} source_sections={expected} slides={expected}")


if __name__ == "__main__":
    main()
