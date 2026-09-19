import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "./api.js";
import { QUESTIONS } from "./lib/questions.js";
import Rail from "./components/Rail.jsx";
import Masthead from "./components/Masthead.jsx";
import AskBlock from "./components/AskBlock.jsx";
import Answer from "./components/Answer.jsx";
import Corpus from "./components/Corpus.jsx";
import Method from "./components/Method.jsx";
import Trace from "./components/Trace.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import CompanyModal from "./components/CompanyModal.jsx";

export default function Console({ isDark, toggleTheme }) {
  const [health, setHealth] = useState({ backends: {}, indexed_pages: 0 });
  const [filings, setFilings] = useState([]);
  const [registry, setRegistry] = useState({});
  const [activeDoc, setActiveDoc] = useState(null);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [stage, setStage] = useState(0);
  const [toast, setToast] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [modalTicker, setModalTicker] = useState(null);

  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };
  const loadHealth = async () => { try { setHealth(await api.health()); } catch {} };
  const loadFilings = useCallback(async () => {
    try {
      const d = await api.documents();
      setFilings(d.documents);
      d.documents.forEach((f) => {
        api.document(f.doc_id)
          .then((doc) => setRegistry((r) => ({ ...r, [f.doc_id]: doc })))
          .catch(() => {});
      });
    } catch {}
  }, []);

  useEffect(() => { loadHealth(); loadFilings(); }, [loadFilings]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Walk the stage indicator while the graph runs, so the wait shows progress
  // rather than a spinner that could mean anything.
  useEffect(() => {
    if (!asking) { setStage(0); return; }
    const t = setInterval(() => setStage((s) => (s + 1) % 5), 420);
    return () => clearInterval(t);
  }, [asking]);

  const ask = async (question) => {
    const text = (typeof question === "string" ? question : q).trim();
    if (!text) return;
    setQ(text); setAsking(true); setAnswer(null);
    try { setAnswer(await api.query(text, activeDoc ? [activeDoc] : null)); }
    catch (e) { flash("That question could not be run: " + e.message, true); }
    finally { setAsking(false); }
  };

  const scoped = filings.find((f) => f.doc_id === activeDoc);

  return (
    <div className="shell">
      {railOpen && <button className="scrim" onClick={() => setRailOpen(false)} aria-label="Close corpus" />}
      <Rail
        open={railOpen} filings={filings} activeDoc={activeDoc} health={health}
        onScope={setActiveDoc} onPick={setModalTicker} onClose={() => setRailOpen(false)}
      />

      <div className="sheet">
        <Masthead
          filings={filings.length} pages={health.indexed_pages || 0} isDark={isDark}
          onOpenRail={() => setRailOpen(true)} onOpenPalette={() => setCmdOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <div className="sheet-body">
          <div className="opener">
            <h1>{scoped ? scoped.company || scoped.title : "Ask the filings."}</h1>
            <p>
              Every sentence below is written from pages that were retrieved, quoted and checked.
              Where a claim could not be grounded, nothing is written in its place.
            </p>
          </div>

          <AskBlock
            q={q} setQ={setQ} onAsk={ask} asking={asking} scopedTo={scoped}
            onClearScope={() => setActiveDoc(null)} corpusSize={filings.length}
            showSuggestions={!answer && !asking}
          />

          <AnimatePresence mode="wait">
            {asking ? (
              <motion.div key="run" className="running"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Trace running at={stage} />
                <div style={{ marginTop: 18, display: "grid", gap: 9 }}>
                  <div className="sk" style={{ width: "94%" }} />
                  <div className="sk" style={{ width: "78%" }} />
                  <div className="sk" style={{ width: "88%" }} />
                </div>
              </motion.div>
            ) : answer ? (
              <Answer key="ans" answer={answer} registry={registry} />
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Corpus filings={filings} onScope={setActiveDoc} />
                <Method />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette
        open={cmdOpen} onClose={() => setCmdOpen(false)} filings={filings} examples={QUESTIONS}
        onScope={setActiveDoc} onAsk={ask} onIngest={setModalTicker} onToggleTheme={toggleTheme}
      />
      <CompanyModal
        ticker={modalTicker} onClose={() => setModalTicker(null)} onScope={setActiveDoc}
        onIngested={async (r) => {
          flash(`Indexed ${r.doc_id} — ${r.pages} pages`);
          await loadHealth(); await loadFilings();
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div className={"toast" + (toast.err ? " err" : "")}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <span className="td" />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
