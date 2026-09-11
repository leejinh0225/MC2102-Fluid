"""Regression checks for source-bound Chapter 2 masking and legacy Chapter 1."""
import hashlib
import json
import logging
import unittest
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream
from remove_trailing_pdf_masks import strip_page_masks

ROOT = Path(__file__).resolve().parents[1]
logging.getLogger('pypdf').setLevel(logging.ERROR)


class MaskTests(unittest.TestCase):
    def test_chapter2_source_and_manifest(self):
        source = ROOT / 'lecture_notes/lecture02_original.pdf'
        manifest = json.loads((ROOT / 'scripts/lecture02_masks.json').read_text())
        self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), manifest['source_sha256'])
        reader = PdfReader(source)
        for page, pairs in manifest['pages'].items():
            ops = ContentStream(reader.pages[int(page)-1].get_contents(), reader).operations
            for fill, stroke in pairs:
                self.assertEqual(ops[fill][1], b'f')
                self.assertEqual(ops[stroke][1], b'S')

    def test_chapter2_preserves_text_and_images(self):
        original = PdfReader(ROOT / 'lecture_notes/lecture02_original.pdf')
        cleaned = PdfReader(ROOT / 'lecture_notes/lecture02_note.pdf')
        self.assertEqual(len(original.pages), 32)
        self.assertEqual(len(cleaned.pages), 32)
        preserved = {b'Tj', b'TJ', b"'", b'"', b'Do'}
        for a,b in zip(original.pages, cleaned.pages):
            self.assertEqual(a.extract_text(), b.extract_text())
            def ops(page, pdf):
                return [(str(args),op) for args,op in ContentStream(page.get_contents(),pdf).operations if op in preserved]
            self.assertEqual(ops(a,original), ops(b,cleaned))

    def test_chapter1_legacy_path_preserves_text_draw_operations(self):
        reader = PdfReader(ROOT / 'lecture_notes/lecture01_original.pdf')
        writer = PdfWriter(); writer.clone_document_from_reader(reader)
        count=0
        for page in writer.pages:
            def text_ops():
                return [(str(args),op) for args,op in ContentStream(page.get_contents(),writer).operations if op in {b'Tj',b'TJ',b"'",b'"'}]
            before = text_ops()
            count += strip_page_masks(page,writer)
            self.assertEqual(before,text_ops())
        self.assertGreater(count,0)


if __name__ == '__main__':
    unittest.main()
