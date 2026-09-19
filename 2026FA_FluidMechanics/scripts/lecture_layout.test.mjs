import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  validateLectureLayout,
  validateHomeActions,
  parseHtml,
  byId,
  descendants,
  elements,
  hasClass,
  textOf,
} from "./lecture_layout.mjs";

const site = new URL("../site/", import.meta.url);
const lecture = readFileSync(new URL("lecture01.html", site), "utf8");
const lecture2 = readFileSync(new URL("lecture02.html", site), "utf8");
const lecture2Root = parseHtml(lecture2).root;
const slideCards = (number) => {
  const section = byId(lecture2Root, `slide-${number}`);
  const stack = elements(section).find((node) => hasClass(node, "note-stack"));
  return elements(stack);
};
const normalizedText = (node) => textOf(node).replace(/\s+/g, " ").trim();
const template = readFileSync(
  new URL("templates/lecture-page.template.html", site),
  "utf8",
);
const home = readFileSync(new URL("index.html", site), "utf8");
const { lectures } = JSON.parse(
  readFileSync(new URL("data/lectures.json", site), "utf8"),
);

test("published lecture and authoring template meet the same layout contract", () => {
  assert.deepEqual(validateLectureLayout(lecture, 23), []);
  assert.deepEqual(validateLectureLayout(lecture2, 32), []);
  assert.deepEqual(validateLectureLayout(template, 1, { template: true }), []);
  assert.deepEqual(validateHomeActions(home, lectures), []);
});
test("rejects divider color inheritance in exam cards", () => {
  const broken = lecture.replace(
    /class="editorial-section"\s+id="exam-english"/,
    'class="editorial-section section-divider" id="exam-english"',
  );
  assert.match(
    validateLectureLayout(broken, 23).join("\n"),
    /exam-english: incorrect section classes/,
  );
});
test("rejects an extra concept in the two-card flow component", () => {
  const broken = lecture.replace(
    /<div class="course-map">/,
    '<div class="course-map"><div class="course-map__card">Extra</div>',
  );
  assert.match(
    validateLectureLayout(broken, 23).join("\n"),
    /exactly two cards/,
  );
});
test("rejects table styles on plain divs", () => {
  const broken = lecture.replace(
    /<div class="quiet-card">/,
    '<div class="compare-table">',
  );
  assert.match(validateLectureLayout(broken, 23).join("\n"), /non-table/);
});
test("rejects misplaced answers even when answer counts are unchanged", () => {
  const start = lecture.indexOf('id="exam-english"');
  const broken =
    lecture.slice(0, start) +
    lecture
      .slice(start)
      .replace(
        /<div class="answer">/,
        '<section class="wrapper"><div class="answer">',
      )
      .replace(
        /<\/div>\s*<p style="margin-top: 12px">/,
        '</div></section><p style="margin-top: 12px">',
      );
  assert.match(validateLectureLayout(broken, 23).join("\n"), /exam-card needs/);
});
test("rejects missing heading associations and source images in the wrong section", () => {
  const broken = lecture
    .replace(
      'aria-labelledby="overview-title"',
      'aria-labelledby="wrong-title"',
    )
    .replace(
      'src="assets/slides/lecture01/slide-02.jpg"',
      'src="assets/slides/lecture01/slide-03.jpg"',
    );
  const errors = validateLectureLayout(broken, 23).join("\n");
  assert.match(errors, /heading or aria-labelledby/);
  assert.match(errors, /source image order/);
});
test("rejects PDF emphasis and replacement of the reading label", () => {
  const broken = home
    .replace(/Lecture 1 읽기/g, "Lecture 1 정리노트")
    .replace(
      /<a\s+class="button"\s+href="([^"]+lecture01_note.pdf)"/g,
      '<a class="button button--primary" href="$1"',
    );
  const errors = validateHomeActions(broken, lectures).join("\n");
  assert.match(errors, /primary reading link/);
  assert.match(errors, /neutral actions/);
});

test("Lecture 2 keeps adopted equations in topic cards before correction notes", () => {
  for (const [number, formula] of [
    ["05", "dFₓ = p dy dz"],
    ["12", "p₂ − p₁ = −γ(z₂ − z₁)"],
    ["21", "P = (38,400 lbf)(4.58333 ft)/(6 ft)"],
    ["24", "T + F_B − W = 0"],
  ]) {
    const cards = slideCards(number);
    const topicIndex = cards.findIndex((card) =>
      descendants(card).some(
        (node) => hasClass(node, "formula") && normalizedText(node).includes(formula),
      ),
    );
    const reviewIndex = cards.findIndex(
      (card) => card.attrs.id === `source-check-${number}`,
    );
    assert.ok(topicIndex >= 0 && reviewIndex > topicIndex, `slide ${number}`);
    assert.equal(hasClass(cards[topicIndex], "source-review"), false);
  }
});

test("Lecture 2 separates the vapor-pressure supplement from the barometer explanation", () => {
  const [topic, supplement] = slideCards("10");
  assert.match(normalizedText(topic), /h = pₐ\/γ_Hg/);
  assert.doesNotMatch(normalizedText(topic), /p_vapor|편집자 보강/);
  assert.match(normalizedText(supplement), /h = \(pₐ − p_vapor\)\/γ_Hg/);
});

test("Lecture 2 marks supplementary derivations with the established footer badge", () => {
  for (const number of ["10", "19", "23", "31"]) {
    const supplement = slideCards(number).at(-1);
    const children = elements(supplement);
    assert.doesNotMatch(normalizedText(children[0]), /편집자 보강/);
    assert.ok(hasClass(children.at(-1), "evidence"), `slide ${number}`);
    assert.ok(elements(children.at(-1)).some(
      (node) => node.tag === "span" && normalizedText(node).startsWith("편집자 보강 · "),
    ));
  }
});

test("Lecture 2 gate correction retains lbf and correctly attributes the hinge reaction", () => {
  const review = normalizedText(byId(lecture2Root, "source-check-21"));
  assert.match(review, /P=23,900 lbf/);
  assert.match(review, /P≈29,331 lbf/);
  assert.match(review, /P≈29,333 lbf/);
  assert.match(review, /강의에서 이어 계산한 Bₓ≈6,300 lbf/);
  assert.doesNotMatch(review, /\d[\d,.]*\s*(?:N|kN)\b/);
  assert.ok(Math.abs(38400 * (5 - 5 / 12) / 6 - 29333.333333) < 0.001);
});

test("Lecture 2 sphere correction agrees with the upward cable tension", () => {
  const review = normalizedText(byId(lecture2Root, "source-check-24"));
  assert.match(review, /구를 위에서 매단 케이블/);
  assert.match(review, /장력과 부력이 위쪽, 무게가 아래쪽/);
  assert.match(review, /T\+F_B−W=0/);
  assert.doesNotMatch(review, /구를 바닥에 연결한/);
});

test("Lecture 2 has one area correction and no loose slide explanations", () => {
  const cards = slideCards("05");
  assert.equal(cards.length, 2);
  assert.equal(cards.filter((card) => hasClass(card, "source-review")).length, 1);
  const allowed = ["card", "callout", "exam-card", "quiet-card", "warning", "key-sentence", "grid-2", "grid-3"];
  for (let i = 1; i <= 32; i += 1) {
    const number = String(i).padStart(2, "0");
    const section = byId(lecture2Root, `slide-${number}`);
    const stack = elements(section).find((node) => hasClass(node, "note-stack"));
    assert.ok(stack);
    for (const child of stack.children) {
      if (child.tag === "#text") assert.equal(child.value.trim(), "");
      else assert.ok(allowed.some((name) => hasClass(child, name)), `slide ${number}: ${child.tag}`);
    }
  }
});
