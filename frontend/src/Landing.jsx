import { useState } from "react";
import { Icon } from "./icons.jsx";

/* The page argues for the product by being the product: the opening paragraph
   carries real footnotes, and they resolve to real text from real 10-Ks in the
   margin beside it. Quotes below are verbatim from the filings cited. */
const HERO_NOTES = [
  {
    n: 1, ticker: "AAPL", section: "Item 7", page: 36,
    quote: "Control is generally transferred when the Company has a present right to payment and title and the significant risks and rewards of ownership of products or services are transferred to its customers.",
  },
  {
    n: 2, ticker: "NVDA", section: "Item 1A", page: 12,
    quote: "The following risk factors should be considered in addition to the other information in this Annual Report on Form 10-K.",
  },
];

const STAGES = [
  ["Router", "Reads the question and decides whether it is a lookup or needs reasoning across several pages, then sizes retrieval to match. In production this is also what sends cheap questions to a cheap model."],
  ["Retriever", "Searches page images with late-interaction MaxSim rather than cosine similarity over text chunks, so a number keeps its column header and a footnote keeps the line it belongs to."],
  ["Extractor", "Reads the retrieved pages and writes down atomic claims, each pinned to the region of the page it was taken from."],
  ["Verifier", "Checks each claim against its own cited region. When confidence comes back low, the graph loops back and retrieves more — it is a cycle, not a chain."],
  ["Synthesizer", "Writes the answer out of verified claims only, footnoting each one. When nothing survives verification it writes nothing and says why."],
];

const RESULTS = [
  ["Retrieval recall@k", "0.938", "1.000"],
  ["Faithfulness", "0.000", "1.000"],
  ["Answer accuracy", "0.812", "1.000"],
  ["Citation region IoU", "0.000", "1.000"],
  ["Hallucination rate", "0.188", "0.000"],
];

export default function Landing({ isDark, toggleTheme, onEnter }) {
  const [lit, setLit] = useState(null);

  const Marker = ({ n }) => (
    <button
      className={"fn" + (lit === n ? " on" : "")}
      onMouseEnter={() => setLit(n)}
      onMouseLeave={() => setLit(null)}
      onClick={() => document.getElementById("hn-" + n)?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
      aria-label={`Source ${n}`}
    >
      {n}
    </button>
  );

  return (
    <div className="lp">
      <nav className="lp-nav">
        <a className="wordmark" href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="a">Insight</span><span className="b">Ledger</span>
        </a>
        <span className="sp" />
        <a href="#pages" className="hide-sm">Why pages</a>
        <a href="#method" className="hide-sm">Method</a>
        <a href="#results" className="hide-sm">Results</a>
        <button className="iconbtn" onClick={toggleTheme} aria-label="Switch theme">
          <Icon name={isDark ? "sun" : "moon"} size={17} />
        </button>
        <button className="btn btn-primary" onClick={onEnter}>Open the console</button>
      </nav>

      <div className="lp-wrap">
        {/* ---------- hero ---------- */}
        <header className="lp-hero">
          <div>
            <h1>Every sentence, back to the page it came from.</h1>
            <p className="dek">
              InsightLedger reads SEC filings as pages rather than as scraped text, then answers
              your question in prose where each claim carries a footnote to the exact region it was
              drawn from<Marker n={1} /> — including the risk language most summaries paraphrase
              away<Marker n={2} />. When the filings do not support an answer, it writes none.
            </p>
            <div className="lp-cta">
              <button className="btn btn-primary btn-lg" onClick={onEnter}>Open the console</button>
              <a className="btn btn-lg btn-line" href="https://github.com/garvbahl37-gif/InsightLedger"
                 target="_blank" rel="noreferrer">Read the source</a>
              <span className="cta-note">Runs locally. No API key needed.</span>
            </div>
          </div>

          <aside className="lp-margin">
            <div className="mt">Sources — as they appear in the filings</div>
            <div className="notes">{HERO_NOTES.map((h) => (
              <div key={h.n} id={"hn-" + h.n} className={"note" + (lit === h.n ? " on" : "")}
                   onMouseEnter={() => setLit(h.n)} onMouseLeave={() => setLit(null)}>
                <span className="nn">{h.n}</span>
                <div>
                  <div className="nsrc">
                    <span className="tk">{h.ticker}</span>
                    <span>{h.section}</span>
                    <span className="pg">page {h.page}</span>
                  </div>
                  <p className="nq">“{h.quote}”</p>
                </div>
              </div>
            ))}</div>
          </aside>
        </header>

        {/* ---------- the argument for pages ---------- */}
        <section className="lp-sec" id="pages">
          <h2>A filing is not a wall of text.</h2>
          <p className="sub">
            The usual pipeline flattens a document before it ever reaches the model: chunk, embed,
            match, paste. That works on prose and falls apart on the parts of a 10-K people actually
            argue about — segment tables, footnote markers, anything where meaning lives in the
            layout. Here is one table, and the same table after a text extractor is done with it.
          </p>
          <div className="lp-split">
            <div className="lp-panel">
              <div className="ph"><span>On the page</span><span className="taggood">meaning intact</span></div>
              <div className="pb">
                <table className="minitable">
                  <caption>Segment operating income — years ended</caption>
                  <thead>
                    <tr><th>Segment</th><th className="r">2026</th><th className="r">2025</th><th className="r">Change</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Data Center</td><td className="r">78,420</td><td className="r">47,525</td><td className="r">+65%</td></tr>
                    <tr><td>Gaming</td><td className="r">11,350</td><td className="r">10,447</td><td className="r">+9%</td></tr>
                    <tr><td>Professional Visualization</td><td className="r">1,916</td><td className="r">1,553</td><td className="r">+23%</td></tr>
                  </tbody>
                  <tfoot><tr><td>Total</td><td className="r">91,686</td><td className="r">59,525</td><td className="r">+54%</td></tr></tfoot>
                </table>
              </div>
            </div>
            <div className="lp-panel">
              <div className="ph"><span>After text extraction</span><span className="tagbad">columns lost</span></div>
              <div className="pb">
                <p className="flattened">
                  Segment operating income years ended Segment 2026 2025 Change Data Center{" "}
                  <mark>78,420 47,525 +65%</mark> Gaming 11,350 10,447 +9% Professional
                  Visualization 1,916 1,553 +23% Total 91,686 59,525 +54%
                </p>
                <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "14px 0 0", lineHeight: 1.6 }}>
                  Ask which segment grew fastest and a model now has to guess which number belongs to
                  which year. That guess is where a hallucination comes from.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- method ---------- */}
        <section className="lp-sec" id="method">
          <h2>Five agents, and one of them is allowed to say no.</h2>
          <p className="sub">
            A question passes through a graph that can send itself backwards. The verifier is the
            reason the system can decline: if a claim will not ground against the page it cites, it
            does not reach the answer.
          </p>
          <div className="lp-stages">
            {STAGES.map(([t, d], i) => (
              <div className="lp-stage" key={t}>
                <span className="sn">{String(i + 1).padStart(2, "0")}</span>
                <span className="st">{t}</span>
                <span className="sdesc">{d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- abstention ---------- */}
        <section className="lp-sec">
          <h2>The useful part is what it refuses to write.</h2>
          <p className="sub">
            Most retrieval systems will answer anything you ask them, because nothing in the
            pipeline is responsible for checking. Ask this one something the filings do not cover
            and you get a stated absence instead of a confident paragraph.
          </p>
          <div className="lp-abstain">
            <div className="qbubble">
              <div className="ql">Asked of a corpus of 10-Ks</div>
              What did the CEO say about the acquisition on the Q3 earnings call?
            </div>
            <div className="abstain">
              <b>Abstained</b>
              Nothing in the retrieved pages supports an answer to this question, so none was
              written. Try widening the scope or ingesting a filing that covers it.
            </div>
          </div>
        </section>

        {/* ---------- results ---------- */}
        <section className="lp-sec" id="results">
          <h2>Measured against a text-RAG baseline.</h2>
          <p className="sub">
            A 16-item golden set of lookups, cross-page reasoning, and deliberately unanswerable
            questions, run against both pipelines on the same corpus. Reproduce it with{" "}
            <span className="mono">make compare</span>.
          </p>
          <table className="lp-results">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="r">Naive text-RAG</th>
                <th className="r">InsightLedger</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map(([m, a, b]) => (
                <tr key={m}>
                  <td className="m">{m}</td>
                  <td className="r">{a}</td>
                  <td className="r win">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caveat">
            Read these honestly: they come from the deterministic local backend run over a small,
            hand-built golden set whose questions are answerable from the corpus, so the grounded
            pipeline scores near-perfectly and the baseline has no citation mechanism to score at
            all. They demonstrate that the eval harness and the grounding contract work, not that
            any system is flawless.
          </p>
        </section>

        {/* ---------- close ---------- */}
        <section className="lp-sec">
          <h2>Start with one filing.</h2>
          <p className="sub">
            Search any EDGAR filer, index a filing straight from the SEC, and ask it something. It
            runs on your machine against live filings with no key and no GPU.
          </p>
          <div className="lp-cta">
            <button className="btn btn-primary btn-lg" onClick={onEnter}>Open the console</button>
          </div>
        </section>

        <footer className="lp-foot">
          <span>InsightLedger</span>
          <span className="sp" />
          <a href="https://github.com/garvbahl37-gif/InsightLedger" target="_blank" rel="noreferrer">Source</a>
          <a href="https://www.sec.gov/edgar" target="_blank" rel="noreferrer">SEC EDGAR</a>
        </footer>
      </div>
    </div>
  );
}
