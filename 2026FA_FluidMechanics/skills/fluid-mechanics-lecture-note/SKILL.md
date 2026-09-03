---
name: fluid-mechanics-lecture-note
description: Create or extend scrollable Korean Fluid Mechanics 1 lecture-replacement HTML notes from a 4:3 source PDF and one private English lecture transcript per lecture. Use for slide-by-slide layout, bilingual exam terminology, ASR reconciliation, privacy-safe provenance, and consistency with the Dynamics note system.
---

# Fluid Mechanics Lecture Note

Use this skill when authoring a Fluid Mechanics 1 lecture page in this repository.

## Read before authoring

Read these files completely:

1. `../../NOTE_AUTHORING_GUIDE.md`
2. `../../강의_인덱스.md`
3. `../../site/templates/lecture-page.template.html`
4. `assets/dynamics-lecture01-reference.html`
5. `assets/dynamics-lecture02-reference.html`

Read `../../design_reference/crimson2.md` only when changing the shared visual system.

## Source model

Each lecture has:

- one cleaned source PDF;
- one public copy of the untouched original PDF, while its immutable backup remains private;
- one private English lecture recording;
- one reviewed transcript derived from that recording.

Do not carry over the Dynamics assumption of multiple public YouTube videos. Never publish or link the recording or extracted audio. In the hero, provide the primary cleaned-PDF download, the neutral original-PDF download, and then the neutral lecture-index action.

## Required workflow

1. Confirm the PDF page count and 4:3 dimensions.
2. Confirm that transcript timestamps span the single recording and that personal or off-topic speech has been removed from the public text.
3. Reconcile terminology and formulas against the PDF before writing.
4. Draft an independent concept summary.
5. Create exactly one `.source-section` per PDF page in order.
6. Repeat important terms as `English(한국어)` where they help with an English exam.
7. Add exam English, glossary, transcript audit, and source provenance.
8. Mark outside-domain explanation as `편집자 보강`.
9. Connect both public PDF variants to `downloads.html`, the index card, and the lecture hero with matching filenames and download attributes.
10. Run both validators.
11. Set the lecture manifest entry to `ready: true` and add the index link only after validation succeeds.

## Non-negotiable checks

- Source images are `1440 × 1080`; do not stretch them to 16:9.
- All PDF pages appear once and in order.
- No recording URL, filename, local drive path, media element, or private directory name appears in public HTML.
- Both public PDFs exist, and the cleaned copy is primary while the original copy remains neutral.
- No invented professor intent, schedule, or assessment claim.
- No unresolved template placeholders.
- No persona language, study-planning section, or self-check section in the public artifact.
