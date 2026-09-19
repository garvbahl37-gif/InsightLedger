const STAGES = ["router", "retriever", "extractor", "verifier", "synthesizer"];

// The agent graph as a run record, not a decorative stepper.
export default function Trace({ retries = 0, running = false, at = -1 }) {
  return (
    <div className="trace">
      {STAGES.map((s, i) => (
        <span key={s} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && <span className="sep" aria-hidden />}
          <span className={"stg " + (running ? (i === at ? "act" : i < at ? "done" : "") : "done")}>
            <span className="sn">{i + 1}</span>
            {s}
            {s === "verifier" && retries > 0 && <span className="rt">retried ×{retries}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}
