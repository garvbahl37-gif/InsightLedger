import { useCounter } from "../lib/useCounter.js";

function Counter({ value, suffix = "" }) {
  const v = useCounter(value);
  return <span className="num">{Math.round(v).toLocaleString()}{suffix}</span>;
}

export default function Hero({ filings, pages, searches }) {
  const cards = [
    ["Documents indexed", pages],
    ["Companies", filings],
    ["AI searches today", searches],
  ];
  return (
    <div className="hero">
      <div>
        <div className="htitle">Research Console</div>
        <div className="hsub">Grounded SEC intelligence powered by a multi-agent
          visual-RAG engine — every answer cited to a source page, every claim verified.</div>
      </div>
      <div className="hero-cards">
        {cards.map(([l, v]) => (
          <div className="hcard" key={l}>
            <div className="hv"><Counter value={v} /></div>
            <div className="hl">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
