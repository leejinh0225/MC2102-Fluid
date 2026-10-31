import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  parseHtml,
  byId,
  elements,
  hasClass,
  textOf,
} from "./lecture_layout.mjs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const root = parseHtml(read("site/lecture07.html")).root;
const json = (p) => JSON.parse(read("transcripts/lecture07/" + p));
test("all captions use the single Week 7 clock and distinguish the closing PDF summary", () => {
  const rows = json("slide-map.json").slides;
  assert.equal(rows.length, 37);
  for (const [i, r] of rows.entries()) {
    const section = byId(root, "slide-" + String(i + 1).padStart(2, "0"));
    const caption = elements(section).find((x) => x.tag === "figure");
    assert.equal(r.slide, i + 1);
    if (i < 36) {
      assert.equal(r.evidence, "slide_and_lecture");
      assert.ok(r.end_seconds > r.start_seconds && r.end_seconds <= 5839);
      assert.ok(textOf(caption).includes(r.range));
    } else {
      assert.equal(r.evidence, "pdf_only");
      assert.equal(r.range, null);
      assert.match(textOf(caption), /별도 구두 해설 없음/);
    }
  }
});
test("ASR edits preserve source segment boundaries and agree with TXT and SRT", () => {
  const { segments, review } = json("lecture.json");
  const changed = new Map(
    json("corrections.json").corrections.map((c) => [c.index, c.text]),
  );
  const txt = read("transcripts/lecture07/lecture.txt"),
    srt = read("transcripts/lecture07/lecture.srt");
  assert.equal(segments.length, 250);
  assert.equal(changed.size, review.changed_segment_count);
  assert.equal(review.omitted_segment_count, 0);
  assert.equal(
    createHash("sha256")
      .update(
        JSON.stringify(segments.map((s) => [s.source_index, s.start, s.end])),
      )
      .digest("hex"),
    "e38bfd63a22ab82f7d861822ef2ca036aaa7ef29491e7e63c720cd72a5b9ae9d",
  );
  for (const s of segments) {
    assert.equal(s.index, s.source_index);
    if (changed.has(s.index)) {
      assert.equal(s.text, changed.get(s.index));
      assert.equal(s.words, null);
    }
    assert.ok(txt.includes(s.text.trim()) && srt.includes(s.text.trim()));
  }
});
test("corrected formulas appear in the topic card before its separately attributed evidence", () => {
  for (const [id, term] of [
    ["12", "a+b−3c+1 = 0"],
    ["22", "St = ωL/V"],
    ["25", "1/Fr² = gL/V²"],
    ["34", "Π₃ = L/D"],
    ["35", "3.24×10⁹"],
    ["36", "0.155 ReD1.75"],
  ]) {
    const stack = elements(byId(root, "slide-" + id)).find((x) =>
      hasClass(x, "note-stack"),
    );
    const [topic, review] = elements(stack);
    assert.ok(textOf(topic).replace(/\s+/g, " ").includes(term), id);
    assert.equal(review.attrs.id, "source-check-" + id);
    assert.match(textOf(elements(review).at(-1)).trim(), /^편집자 보강 · /);
  }
  const review = textOf(byId(root, "source-check-35")).replace(/\s+/g, " ");
  assert.ok(
    review.includes("4,068 Pa") &&
      review.includes("4,680 Pa") &&
      review.includes("3.73×10⁹"),
  );
  const pi = (dp) => (680 * 0.01 ** 2 * dp) / 2.92e-4 ** 2;
  assert.equal((pi(4068) / 1e9).toFixed(2), "3.24");
  assert.equal((pi(4680) / 1e9).toFixed(2), "3.73");
});
