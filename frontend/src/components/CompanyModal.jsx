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
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div className="panel panel-wide" initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}>
            <div className="panel-head">
              <span className="ptk">{ticker}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pname">{data ? titleCase(data.name) : ticker}</div>
                <div className="psub">
                  {data ? `${data.industry || "—"} · CIK ${data.cik}` : "Loading filings from EDGAR…"}
                </div>
              </div>
              <button className="iconbtn" onClick={onClose}><Icon name="x" size={16} /></button>
            </div>

            <div className="tabs">
              {Object.keys(FORM_SETS).map((k) => (
                <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{k}</button>
              ))}
            </div>

            <div className="filing-list">
              {err && <div className="picker-hint" style={{ color: "var(--flag)" }}>{err}</div>}
              {!data && !err && <div className="picker-hint">Loading…</div>}
              {data && data.filings.length === 0 && <div className="picker-hint">No {tab.toLowerCase()} filings on file.</div>}
              {data && data.filings.map((f) => (
                <div className="filing" key={f.accession}>
                  <span className="ff">{f.form}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="fd num">{f.date}</div>
                    {f.description && f.description !== f.form && (
                      <div className="fx">{f.description}</div>
                    )}
                  </div>
                  {f.indexed ? (
                    <button className="fbtn" onClick={() => { onScope?.(f.doc_id); onClose(); }}>Ask this</button>
                  ) : busy === f.accession ? (
                    <span className="spin" />
                  ) : (
                    <button className="fbtn" onClick={() => ingest(f)}>Index</button>
                  )}
                </div>
              ))}
            </div>
            <div className="panel-foot">Filings come straight from SEC EDGAR. Index one to start asking about it.</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }
