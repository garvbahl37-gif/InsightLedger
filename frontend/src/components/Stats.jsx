import { Icon } from "../icons.jsx";
import { useCounter } from "../lib/useCounter.js";

function Num({ value }) {
  const v = useCounter(value);
  return <>{typeof value === "number" ? Math.round(v).toLocaleString() : value}</>;
}

// All values are live — derived from /health (index size + resolved backends).
export default function Stats({ filings, pages, backends }) {
  const cards = [
    { ic: "building", label: "Companies indexed", value: filings },
    { ic: "database", label: "Pages in vector store", value: pages },
    { ic: "target", label: "Retrieval engine", value: backends.embedder || "stub" },
    { ic: "cpu", label: "Orchestration", value: backends.graph || "stub" },
  ];
  return (
    <div className="stats">
      {cards.map((c) => (
        <div className="stat" key={c.label}>
          <div className="sh"><div className="sic"><Icon name={c.ic} size={17} /></div></div>
          <div className="sv"><Num value={c.value} /></div>
          <div className="sl">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
