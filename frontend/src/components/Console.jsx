import { Icon } from "../icons.jsx";

const EXAMPLES = [
  "What are the company's most significant risk factors?",
  "How does the company describe supply chain and manufacturing concentration?",
  "What does management say about competition and pricing pressure?",
  "Summarize the company's approach to cybersecurity risk.",
  "What legal proceedings or regulatory investigations are disclosed?",
];

export default function Console({ q, setQ, onAsk, asking, activeCo, onClearScope, sources, llm }) {
  const model = llm === "claude" ? "Claude Opus" : "Local stub";
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); } };
  const grow = (e) => { const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 220) + "px"; };
  return (
    <div className="console">
      <div className="console-head">
        <div>
          <div className="ch-t">Research Console</div>
          <div className="ch-s">Ask grounded questions across your indexed SEC filings.</div>
        </div>
        <div className="model-badge"><span className="mb-dot" /> Model <b>{model}</b></div>
      </div>

      <div className="filterbar">
        <Icon name="search" size={14} />
        {activeCo ? (
          <>Scoped to <span className="fchip">{activeCo.company}
            <button onClick={onClearScope}><Icon name="x" size={12} /></button></span></>
        ) : `Searching across all ${sources} indexed filings`}
      </div>

      <div className="promptbox">
        <textarea value={q} rows={1} placeholder="Ask anything about the filings…  e.g. What risks does management highlight?"
          onChange={(e) => { setQ(e.target.value); grow(e); }} onKeyDown={onKey} />
        <div className="prompt-tools">
          <div className="tool-set">
            <span className="tchip"><Icon name="filter" size={13} /> {activeCo ? activeCo.doc_id.split("-")[0] : "All companies"}</span>
            <span className="tchip"><Icon name="calendar" size={13} /> Latest 10-K</span>
            <span className="tchip"><Icon name="layers" size={13} /> Visual-RAG</span>
          </div>
          <button className="btn btn-primary" onClick={onAsk} disabled={asking}>
            {asking ? <span className="spin" /> : <Icon name="spark" size={15} />} Run Research
          </button>
        </div>
      </div>

      <div className="examples">
        {EXAMPLES.map((t) => (
          <button className="ex" key={t} onClick={() => onAsk(t)}>{t}</button>
        ))}
      </div>
    </div>
  );
}
export { EXAMPLES };
