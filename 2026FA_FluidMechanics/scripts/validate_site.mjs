import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateLectureLayout,
  validateHomeActions,
  parseHtml,
} from "./lecture_layout.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "../site");
const errors = [];
const manifestPath = join(root, "data/lectures.json");
const pdfDownloadBase =
  "https://github.com/leejinh0225/MC2102-Fluid/raw/refs/heads/main/2026FA_FluidMechanics/lecture_notes/";
const pdfVariantRules = [
  { key: "cleaned", label: "가림막 제거 PDF 다운로드", primary: false },
  { key: "original", label: "원본 PDF 다운로드", primary: false },
];

if (!existsSync(manifestPath)) {
  console.error("SITE_VALIDATION_FAILED (1)\n- missing data/lectures.json");
  process.exit(1);
}

let lectures = [];
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  lectures = manifest.lectures;
  if (!Array.isArray(lectures)) throw new Error("lectures must be an array");
} catch (error) {
  console.error(
    `SITE_VALIDATION_FAILED (1)\n- invalid lecture manifest: ${error.message}`,
  );
  process.exit(1);
}

const readyLectures = lectures.filter(({ ready }) => ready === true);
const pages = [
  "index.html",
  "downloads.html",
  ...readyLectures.map(({ page }) => page),
];
const attrValues = (html, attr) =>
  [...html.matchAll(new RegExp(`${attr}=["']([^"']+)["']`, "g"))].map(
    (match) => match[1],
  );
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasPdfDownloadAnchor = (html, url, filename) => {
  const escapedUrl = escapeRegex(url);
  const escapedFile = escapeRegex(filename);
  return new RegExp(
    `<a\\b(?=[^>]*href=["']${escapedUrl}["'])(?=[^>]*download=["']${escapedFile}["'])(?=[^>]*type=["']application/pdf["'])[^>]*>`,
  ).test(html);
};

for (const page of pages) {
  const pagePath = join(root, page);
  if (!existsSync(pagePath)) {
    errors.push(`${page}: missing page`);
    continue;
  }

  const html = readFileSync(pagePath, "utf8");
  errors.push(...parseHtml(html).errors.map((error) => `${page}: ${error}`));
  if (
    /Recording boundary|동역학\s*(?:노트|저장소|버전)|MC2103|재생 버튼|CUDA|faster-whisper|비공개 녹화/.test(
      html,
    )
  )
    errors.push(`${page}: reader-facing production commentary found`);
  for (const anchor of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (
      anchor[1].includes("application/pdf") &&
      /button--primary/.test(anchor[1])
    )
      errors.push(`${page}: PDF actions must be neutral`);
  }
  const ids = attrValues(html, "id");
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length)
    errors.push(
      `${page}: duplicate ids ${[...new Set(duplicateIds)].join(", ")}`,
    );

  for (const href of attrValues(html, "href")) {
    if (href.startsWith("#")) {
      if (!ids.includes(href.slice(1)))
        errors.push(`${page}: missing anchor target ${href}`);
      continue;
    }
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const localPath = href.split(/[?#]/, 1)[0];
    if (localPath && !existsSync(resolve(dirname(pagePath), localPath))) {
      errors.push(`${page}: missing local href ${href}`);
    }
  }

  for (const src of attrValues(html, "src")) {
    if (/^(https?:|data:)/.test(src)) continue;
    if (!existsSync(resolve(dirname(pagePath), src)))
      errors.push(`${page}: missing src ${src}`);
  }

  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html))
    errors.push(`${page}: image without alt`);
  if (/\{\{[A-Z0-9_가-힣]+\}\}/.test(html))
    errors.push(`${page}: unresolved placeholder`);
  if (/(에델|노이슈반트|마스터|메이드|츠ン데레)/i.test(html))
    errors.push(`${page}: private persona text found`);
  if (/(학습 목표|자가\s*점검|Learning goals?|Self check)/i.test(html))
    errors.push(`${page}: excluded study-planning section found`);
  if (
    /(private-materials|file:\/\/|(?:^|[\s"'=(>])[A-Za-z]:[\\/]|youtube\.com|youtu\.be|<\s*(?:video|audio|source)\b|\.(?:mp4|mkv|mov|webm|avi|m4v|flv|wmv|mpg|mpeg|ts|mts|m2ts|wav|m4a|mp3|aac|flac|opus|ogg)(?:["'?#\s]|$))/i.test(
      html,
    )
  ) {
    errors.push(`${page}: private recording or local media reference found`);
  }
}

const index = existsSync(join(root, "index.html"))
  ? readFileSync(join(root, "index.html"), "utf8")
  : "";
const downloads = existsSync(join(root, "downloads.html"))
  ? readFileSync(join(root, "downloads.html"), "utf8")
  : "";
if (!index.includes('href="downloads.html"'))
  errors.push("index.html: missing downloads page link");

errors.push(
  ...validateHomeActions(index, lectures).map(
    (error) => `index.html: ${error}`,
  ),
);
const templatePath = join(root, "templates/lecture-page.template.html");
if (!existsSync(templatePath)) errors.push("missing lecture template");
else
  errors.push(
    ...validateLectureLayout(readFileSync(templatePath, "utf8"), 1, {
      template: true,
    }).map((error) => `template: ${error}`),
  );

const pdfRecords = [];
for (const lecture of lectures) {
  for (const variant of pdfVariantRules) {
    const filename = lecture.pdfs?.[variant.key];
    if (
      typeof filename !== "string" ||
      !/^lecture\d{2}_(?:note|original)\.pdf$/.test(filename)
    ) {
      errors.push(
        `manifest: invalid ${variant.key} PDF for ${lecture.slug ?? "unknown lecture"}`,
      );
      continue;
    }
    pdfRecords.push({
      ...variant,
      filename,
      url: `${pdfDownloadBase}${filename}`,
      slug: lecture.slug,
    });
  }
}

const downloadPdfHrefs = attrValues(downloads, "href").filter(
  (href) => href.startsWith(pdfDownloadBase) && href.endsWith(".pdf"),
);
if (downloadPdfHrefs.length !== pdfRecords.length) {
  errors.push(
    `downloads.html: expected ${pdfRecords.length} PDF links, found ${downloadPdfHrefs.length}`,
  );
}
for (const record of pdfRecords) {
  const sourcePdfPath = resolve(root, "../lecture_notes", record.filename);
  if (!existsSync(sourcePdfPath))
    errors.push(`downloads.html: missing source PDF file ${record.filename}`);
  if (!hasPdfDownloadAnchor(downloads, record.url, record.filename)) {
    errors.push(
      `downloads.html: missing downloadable link for ${record.filename}`,
    );
  }
}
if (!downloads.includes("가림막 제거본") || !downloads.includes("원본")) {
  errors.push(
    "downloads.html: both cleaned and original PDF variants must be identified",
  );
}
let totalSlideFiles = 0;
let totalSourceSections = 0;

for (const lecture of lectures) {
  const { page, slug, expectedSlides, ready } = lecture;
  if (
    !page ||
    !slug ||
    !Number.isInteger(expectedSlides) ||
    expectedSlides < 1 ||
    typeof ready !== "boolean"
  ) {
    errors.push(`manifest: invalid lecture entry ${JSON.stringify(lecture)}`);
    continue;
  }

  const pageLink = `href="${page}"`;
  if (ready && !index.includes(pageLink))
    errors.push(`index.html: missing ready lecture link to ${page}`);
  if (!ready && index.includes(pageLink))
    errors.push(`index.html: pending lecture must not link to ${page}`);
  for (const variant of pdfVariantRules) {
    const filename = lecture.pdfs?.[variant.key];
    if (typeof filename !== "string") continue;
    const url = `${pdfDownloadBase}${filename}`;
    if (!hasPdfDownloadAnchor(index, url, filename)) {
      errors.push(`index.html: missing ${variant.key} PDF action for ${slug}`);
    }
  }

  const slideDir = join(root, `assets/slides/${slug}`);
  if (!existsSync(slideDir)) {
    errors.push(`${slug} slides: missing directory`);
    continue;
  }
  const slideFiles = readdirSync(slideDir)
    .filter((name) => /^slide-\d{2}\.jpg$/.test(name))
    .sort();
  totalSlideFiles += slideFiles.length;
  if (slideFiles.length !== expectedSlides) {
    errors.push(
      `${slug} slides: expected ${expectedSlides} images, found ${slideFiles.length}`,
    );
  }
  for (let index = 1; index <= expectedSlides; index += 1) {
    const expected = `slide-${String(index).padStart(2, "0")}.jpg`;
    if (!slideFiles.includes(expected))
      errors.push(`${slug} slides: missing ${expected}`);
  }

  if (!ready) continue;
  const lecturePath = join(root, page);
  if (!existsSync(lecturePath)) continue;
  const lectureHtml = readFileSync(lecturePath, "utf8");
  errors.push(
    ...validateLectureLayout(lectureHtml, expectedSlides).map(
      (error) => `${page}: ${error}`,
    ),
  );
  if (!lectureHtml.includes('id="concept-summary"'))
    errors.push(`${page}: missing standalone concept summary`);
  const sourceSections = [
    ...lectureHtml.matchAll(/class=["'][^"']*\bsource-section\b[^"']*["']/g),
  ].length;
  totalSourceSections += sourceSections;
  if (sourceSections !== expectedSlides) {
    errors.push(
      `${page}: expected ${expectedSlides} source sections, found ${sourceSections}`,
    );
  }
  for (let index = 1; index <= expectedSlides; index += 1) {
    const number = String(index).padStart(2, "0");
    if (!lectureHtml.includes(`id="slide-${number}"`))
      errors.push(`${page}: missing slide section ${index}`);
  }
  const hero =
    lectureHtml.match(/<section class="hero">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const heroHrefs = attrValues(hero, "href");
  const expectedHeroHrefs = pdfVariantRules.map(
    ({ key }) => `${pdfDownloadBase}${lecture.pdfs[key]}`,
  );
  expectedHeroHrefs.push("index.html");
  if (
    heroHrefs.length !== expectedHeroHrefs.length ||
    expectedHeroHrefs.some((href, index) => heroHrefs[index] !== href)
  ) {
    errors.push(
      `${page}: hero must contain the two PDF actions and the lecture index action`,
    );
  }
  const heroAnchors = [...hero.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/g)].map(
    (match) => ({
      attrs: match[1],
      classes: attrValues(match[1], "class")[0]?.split(/\s+/) ?? [],
      href: attrValues(match[1], "href")[0] ?? "",
    }),
  );
  for (const variant of pdfVariantRules) {
    const filename = lecture.pdfs[variant.key];
    const url = `${pdfDownloadBase}${filename}`;
    const action = heroAnchors.find(({ href }) => href === url);
    if (
      !action ||
      !hasPdfDownloadAnchor(`<a ${action.attrs}>`, url, filename)
    ) {
      errors.push(`${page}: invalid ${variant.key} PDF download action`);
      continue;
    }
    if (variant.primary !== action.classes.includes("button--primary")) {
      errors.push(
        `${page}: ${variant.key} PDF action has incorrect button emphasis`,
      );
    }
  }
  const lectureIndexAction = heroAnchors.find(
    ({ href }) => href === "index.html",
  );
  if (
    !lectureIndexAction ||
    lectureIndexAction.classes.includes("button--primary")
  ) {
    errors.push(
      `${page}: lecture index action must keep neutral button styling`,
    );
  }
}

if (errors.length) {
  console.error(`SITE_VALIDATION_FAILED (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `SITE_VALIDATION_OK pages=${pages.length} ready=${readyLectures.length} source_sections=${totalSourceSections} slides=${totalSlideFiles}`,
);
