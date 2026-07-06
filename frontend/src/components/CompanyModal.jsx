import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api.js";
import { Icon } from "../icons.jsx";

// Browse any EDGAR company's filings and ingest any one of them.
const FORM_SETS = {
  Key: "10-K,10-Q,8-K,20-F",
  Annual: "10-K,20-F,40-F",
  Quarterly: "10-Q",
  Events: "8-K",
  Proxy: "DEF 14A",
  All: "",
};
const GRAD = (tk) => {
  const p = ["#8B5CF6", "#6366F1", "#A855F7", "#3b82f6", "#22C55E", "#f59e0b"];
  let h = 0; for (const c of tk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `linear-gradient(135deg,${p[h % p.length]},${p[(h >> 3) % p.length]})`;
};

export default function CompanyModal({ ticker, onClose, onIngested, onScope }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Key");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setData(null); setErr("");
    api.company(ticker, FORM_SETS[tab], 40).then(setData).catch((e) => setErr(e.message));
  }, [ticker, tab]);

  const ingest = async (f) => {
    setBusy(f.accession);
    try {
      const r = await api.ingestFiling({
        ticker, form: f.form, accession: f.accession,
        primary_doc: f.primary_doc, date: f.date,
      });
      onIngested?.(r);
      setData((d) => ({ ...d, filings: d.filings.map((x) =>
        x.accession === f.accession ? { ...x, indexed: true } : x) }));
    } catch (e) { setErr(e.message); }
    finally { setBusy(null); }
  };

  return (
    <AnimatePresence>
      {ticker && (
        <motion.div className="cmd-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div className="cmodal" initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}>
            <div className="cmodal-head">
              <span className="otk" style={{ background: GRAD(ticker), minWidth: 52 }}>{ticker}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cmodal-name">{data ? titleCase(data.name) : ticker}</div>
                <div className="cmodal-sub">
                  {data ? `${data.industry || "—"} · CIK ${data.cik}` : "Loading filings from EDGAR…"}
                </div>
              </div>
              <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
            </div>

            <div className="cmodal-tabs">
              {Object.keys(FORM_SETS).map((k) => (
                <button key={k} className={"ctab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{k}</button>
              ))}
            </div>

            <div className="cmodal-list">
              {err && <div className="picker-hint" style={{ color: "var(--error)" }}>{err}</div>}
              {!data && !err && <div className="picker-hint"><span className="spin d sm" style={{ display: "inline-block" }} /> loading…</div>}
              {data && data.filings.length === 0 && <div className="picker-hint">No {tab.toLowerCase()} filings found.</div>}
              {data && data.filings.map((f) => (
                <div className="frow" key={f.accession}>
                  <span className="fform">{f.form}</span>
                  <div className="finfo">
                    <div className="fdate">{f.date}</div>
                    {f.description && <div className="fdesc">{f.description}</div>}
                  </div>
                  {f.indexed ? (
                    <button className="frun" onClick={() => { onScope?.(f.doc_id); onClose(); }}>
                      <Icon name="spark" size={13} /> Ask
                    </button>
                  ) : busy === f.accession ? (
                    <span className="spin d sm" />
                  ) : (
                    <button className="fingest" onClick={() => ingest(f)}>
                      <Icon name="plus" size={13} /> Ingest
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="cmodal-foot">Live from SEC EDGAR · ingest any filing to query it</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }
