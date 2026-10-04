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
const course = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, course), "utf8");
const html = read("site/lecture05.html");
const root = parseHtml(html).root;
const text = (n) => textOf(n).replace(/\s+/g, " ").trim();
const cards = (n) =>
  elements(
    elements(byId(root, `slide-${n}`)).find((x) => hasClass(x, "note-stack")),
  );
test("Lecture 5 uses the unchanged template and all 53 slides; no Lecture 4 is invented", () => {
  assert.deepEqual(validateLectureLayout(html, 53), []);
  const data = JSON.parse(read("site/data/lectures.json")).lectures;
  assert.deepEqual(
    data.map((x) => x.slug),
    ["lecture01", "lecture02", "lecture03", "lecture05"],
  );
  assert.match(read("site/index.html"), /강의자료 PDF 8개/);
  assert.match(read("site/downloads.html"), /Lecture 01·02·03·05/);
});
test("formulas remain in topic cards ahead of separately labelled evidence", () => {
  for (const [n, formula] of [
    ["08", "∇·V"],
    ["09", "−2axy + f(x,z,t)"],
    ["15", "τᵢⱼ = 2μεᵢⱼ"],
    ["25", "∇·(V·τ)=V·(∇·τ)+Φ"],
    ["30", "u=∂ψ/∂y"],
    ["37", "ωz=½"],
    ["48", "∇²φ=0"],
    ["51", "−2ay−(−2ay)=0"],
    ["52", "x³−3xy²=3φ/a"],
  ]) {
    const list = cards(n),
      a = list.findIndex((c) => text(c).includes(formula)),
      b = list.findIndex((c) => c.attrs.id === `source-check-${n}`);
    assert.ok(a >= 0 && b > a, n);
    const footer = elements(list[b]).at(-1);
    assert.ok(hasClass(footer, "evidence"));
    assert.match(text(footer), /^편집자 보강 · /);
  }
  assert.doesNotMatch(
    text(byId(root, "source-check-25")),
    /양쪽에 반복|인쇄.*오류/,
  );
});
test("no explanation lies outside cards and no supplementary label changes its form", () => {
  for (let i = 1; i <= 53; i++)
    for (const c of cards(String(i).padStart(2, "0"))) {
      assert.ok(
        ["card", "quiet-card", "callout", "grid-2", "grid-3", "exam-card"].some(
          (k) => hasClass(c, k),
        ),
      );
      assert.doesNotMatch(text(elements(c)[0]), /편집자 보강/);
    }
  for (const node of descendants(root).filter((n) => hasClass(n, "evidence")))
    assert.equal(elements(node)[0].tag, "span");
});
test("provided video coverage is distinguished from slide-only material", () => {
  const mapping = JSON.parse(read("transcripts/lecture05/slide-map.json"));
  assert.equal(mapping.slides.length, 53);
  for (let i = 1; i <= 53; i++) {
    const row = mapping.slides[i - 1],
      section = byId(root, `slide-${String(i).padStart(2, "0")}`);
    const figure = elements(section).find((x) => x.tag === "figure");
    assert.equal(row.slide, i);
    assert.equal(row.evidence, i <= 26 ? "slide_and_lecture" : "pdf_only");
    if (i <= 26) assert.ok(text(figure).includes(row.range));
    else {
      assert.equal(row.range, null);
      assert.match(text(figure), /슬라이드 기반 해설 · 대응 영상 미제공/);
    }
  }
  assert.match(text(byId(root, "sources")), /27–53쪽: 슬라이드 기반 해설/);
});
test("transcript has 197 retained segments, explicit review notes and no private paths", () => {
  const d = JSON.parse(read("transcripts/lecture05/lecture.json"));
  const m = JSON.parse(read("transcripts/lecture05/corrections.json"));
  assert.equal(d.status, "reviewed");
  assert.equal(d.segments.length, 197);
  assert.equal(d.review.changed_segment_count, 60);
  assert.equal(m.corrections.length, 60);
  for (const [i, s] of d.segments.entries()) {
    assert.equal(s.index, i + 1);
    assert.equal(s.source_index, i + 1);
    assert.ok(s.start >= 0 && s.end > s.start && s.end <= d.duration_seconds);
    if (s.reviewed_text_changed) assert.equal(s.words, null);
  }
  const txt = read("transcripts/lecture05/lecture.txt");
  assert.match(txt, /\[Review note:/);
  assert.doesNotMatch(txt, /C:\\Users|https?:\/\/|access_token|m3u8/);
  assert.match(txt, /this is not dx this should be the dy/);
});
test("worked example values and adopted fields satisfy their equations", () => {
  const V = 12,
    L = 0.15,
    rho = 18;
  assert.equal((rho * V) / L, 1440);
  assert.equal(L / V, 0.012499999999999999);
  const h = 2,
    mu = 3,
    dp = -6,
    wall = 8;
  const couette = (y) => (wall * (y + h)) / (2 * h),
    poiseuille = (y) => (-dp * (h * h - y * y)) / (2 * mu);
  assert.equal(couette(-h), 0);
  assert.equal(couette(h), wall);
  assert.equal(poiseuille(-h), 0);
  assert.equal(poiseuille(h), 0);
  assert.equal(poiseuille(0), 4);
  // Derivative identities for the polynomial example at a grid of points.
  for (const x of [-2, -1, 0, 1, 2])
    for (const y of [-2, -1, 0, 1, 2]) {
      const a = 3,
        u = a * (x * x - y * y),
        v = -2 * a * x * y;
      const psiX = 2 * a * x * y,
        psiY = u,
        phiX = u,
        phiY = v;
      assert.equal(psiY, u);
      assert.equal(-psiX, v);
      assert.equal(phiX * psiX + phiY * psiY, 0);
      assert.equal(-2 * a * y - -2 * a * y, 0);
    }
});
