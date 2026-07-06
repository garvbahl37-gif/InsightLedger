import { Icon } from "../icons.jsx";

const STEPS = [
  ["Router", "Classifies the question as a simple lookup or complex cross-page reasoning, and sizes retrieval accordingly. In production this also routes to a cheap vs. strong LLM."],
  ["Retriever", "Late-interaction (ColPali/ColQwen-style) MaxSim search over document pages — score = Σ maxⱼ ⟨qᵢ, dⱼ⟩ — so tables, charts and layout survive instead of being flattened to lossy text."],
  ["Extractor", "A VLM reads the retrieved pages and emits atomic factual claims, each tied to a specific page region (from layout detection)."],
  ["Verifier", "Every claim is checked against its cited region. If overall confidence is low, the graph loops back and widens retrieval — a real self-correction cycle, not a linear chain."],
  ["Synthesizer", "Composes the final answer from verified claims only, with inline [doc p.N] citations — or abstains when nothing is grounded."],
];

const METRICS = [
  ["Route", "How the router classified the question (simple / complex)."],
  ["Confidence", "Best grounding confidence across verified claims."],
  ["Latency", "End-to-end wall-clock for the full agent graph."],
  ["Cost", "Token cost for this query (0 on the local stub backend)."],
];

export default function Theory() {
  return (
    <>
      <div className="card">
        <h3><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="book" size={14} /> How it works</span>
          <span className="r">visual-RAG · multi-agent</span></h3>
        <p style={{ margin: "0 0 14px", color: "var(--txt2)", fontSize: 13.5, lineHeight: 1.6 }}>
          InsightLedger retrieves over the <b>document page</b> rather than a flattened text
          extraction, then a graph of agents turns retrieved pages into a grounded, cited answer —
          or a principled abstention. Each stage is inspectable and every claim is verified.
        </p>
        <div className="theory-grid">
          {STEPS.map(([t, d], i) => (
            <div className="tstep" key={t}>
              <div className="th"><span className="tn">{i + 1}</span>{t}</div>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="shield" size={14} /> Reading the metrics</span></h3>
        <div className="theory-grid">
          {METRICS.map(([t, d]) => (
            <div className="tstep" key={t}>
              <div className="th" style={{ fontSize: 12.5 }}>{t}</div>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="tags">
          {["Visual Document Retrieval", "Document QA", "Image-Text-to-Text", "Layout detection",
            "LangGraph", "Region-grounded citations", "Eval-gated"].map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </>
  );
}
