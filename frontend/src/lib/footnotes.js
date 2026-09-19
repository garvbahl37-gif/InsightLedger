// Turns an answer into a footnote apparatus: every [DOC p.N] token in the prose
// becomes a numbered marker, and every unique (doc, page) becomes one numbered
// note in the margin — the same convention an annotated filing uses.

const TOKEN = /\[([A-Z0-9.\-]+)\s+p\.(\d+)\]/g;

// Collapse whitespace and trim a raw region snippet to a readable quotation.
// Snippets arrive cut to a fixed length, so a quote can end mid-word; mark
// every cut with an ellipsis rather than letting it look like the source text.
export function cleanQuote(raw) {
  let s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (/^[a-z]/.test(s)) {
    const m = s.match(/[A-Z][^.]*\.?/);
    if (m && m.index > 0 && m.index < 60) s = "… " + s.slice(m.index);
  }
  if (s.length > 260) s = s.slice(0, 260).replace(/\s+\S*$/, "") + " …";
  else if (!/[.!?;:]$/.test(s)) s = s.replace(/\s+\S*$/, "") + " …";
  return s;
}

// Claim text with its citation tokens removed, for matching a claim against
// the sentence it produced.
export function bareText(line) {
  return line.replace(TOKEN, "").replace(/^-\s*/, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function buildNotes(answer, registry = {}) {
  const order = [];
  const byKey = new Map();

  const note = (docId, page) => {
    const key = `${docId}#${page}`;
    if (!byKey.has(key)) {
      const doc = registry[docId];
      const pageObj = doc?.pages?.find((p) => String(p.page_number) === String(page));
      const n = {
        key,
        n: order.length + 1,
        docId,
        ticker: docId.split("-")[0],
        company: doc?.company || "",
        section: pageObj?.section || "",
        page,
        quotes: [],
      };
      byKey.set(key, n);
      order.push(n);
    }
    return byKey.get(key);
  };

  // Number notes in the order their markers appear in the prose.
  const lines = (answer.text || "").split("\n").filter((l) => l.trim());
  lines.forEach((line) => {
    for (const m of line.matchAll(TOKEN)) note(m[1], m[2]);
  });

  // Attach the live-generated snippets to their note.
  (answer.citations || []).forEach((c) => {
    const n = note(c.doc_id, String(c.page_number));
    const q = cleanQuote(c.snippet);
    if (q && !n.quotes.includes(q)) n.quotes.push(q);
  });

  return { notes: order, numberOf: (docId, page) => byKey.get(`${docId}#${page}`)?.n };
}

// Split one prose line into text fragments and citation markers.
export function segment(line) {
  const out = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    // Trim the space before a marker so the numeral sits tight to the word.
    if (m.index > last) out.push({ text: line.slice(last, m.index).replace(/\s+$/, "") });
    out.push({ marker: true, docId: m[1], page: m[2] });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}
