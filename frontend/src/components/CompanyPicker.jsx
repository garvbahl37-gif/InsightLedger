import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api.js";
import { Icon } from "../icons.jsx";


// Combobox over the full EDGAR filer list.
export default function CompanyPicker({ onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState([]);
  const [hl, setHl] = useState(0);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try { const r = await api.tickers(q); if (alive) { setOpts(r.results || []); setHl(0); } }
      catch (e) { if (alive) setOpts([]); }
      finally { if (alive) setLoading(false); }
    }, q ? 170 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [q, open]);

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const choose = (o) => { setOpen(false); setQ(""); onSelect(o.ticker); };
  const onKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, opts.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && opts[hl]) { e.preventDefault(); choose(opts[hl]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="picker" ref={box}>
      <div className="picker-input">
        <span className="ico"><Icon name="search" size={16} /></span>
        <input value={q} placeholder="Search EDGAR…" spellCheck={false} autoComplete="off"
          onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKey} />
        {loading && <span className="spin" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="picker-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}>
            <div className="menu-label">{q ? "Matches" : "Common filers"}</div>
            {opts.length === 0 && !loading && <div className="picker-hint">No filer matches that. Try a ticker, like NVDA.</div>}
            {opts.map((o, i) => (
              <button type="button" key={o.ticker} className={"opt" + (i === hl ? " hl" : "")}
                onMouseEnter={() => setHl(i)} onClick={() => choose(o)}>
                <span className="otk">{o.ticker}</span>
                <span className="otitle">{titleCase(o.title)}</span>
                {o.indexed && <span className="obadge">indexed</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }
