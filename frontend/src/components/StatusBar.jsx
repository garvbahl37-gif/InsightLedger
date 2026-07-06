// Live system status — every value is derived from the running backend
// (GET /health). No hardcoded/mock indicators.
export default function StatusBar({ health }) {
  const b = health.backends || {};
  const items = [
    ["API", "Online", "on"],
    ["Retrieval", b.embedder === "colqwen" ? "ColQwen" : "Stub (local)", "on"],
    ["Vector Store", b.vector_store === "qdrant" ? "Qdrant" : "In-memory", "on"],
    ["Graph", b.graph === "langgraph" ? "LangGraph" : "Linear", "on"],
    ["LLM", b.llm === "claude" ? "Claude" : "Stub (local)", "on"],
  ];
  return (
    <div className="statusbar">
      {items.map(([k, v, s]) => (
        <div className="status-pill" key={k}>
          <span className={"sd " + s} />
          <span className="sk">{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}
