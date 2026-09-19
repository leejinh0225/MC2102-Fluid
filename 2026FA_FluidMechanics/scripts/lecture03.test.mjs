import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  parseHtml,
  byId,
  elements,
  descendants,
  hasClass,
  textOf,
  validateLectureLayout,
} from "./lecture_layout.mjs";

const site = new URL("../site/", import.meta.url);
const html = readFileSync(new URL("lecture03.html", site), "utf8");
const root = parseHtml(html).root;
const text = (n) => textOf(n).replace(/\s+/g, " ").trim();
const cards = (n) =>
  elements(
    elements(byId(root, `slide-${n}`)).find((x) => hasClass(x, "note-stack")),
  );

test("Lecture 3 preserves the complete template contract and all 54 slides", () => {
  assert.deepEqual(validateLectureLayout(html, 54), []);
  assert.equal(
    descendants(root).filter((n) => hasClass(n, "source-section")).length,
    54,
  );
});
test("adopted equations are in topic cards before separate evidence cards", () => {
  for (const [n, formula] of [
    ["17", "4(Q₁ + Q₃ − Q₂)/(πd²)"],
    ["21", "−∮_CS p_gauge n dA"],
    ["33", "ρA(V₁ − V_B)²"],
    ["39", "(∂ρ/∂t)A ds"],
    ["44", "A₂√[2ρΔp/(1 − β⁴)]"],
    ["46", "d/dt ∫_CV ρe dVol"],
    ["48", "d/dt ∫_CV ρe dVol"],
  ]) {
    const list = cards(n);
    const topic = list.findIndex((c) =>
      descendants(c).some(
        (x) => hasClass(x, "formula") && text(x).includes(formula),
      ),
    );
    const review = list.findIndex((c) => c.attrs.id === `source-check-${n}`);
    assert.ok(topic >= 0 && review > topic, `slide ${n}`);
    assert.equal(hasClass(list[topic], "source-review"), false);
    const footer = elements(list[review]).at(-1);
    assert.ok(hasClass(footer, "evidence"));
    assert.match(text(footer), /^편집자 보강 · /);
  }
});
test("all slide explanations stay inside cards; supplementary labels stay in footers", () => {
  const allowed = [
    "card",
    "callout",
    "exam-card",
    "quiet-card",
    "grid-2",
    "grid-3",
  ];
  for (let i = 1; i <= 54; i++) {
    const n = String(i).padStart(2, "0");
    const stack = elements(byId(root, `slide-${n}`)).find((x) =>
      hasClass(x, "note-stack"),
    );
    for (const child of stack.children) {
      if (child.tag === "#text") assert.equal(child.value.trim(), "");
      else
        assert.ok(
          allowed.some((c) => hasClass(child, c)),
          `slide ${n}`,
        );
    }
    for (const c of cards(n)) {
      assert.doesNotMatch(text(elements(c)[0]), /편집자 보강/);
    }
  }
});
test("missing Part 3 is not silently replaced by Chapter 2 review", () => {
  for (let i = 37; i <= 54; i++) {
    const s = byId(root, `slide-${String(i).padStart(2, "0")}`);
    const figure = elements(s).find((x) => x.tag === "figure");
    assert.match(text(figure), /PDF 해설 · 대응 강의 미제공/);
    assert.doesNotMatch(text(figure), /Part [34]|\d\d:\d\d:\d\d/);
  }
  assert.match(text(byId(root, "sources")), /37–54쪽: 대응 강의 미제공/);
  assert.doesNotMatch(html, /V₁=V₂=0 표기/);
});
test("worked example arithmetic and directions are consistent", () => {
  const q1 = ((Math.PI * 0.05 ** 2) / 4) * 3;
  assert.ok(Math.abs((q1 + 0.01) / ((Math.PI * 0.07 ** 2) / 4) - 4.13) < 0.001);
  const bolt =
    (23 * Math.PI * 12 ** 2) / 4 - ((1.94 * Math.PI) / 4) * 14 * (56 - 14);
  assert.ok(Math.abs(bolt - 1705.3193) < 0.001);
  assert.equal(-1000 * 0.0003 * (20 - 15) ** 2, -7.5);
  const heat =
    700 * 550 + 0.325 * (6003 * (495 - 760) + (244 ** 2 - 100 ** 2) / 2);
  assert.ok(Math.abs(heat - -123958.775) < 0.001);
  assert.ok(Math.abs((heat * 3600) / 778.2 - -573440.74788) < 0.01);
});
test("reviewed transcripts preserve all primary segment times and editorial attribution", () => {
  for (const [part, count] of [
    ["01", 138],
    ["02", 116],
  ]) {
    const data = JSON.parse(
      readFileSync(
        new URL(`../transcripts/lecture03/part${part}/lecture.json`, site),
        "utf8",
      ),
    );
    assert.equal(data.status, "reviewed");
    assert.equal(data.segments.length, count);
    for (const s of data.segments) {
      assert.ok(s.start >= 0 && s.end > s.start);
      assert.ok(s.end <= data.duration_seconds);
      assert.equal(s.index, s.source_index);
      if (s.reviewed_text_changed) assert.equal(s.words, null);
    }
  }
  const part1 = readFileSync(
    new URL("../transcripts/lecture03/part01/lecture.txt", site),
    "utf8",
  );
  const part2 = readFileSync(
    new URL("../transcripts/lecture03/part02/lecture.txt", site),
    "utf8",
  );
  assert.match(part1, /\[Review note: The spoken\/displayed numerator/);
  assert.match(part2, /\[Review note: This zero-force claim/);
});
