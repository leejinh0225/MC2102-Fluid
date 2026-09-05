// Structural checks for the authored, explicitly closed HTML used by this site.
const voidTags = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(
    " ",
  ),
);
export const hasClass = (node, name) =>
  (node.attrs?.class ?? "").split(/\s+/).includes(name);
export const elements = (node) =>
  node.children.filter((child) => child.tag !== "#text");
export const descendants = (node) =>
  elements(node).flatMap((child) => [child, ...descendants(child)]);
export const textOf = (node) =>
  node.tag === "#text" ? node.value : node.children.map(textOf).join("");
export const byId = (root, id) =>
  descendants(root).find((node) => node.attrs.id === id);

export function parseHtml(html) {
  const root = { tag: "#document", attrs: {}, children: [] };
  const stack = [root];
  const errors = [];
  const tokens =
    html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? [];
  for (const token of tokens) {
    if (token.startsWith("<!")) continue;
    if (!token.startsWith("<")) {
      stack.at(-1).children.push({ tag: "#text", value: token });
      continue;
    }
    const tag = token.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (token.startsWith("</")) {
      if (stack.at(-1).tag !== tag)
        errors.push(`unbalanced closing tag </${tag}>`);
      else stack.pop();
      continue;
    }
    const attrs = {};
    for (const match of token.matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
    )) {
      attrs[match[1]] = match[2] ?? match[3];
    }
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!voidTags.has(tag) && !token.endsWith("/>")) stack.push(node);
  }
  if (stack.length !== 1)
    errors.push(
      `unclosed elements: ${stack
        .slice(1)
        .map((n) => n.tag)
        .join(", ")}`,
    );
  return { root, errors };
}

const editorial = {
  overview: ["overview-title", "Lecture overview"],
  "concept-map": ["map-title", "Concept map"],
  "concept-summary": ["concept-summary-title", "Content summary"],
  "exam-english": ["exam-title", "Exam English"],
  glossary: ["glossary-title", "Core glossary"],
  "asr-log": ["asr-title", "Transcript audit"],
  sources: ["sources-title", "Sources"],
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const exactClass = (node, classes) =>
  same(
    (node?.attrs.class ?? "").split(/\s+/).filter(Boolean).sort(),
    classes.toSorted(),
  );

export function validateLectureLayout(
  html,
  expectedSlides,
  { template = false } = {},
) {
  const { root, errors } = parseHtml(html);
  const main = byId(root, "main");
  if (!main) return [...errors, "missing main content"];
  const sections = elements(main).filter((node) => node.tag === "section");
  const slideIds = template
    ? ["slide-{{NN}}"]
    : Array.from(
        { length: expectedSlides },
        (_, i) => `slide-${String(i + 1).padStart(2, "0")}`,
      );
  const expectedOrder = [
    "overview",
    "concept-map",
    "concept-summary",
    ...slideIds,
    "exam-english",
    "glossary",
    "asr-log",
    "sources",
  ];
  if (
    !same(
      sections.map((s) => s.attrs.id),
      expectedOrder,
    )
  )
    errors.push("fixed section order differs from the template");
  for (const section of sections) {
    const id = section.attrs.id;
    const titleId = editorial[id]?.[0] ?? `${id}-title`;
    const expectedClass =
      id === "overview"
        ? ["editorial-section", "section-divider"]
        : slideIds.includes(id)
          ? ["source-section"]
          : ["editorial-section"];
    if (!exactClass(section, expectedClass))
      errors.push(`#${id}: incorrect section classes`);
    const children = elements(section);
    const kicker = children[0],
      heading = children[1];
    if (kicker?.tag !== "p" || !hasClass(kicker, "section-kicker"))
      errors.push(`#${id}: missing leading kicker`);
    if (
      editorial[id] &&
      textOf(kicker ?? { children: [] }).trim() !== editorial[id][1]
    )
      errors.push(`#${id}: incorrect kicker`);
    if (
      heading?.tag !== "h2" ||
      !hasClass(heading, "section-title") ||
      heading.attrs.id !== titleId ||
      section.attrs["aria-labelledby"] !== titleId
    )
      errors.push(`#${id}: incorrect heading or aria-labelledby`);
    if (
      id === "overview" &&
      !same(
        children.map((n) => n.tag),
        ["p", "h2", "p"],
      )
    )
      errors.push("overview must contain only kicker, heading and lead");
    if (slideIds.includes(id)) {
      const figure = children[2],
        stack = children[3];
      if (
        children.length !== 4 ||
        figure?.tag !== "figure" ||
        !hasClass(figure, "source-slide") ||
        !hasClass(stack ?? {}, "note-stack")
      )
        errors.push(`#${id}: expected kicker, heading, figure, note-stack`);
      if (figure) {
        const frame = elements(figure)[0],
          caption = elements(figure)[1];
        const imgs = frame ? elements(frame) : [];
        if (
          !hasClass(frame ?? {}, "source-slide__frame") ||
          imgs.length !== 1 ||
          imgs[0]?.tag !== "img" ||
          caption?.tag !== "figcaption"
        )
          errors.push(`#${id}: invalid source-slide frame`);
        const expectedSrc = template
          ? "assets/slides/{{LECTURE_SLUG}}/slide-{{NN}}.jpg"
          : `assets/slides/${html.match(/src="assets\/slides\/([^/]+)\//)?.[1]}/${id}.jpg`;
        if (imgs[0]?.attrs.src !== expectedSrc)
          errors.push(`#${id}: source image order mismatch`);
        if (imgs[0]?.attrs.width !== "1440" || imgs[0]?.attrs.height !== "1080")
          errors.push(`#${id}: source image attributes must be 1440x1080`);
      }
    }
  }
  for (const node of descendants(root)) {
    if (
      (hasClass(node, "term-table") || hasClass(node, "compare-table")) &&
      node.tag !== "table"
    )
      errors.push("table styling used on a non-table element");
    if (hasClass(node, "course-map")) {
      const children = elements(node);
      if (
        children.length !== 3 ||
        !hasClass(children[0] ?? {}, "course-map__card") ||
        !hasClass(children[1] ?? {}, "course-map__arrow") ||
        !hasClass(children[2] ?? {}, "course-map__card")
      )
        errors.push("course-map requires exactly two cards and one arrow");
    }
  }
  const exam = byId(root, "exam-english");
  const stack =
    exam && elements(exam).find((node) => hasClass(node, "note-stack"));
  const cards = stack ? elements(stack) : [];
  if (!cards.length || cards.some((node) => !hasClass(node, "exam-card")))
    errors.push("exam-english needs note-stack > exam-card");
  for (const card of cards) {
    const children = elements(card);
    const answer = children[1];
    if (
      children[0]?.tag !== "h3" ||
      !hasClass(answer ?? {}, "answer") ||
      !hasClass(
        elements(answer ?? { children: [] })[0] ?? {},
        "answer__label",
      ) ||
      children[2]?.tag !== "p"
    )
      errors.push(
        "exam-card needs h3, answer > answer__label, Korean explanation",
      );
  }
  const toc = descendants(root).find(
    (node) => node.tag === "nav" && hasClass(node, "toc"),
  );
  if (!template) {
    const hrefs = toc
      ? descendants(toc)
          .filter((node) => node.tag === "a")
          .map((node) => node.attrs.href)
      : [];
    if (
      !same(
        hrefs,
        expectedOrder.map((id) => "#" + id),
      )
    )
      errors.push("TOC must match all sections in reading order");
  }
  return errors;
}

export function validateHomeActions(html, lectures) {
  const { root, errors } = parseHtml(html);
  const cards = descendants(root).filter(
    (node) => node.tag === "article" && hasClass(node, "lecture-card"),
  );
  for (const lecture of lectures.filter((entry) => entry.ready)) {
    const card = cards.find((node) =>
      descendants(node).some(
        (child) => child.tag === "a" && child.attrs.href === lecture.page,
      ),
    );
    if (!card) {
      errors.push(`missing lecture card: ${lecture.page}`);
      continue;
    }
    const actions = descendants(card).filter(
      (node) => node.tag === "a" && hasClass(node, "button"),
    );
    const number = Number(lecture.slug.replace("lecture", ""));
    if (
      actions.length !== 3 ||
      actions[0]?.attrs.href !== lecture.page ||
      textOf(actions[0]).trim() !== `Lecture ${number} 읽기` ||
      !hasClass(actions[0], "button--primary")
    )
      errors.push(
        `${lecture.page}: first card action must be the primary reading link`,
      );
    for (const [offset, key] of [
      [1, "cleaned"],
      [2, "original"],
    ]) {
      if (
        !actions[offset]?.attrs.href.endsWith("/" + lecture.pdfs[key]) ||
        hasClass(actions[offset] ?? {}, "button--primary")
      )
        errors.push(
          `${lecture.page}: PDFs must follow reading as neutral actions`,
        );
    }
  }
  return errors;
}
