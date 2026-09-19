import { useState } from "react";
import { motion } from "framer-motion";
import { bareText, buildNotes, segment } from "../lib/footnotes.js";
import LedgerStrip from "./LedgerStrip.jsx";
import Trace from "./Trace.jsx";
import { RetrievalFigure } from "./Charts.jsx";

// The answer, set as an annotated document: claims in the text column, sources
// in the margin, tied together by footnote numbers. Hovering either end lights
// up the other, so a reader never has to hunt for what backs a sentence.
export default function Answer({ answer, registry }) {
  const [active, setActive] = useState(null);
  const { notes, numberOf } = buildNotes(answer, registry);
  const abstained = !answer.citations || answer.citations.length === 0;
  const lines = (answer.text || "").split("\n").filter((l) => l.trim());
  const claims = answer.claims || [];
  const grounded = claims.filter((c) => c.verified).length;
  const rejected = claims.filter((c) => !c.verified);
  // Each statement in the answer came from one claim — look it up so the
  // verifier's finding can sit on the sentence instead of in a second list
  // that repeats the whole answer back.
  const claimByText = new Map(claims.map((c) => [bareText(c.text), c]));

  const focusNote = (key) => {
    setActive(key);
    document.getElementById("note-" + key)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const renderLine = (line, i) => {
    const isStatement = line.trim().startsWith("-");
    const body = segment(line.replace(/^-\s*/, ""));
    const content = body.map((seg, j) => {
      if (!seg.marker) return <span key={j}>{seg.text}</span>;
      const key = `${seg.docId}#${seg.page}`;
      return (
        <button
          key={j}
          className={"fn" + (active === key ? " on" : "")}
          onMouseEnter={() => setActive(key)}
          onMouseLeave={() => setActive(null)}
          onClick={() => focusNote(key)}
          title={`${seg.docId}, page ${seg.page}`}
          aria-label={`Source ${numberOf(seg.docId, seg.page)}: ${seg.docId} page ${seg.page}`}
        >
          {numberOf(seg.docId, seg.page)}
        </button>
      );
    });
    if (!isStatement) return <p className="lede" key={i}>{content}</p>;
    const claim = claimByText.get(bareText(line));
    const state = claim ? (claim.verified ? "ok" : "no") : "none";
    return (
      <p className={"stmt " + state} key={i}>
        <span className="vmark" aria-hidden>{state === "no" ? "✕" : state === "ok" ? "✓" : ""}</span>
        {content}
        {claim && !claim.verified && <span className="vwhy">{claim.verifier_note}</span>}
      </p>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <LedgerStrip answer={answer} grounded={grounded} total={claims.length} />

      <div className="leaf">
        {/* ---- text column ---- */}
        <div>
          <div className="leaf-head">
            <h2>Answer</h2>
            <span className="meta">{answer.model_used} · {answer.difficulty} route</span>
          </div>

          {abstained ? (
            <div className="abstain">
              <b>Abstained</b>
              Nothing in the retrieved pages supports an answer to this question, so none was
              written. Try widening the scope or ingesting a filing that covers it.
            </div>
          ) : (
            <div className="prose">{lines.map(renderLine)}</div>
          )}

          {claims.length > 0 && (
            rejected.length > 0 ? (
              <div className="vsec">
                <div className="leaf-head">
                  <h2>Left out</h2>
                  <span className="meta">{rejected.length} of {claims.length} claims</span>
                </div>
                <p className="vlead">
                  These were extracted from the retrieved pages but would not ground against the
                  region they cite, so they are not part of the answer above.
                </p>
                {rejected.map((c, i) => (
                  <div className="vrow" key={i}>
                    <span className="vf no" aria-hidden>✕</span>
                    <span className="vt">{c.text}</span>
                    <span className="vc">{c.verifier_note}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="vclear">
                <span aria-hidden>✓</span>
                All {claims.length} claims grounded against the pages they cite. Nothing was discarded.
              </p>
            )
          )}

          <RetrievalFigure retrieved={answer.retrieved} />

          <div style={{ marginTop: 26 }}>
            <Trace retries={answer.retries} />
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>
              trace <span className="mono">{answer.trace_id}</span>
            </div>
          </div>
        </div>

        {/* ---- evidence margin ---- */}
        <aside className="margin">
          <div className="margin-label">
            Sources{notes.length ? ` — ${notes.length} page${notes.length > 1 ? "s" : ""}` : ""}
          </div>
          {notes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", paddingTop: 14, lineHeight: 1.6 }}>
              No page was cited, so nothing is quoted here.
            </p>
          ) : (
            <div className="notes">{notes.map((n, i) => (
              <motion.div
                key={n.key}
                id={"note-" + n.key}
                className={"note" + (active === n.key ? " on" : "")}
                onMouseEnter={() => setActive(n.key)}
                onMouseLeave={() => setActive(null)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.24 }}
              >
                <span className="nn">{n.n}</span>
                <div>
                  <div className="nsrc">
                    <span className="tk">{n.ticker}</span>
                    {n.section && <span>{n.section}</span>}
                    <span className="pg">page {n.page}</span>
                  </div>
                  {n.quotes.map((q, j) => (
                    <p className="nq" key={j}>“{q}”</p>
                  ))}
                </div>
              </motion.div>
            ))}</div>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
