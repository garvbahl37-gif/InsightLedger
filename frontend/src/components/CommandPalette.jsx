import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api.js";
import { Icon } from "../icons.jsx";

// ⌘K command palette: jump to a filing, run an example query, ingest a company,
// or toggle theme. Debounced EDGAR search feeds the "Ingest" group.
export default function CommandPalette({ open, onClose, filings, examples, onScope, onAsk, onIngest, onToggleTheme }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [hl, setHl] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQ(""); setHl(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setHits([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try { const r = await api.tickers(q); if (alive) setHits((r.results || []).filter((x) => !x.indexed).slice(0, 5)); }
      catch (e) {}
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [q, open]);

  const items = useMemo(() => {
    const ql = q.toLowerCase();
    const list = [];
    filings.filter((f) => !ql || (f.company || "").toLowerCase().includes(ql) || f.doc_id.toLowerCase().includes(ql))
      .forEach((f) => list.push({ group: "Filings", icon: "doc", label: f.company || f.doc_id,
        meta: f.doc_id.split("-")[0], action: () => onScope(f.doc_id) }));
    examples.filter((e) => !ql || e.toLowerCase().includes(ql))
      .forEach((e) => list.push({ group: "Ask", icon: "spark", label: e, meta: "ask", action: () => onAsk(e) }));
    hits.forEach((h) => list.push({ group: "Index from EDGAR", icon: "plus", label: `${titleCase(h.title)}`,
      meta: h.ticker, action: () => onIngest(h.ticker) }));
    list.push({ group: "View", icon: "moon", label: "Switch theme", meta: "", action: onToggleTheme });
    return list;
  }, [q, filings, examples, hits]); // eslint-disable-line

  useEffect(() => { setHl(0); }, [q]);

  const run = (it) => { onClose(); it.action(); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && items[hl]) { e.preventDefault(); run(items[hl]); }
    else if (e.key === "Escape") onClose();
  };

  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div className="panel" initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}>
            <div className="panel-search">
              <Icon name="search" size={17} />
              <input ref={inputRef} value={q} placeholder="Find a filing, ask a question, or index a company…"
                onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
              <span className="kbd">ESC</span>
            </div>
            <div className="panel-list">
              {items.length === 0 && <div className="picker-hint">Nothing matches that.</div>}
              {items.map((it, i) => {
                const showGroup = it.group !== lastGroup; lastGroup = it.group;
                return (
                  <div key={i}>
                    {showGroup && <div className="panel-sec">{it.group}</div>}
                    <button type="button" className={"panel-item" + (i === hl ? " hl" : "")}
                      onMouseEnter={() => setHl(i)} onClick={() => run(it)}>
                      <span className="pi"><Icon name={it.icon} size={16} /></span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                      {it.meta && <span className="pmeta">{it.meta}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }
