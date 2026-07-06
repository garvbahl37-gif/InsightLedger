import { motion } from "framer-motion";
import { Icon } from "../icons.jsx";
import Pipeline from "./Pipeline.jsx";
import { ConfidenceGauge, RetrievalChart, VerifierDonut } from "./Charts.jsx";

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Turn a raw citation snippet into a clean, readable quote: collapse
// whitespace, drop a leading mid-sentence fragment, trim to a sentence-ish
// length, and add ellipses where it was cut.
function cleanSnippet(raw) {
  let s = (raw || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  // if it starts mid-sentence (lowercase), begin at the first real sentence
  if (/^[a-z]/.test(s)) {
    const m = s.match(/[A-Z][^.]*\.?/);
    if (m && m.index > 0 && m.index < 60) s = "… " + s.slice(m.index);
  }
  if (s.length > 300) s = s.slice(0, 300).replace(/\s+\S*$/, "") + " …";
  return s;
}

function Answer({ text }) {
  // render "- bullet [DOC p.N]" lines with compact, inline citation chips
  const parts = text.split("\n").filter((l) => l.trim());
  const chip = (s) =>
    s.split(/(\[[^\]]+?\sp\.\d+\])/g).map((seg, i) => {
      const m = /^\[(.+?)\sp\.(\d+)\]$/.exec(seg);
      if (m) {
        const ticker = m[1].split("-")[0];
        return (
          <span className="cite" key={i} title={`${m[1]} · page ${m[2]}`}>
            {ticker} · p.{m[2]}
          </span>
        );
      }
      return <span key={i}>{seg}</span>;
    });
  return (
    <div className="answer">
      {parts.map((l, i) =>
        l.trim().startsWith("-") ? (
          <div className="abullet" key={i}>
            <span className="dot" />
            <div className="atext">{chip(l.replace(/^-\s*/, ""))}</div>
          </div>
        ) : (
          <div className="atext" key={i} style={{ margin: "6px 0" }}>{chip(l)}</div>
        )
      )}
    </div>
  );
}

export default function Result({ answer, registry }) {
  const a = answer;
  const abstained = !a.citations || a.citations.length === 0;

  // Group the *live-generated* cited snippets by page (from the query
  // response) — not the pre-fetched full page text.
  const groups = [];
  const gmap = {};
  (a.citations || []).forEach((c) => {
    const key = c.doc_id + "||" + c.page_number;
    if (!gmap[key]) {
      const po = registry[c.doc_id]?.pages?.find((p) => p.page_number == c.page_number);
      gmap[key] = { key, doc: c.doc_id, page: c.page_number, section: po?.section || "", snips: [] };
      groups.push(gmap[key]);
    }
    const s = cleanSnippet(c.snippet);
    if (s && !gmap[key].snips.includes(s)) gmap[key].snips.push(s);
  });
  const nOk = (a.claims || []).filter((c) => c.verified).length;

  const metrics = [
    ["Route", <span style={{ textTransform: "capitalize" }}>{a.difficulty}</span>],
    ["Confidence", <span className="num">{(a.confidence * 100).toFixed(0)}<small>%</small></span>],
    ["Latency", <span className="num">{a.latency_ms.toFixed(0)}<small> ms</small></span>],
    ["Cost", <span className="num">${a.cost_usd.toFixed(4)}</span>],
  ];

  return (
    <motion.div {...fade}>
      <div className="metrics">
        {metrics.map(([k, v]) => (
          <div className="metric" key={k}><div className="k">{k}</div><div className="v">{v}</div></div>
        ))}
      </div>

      <div className="rtwo">
        <div>
          <div className="card">
            <Pipeline retries={a.retries} />
            <h3 style={{ marginTop: 15 }}>Answer <span className="r">model · {a.model_used}</span></h3>
            {abstained ? (
              <div className="abstain"><Icon name="warn" size={18} />
                <div>No grounded evidence was found in the retrieved pages — the system declined to
                  answer rather than fabricate.</div></div>
            ) : <Answer text={a.text} />}
          </div>

          <div className="card">
            <h3><span className="lead"><Icon name="quote" size={14} /> Evidence</span>
              <span className="r">{groups.length} source page(s)</span></h3>
            {abstained ? (
              <div className="empty" style={{ padding: 24 }}><p>Nothing cited — no fabricated answer.</p></div>
            ) : groups.map((g) => (
              <div className="ev-page" key={g.key}>
                <div className="ev-head">
                  <span className="d">{g.doc.split("-")[0]}</span>
                  {g.section && <span className="sec">{g.section}</span>}
                  <span className="pg">page {g.page}</span>
                </div>
                <div className="ev-body">
                  {g.snips.map((s, i) => (
                    <div className="region hit" key={i}><span className="pin">cited</span>{s}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Signals</h3>
            <div className="chart-grid">
              <ConfidenceGauge value={a.confidence} />
              <VerifierDonut claims={a.claims} />
            </div>
            <div style={{ marginTop: 14 }}><RetrievalChart retrieved={a.retrieved} /></div>
          </div>

          <div className="card">
            <h3>Verifier <span className="r">{nOk}/{(a.claims || []).length} grounded</span></h3>
            {(a.claims || []).length ? (a.claims || []).map((c, i) => (
              <div className="claim" key={i}>
                <span className={"vflag " + (c.verified ? "ok" : "no")}>
                  <Icon name={c.verified ? "check" : "x"} size={13} />
                </span>
                <div>
                  <div className="ct">{c.text}</div>
                  <div className="cn num">{c.confidence.toFixed(2)} · {c.verifier_note}</div>
                </div>
              </div>
            )) : <div className="cn" style={{ color: "var(--muted)" }}>no claims extracted</div>}
            <div className="cn" style={{ marginTop: 11 }}>trace <span className="mono">{a.trace_id}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
