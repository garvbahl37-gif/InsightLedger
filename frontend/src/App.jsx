import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "./api.js";
import { Icon } from "./icons.jsx";
import CompanyPicker from "./components/CompanyPicker.jsx";
import CompanyModal from "./components/CompanyModal.jsx";
import CompanyCard from "./components/CompanyCard.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import Hero from "./components/Hero.jsx";
import Stats from "./components/Stats.jsx";
import Console, { EXAMPLES } from "./components/Console.jsx";
import { CorpusChart } from "./components/Charts.jsx";
import Pipeline from "./components/Pipeline.jsx";
import Result from "./components/Result.jsx";
import Theory from "./components/Theory.jsx";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("il-theme") || "");
  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }, [theme]);
  const isDark = theme ? theme !== "light" : true;
  return { isDark, toggle: () => setTheme(isDark ? "light" : "dark") };
}

export default function App() {
  const { isDark, toggle } = useTheme();
  const [health, setHealth] = useState({ backends: {}, indexed_pages: 0 });
  const [filings, setFilings] = useState([]);
  const [registry, setRegistry] = useState({});
  const [activeDoc, setActiveDoc] = useState(null);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState(null);
  const [searches, setSearches] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth > 1000);
  const [modalTicker, setModalTicker] = useState(null);

  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2800); };
  const loadHealth = async () => { try { setHealth(await api.health()); } catch (e) {} };
  const loadFilings = useCallback(async () => {
    try {
      const d = await api.documents();
      setFilings(d.documents);
      d.documents.forEach((f) => {
        api.document(f.doc_id)
          .then((doc) => setRegistry((rr) => ({ ...rr, [f.doc_id]: doc })))
          .catch(() => {});
      });
    } catch (e) {}
  }, []);

  useEffect(() => { loadHealth(); loadFilings(); }, [loadFilings]);

  // ⌘K / Ctrl-K command palette
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const ask = async (question) => {
    const text = (typeof question === "string" ? question : q).trim();
    if (!text) return;
    setQ(text); setAsking(true); setAnswer(null); setSearches((s) => s + 1);
    try { setAnswer(await api.query(text, activeDoc ? [activeDoc] : null)); }
    catch (e) { flash("Query failed: " + e.message, true); }
    finally { setAsking(false); }
  };

  const activeCo = filings.find((f) => f.doc_id === activeDoc);

  return (
    <div className={"app" + (sideOpen ? "" : " collapsed")}>
      {/* ===== sidebar ===== */}
      <aside className="side">
        <div className="brand">
          <div className="mark">IL</div>
          <div><div className="nm">InsightLedger</div><div className="sb">Enterprise AI Research</div></div>
        </div>
        <div className="side-scroll">
          <div className="sec-t"><span>Add a company</span></div>
          <CompanyPicker onSelect={setModalTicker} />
          <div style={{ fontSize: 11, color: "var(--muted)", margin: "8px 4px 6px", lineHeight: 1.5 }}>
            Search any of ~1M EDGAR filers (companies, funds, trusts), browse filings, and ingest any live.
          </div>

          <div className="sec-t"><span>Filings</span><span className="c">{filings.length}</span></div>
          {filings.length === 0 && (
            <div className="side-empty"><div className="sic"><Icon name="building" size={19} /></div>
              No filings yet. Search a company above to ingest one live.</div>
          )}
          <AnimatePresence>
            {filings.map((f) => (
              <CompanyCard key={f.doc_id} filing={f} active={activeDoc === f.doc_id}
                onClick={() => setActiveDoc(activeDoc === f.doc_id ? null : f.doc_id)} />
            ))}
          </AnimatePresence>
        </div>
        <div className="side-foot"><span className="live-dot" />
          <span>{health.indexed_pages} pages · graph: {health.backends.graph || "…"}</span></div>
      </aside>

      {/* ===== main ===== */}
      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            <button className="icon-btn" onClick={() => setSideOpen((o) => !o)}
              title={sideOpen ? "Collapse sidebar" : "Expand sidebar"}>
              <Icon name={sideOpen ? "panel-close" : "panel-open"} size={17} />
            </button>
            <div><h2>Document Intelligence</h2>
              <div className="sub">Live SEC EDGAR · grounded · cited · verified</div></div>
          </div>
          <div className="tb-right">
            <button className="chipbtn" onClick={() => setCmdOpen(true)}>
              <Icon name="command" size={14} /> Search <span className="kbd">⌘K</span>
            </button>
            <button className="icon-btn" onClick={toggle} title="Toggle theme">
              <Icon name={isDark ? "sun" : "moon"} size={17} />
            </button>
          </div>
        </div>

        <div className="content">
          <Hero filings={filings.length} pages={health.indexed_pages || 0} searches={searches} />
          <Stats filings={filings.length} pages={health.indexed_pages || 0} backends={health.backends || {}} />

          <Console q={q} setQ={setQ} onAsk={ask} asking={asking} activeCo={activeCo}
            onClearScope={() => setActiveDoc(null)} sources={filings.length}
            llm={(health.backends || {}).llm} />

          <AnimatePresence mode="wait">
            {asking ? (
              <motion.div key="load" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Pipeline running />
                <div style={{ marginTop: 18 }}>
                  <div className="skel" style={{ width: "92%" }} />
                  <div className="skel" style={{ width: "80%", marginTop: 10 }} />
                  <div className="skel" style={{ width: "86%", marginTop: 10 }} />
                </div>
                <div style={{ marginTop: 16, color: "var(--muted)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 9 }}>
                  <span className="spin d" /> running the agent graph…
                </div>
              </motion.div>
            ) : answer ? (
              <Result key="res" answer={answer} registry={registry} />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="card"><div className="empty">
                  <div className="eic"><Icon name="search" size={26} /></div>
                  <h4>Ask anything about the filings</h4>
                  <p>Retrieval runs over document pages, a verifier grounds every claim to a page
                    region, and the system abstains when the answer isn't in the source.</p>
                </div></div>
                {filings.length > 0 && (
                  <div className="card"><h3><span className="lead"><Icon name="chart" size={14} /> Corpus overview</span></h3>
                    <CorpusChart filings={filings} /></div>
                )}
                <Theory />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} filings={filings} examples={EXAMPLES}
        onScope={setActiveDoc} onAsk={ask} onIngest={setModalTicker} onToggleTheme={toggle} />

      <CompanyModal ticker={modalTicker} onClose={() => setModalTicker(null)}
        onScope={setActiveDoc}
        onIngested={async (r) => { flash(`Ingested ${r.doc_id} · ${r.pages} pages`);
          await loadHealth(); await loadFilings(); }} />

      <AnimatePresence>
        {toast && (
          <motion.div className={"toast" + (toast.err ? " err" : "")}
            initial={{ opacity: 0, y: 12, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 12, x: "-50%" }}
            style={{ left: "50%" }}>
            <span className="td" />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
