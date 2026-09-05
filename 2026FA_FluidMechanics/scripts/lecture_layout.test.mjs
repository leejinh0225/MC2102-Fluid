import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  validateLectureLayout,
  validateHomeActions,
} from "./lecture_layout.mjs";

const site = new URL("../site/", import.meta.url);
const lecture = readFileSync(new URL("lecture01.html", site), "utf8");
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
