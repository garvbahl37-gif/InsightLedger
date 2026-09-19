import CompanyPicker from "./CompanyPicker.jsx";

// The corpus, kept at the edge of the page like the exhibit list on a filing.
export default function Rail({ open, filings, activeDoc, onScope, onPick, health, onClose }) {
  return (
    <aside className={"rail" + (open ? " open" : "")} aria-label="Corpus">
      <div className="rail-head">
        <a className="wordmark" href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="a">Insight</span><span className="b">Ledger</span>
        </a>
        <div className="rail-sub">Grounded reading of SEC filings</div>
      </div>

      <div className="rail-body">
        <div className="label">Add a filing</div>
        <CompanyPicker onSelect={onPick} />
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.55 }}>
          Search any EDGAR filer, then pick which filing to index.
        </div>

        <div className="label">
          Indexed <span className="n">{filings.length}</span>
        </div>

        {filings.length === 0 ? (
          <div className="rail-empty">Nothing indexed yet. Search a company above to pull a filing straight from EDGAR.</div>
        ) : (
          filings.map((f) => (
            <button
              key={f.doc_id}
              className={"exhibit" + (activeDoc === f.doc_id ? " on" : "")}
              onClick={() => { onScope(activeDoc === f.doc_id ? null : f.doc_id); onClose?.(); }}
              aria-pressed={activeDoc === f.doc_id}
            >
              <span className="e1">
                <span className="tk">{f.doc_id.split("-")[0]}</span>
                <span className="nm">{f.company || f.title}</span>
              </span>
              <span className="e2">{f.doc_type} · {f.date} · {f.pages} pages</span>
            </button>
          ))
        )}
      </div>

      <div className="rail-foot">
        {health.indexed_pages} pages indexed · {(health.backends || {}).graph || "…"}
      </div>
    </aside>
  );
}
