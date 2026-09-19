// A summary band in the manner of a financial statement header: one ruled row,
// tabular figures, each value stated exactly once in the whole page.
export default function LedgerStrip({ answer, grounded, total }) {
  const pct = Math.round((answer.confidence || 0) * 100);
  const cells = [
    ["Route", <span className="v" key="v" style={{ textTransform: "capitalize" }}>{answer.difficulty}</span>],
    ["Confidence", <span className={"v " + (pct >= 70 ? "ok" : "warn")} key="v">{pct}<span className="u">%</span></span>],
    ["Claims grounded", <span className="v" key="v">{grounded}<span className="u">/{total}</span></span>],
    ["Latency", <span className="v" key="v">{answer.latency_ms.toFixed(0)}<span className="u">ms</span></span>],
    ["Cost", <span className="v" key="v">${answer.cost_usd.toFixed(4)}</span>],
  ];
  return (
    <div className="strip">
      {cells.map(([k, v]) => (
        <div className="cell" key={k}>
          <div className="k">{k}</div>
          {v}
        </div>
      ))}
    </div>
  );
}
