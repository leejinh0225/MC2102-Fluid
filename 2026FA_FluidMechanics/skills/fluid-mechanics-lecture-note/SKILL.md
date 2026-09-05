---
name: fluid-mechanics-lecture-note
description: Create or extend MC2102 Fluid Mechanics Korean lecture-replacement notes from a 4:3 source PDF and one timestamped English lecture transcript, using the repository's fixed Lecture 1 template.
---

# Fluid Mechanics Lecture Note

## Required context

Read `../../NOTE_AUTHORING_GUIDE.md`, `../../강의_인덱스.md`, `../../site/lecture01.html` and `../../site/templates/lecture-page.template.html` before authoring.

Lecture 1 is the single visual and structural baseline. Copy the template to start a new page. Reuse `../../site/assets/css/styles.css` and `../../site/assets/js/site.js`. Consult `../../design_reference/crimson2.md` only for shared design tokens.

## Source handling

- Use all PDF pages in exact order, one 1440×1080 image and one source-section per page.
- Read the entire reviewed English transcript. The lecture uses one continuous timestamp axis.
- Reconcile PDF, lecture context and transcript. Keep an unlisted date as 날짜 미기재.
- Retain source diagrams and formulas; label source errors and editorial supplements with evidence.
- Store recordings, audio, raw transcripts, model caches and senior materials under the ignored private-materials folder.

## Authoring contract

- Preserve section order: overview, concept-map, concept-summary, all source-section blocks, exam-english, glossary, asr-log, sources.
- Preserve template IDs, exact section classes, aria-labelledby, heading hierarchy and card nesting.
- Only overview has section-divider. It contains a kicker, concise h2 and lead paragraph.
- Use course-map for exactly two concept cards and one connecting arrow. Use grid-2 or grid-3 for other concept counts.
- exam-english uses note-stack > exam-card > answer > answer__label. It has no divider background.
- Table classes belong to real table elements. Keep every source image in source-slide > source-slide__frame.
- Explain definitions, relationships, assumptions, symbols, units and worked steps. A translated bullet list is insufficient.
- Repeat important terminology as English(한국어). Add a standalone concept summary, model English answers, glossary, transcript audit and sources.
- Keep a neutral academic voice. Reader-facing text explains this course and its concepts. Source provenance belongs in captions, evidence and sources; tool setup belongs in scripts/README.md.

## Navigation contract

- The home-page hero uses a crimson 강의자료 PDF N개 button linking to downloads.html; N is the total number of PDF files provided.
- The downloads-page hero uses a neutral 학습 노트 홈 button linking to index.html. Neither archive-page hero links to a specific lecture.
- On the home page, each completed lecture card starts with the crimson button Lecture N 읽기.
- It is followed by neutral 가림막 제거 PDF and 원본 PDF buttons.
- Lecture-page hero actions are the neutral cleaned PDF, neutral original PDF, then 강의 목록.
- PDF links retain the exact filename in download and use type="application/pdf".
- Provide both PDF variants on downloads.html, without a recommended-version highlight.

## Completion

Run both site validators and the layout regression tests documented in the authoring guide. Verify desktop and mobile rendering before setting ready: true. The main README links directly to the live site and completed lecture.
