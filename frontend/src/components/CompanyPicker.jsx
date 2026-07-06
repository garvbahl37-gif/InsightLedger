import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../api.js";
import { Icon } from "../icons.jsx";

const GRADS = {
  AAPL: "linear-gradient(135deg,#8B5CF6,#A855F7)", MSFT: "linear-gradient(135deg,#3b82f6,#6366F1)",
  NVDA: "linear-gradient(135deg,#22C55E,#16a34a)", TSLA: "linear-gradient(135deg,#EF4444,#f97316)",
};
function grad(tk) {
  if (GRADS[tk]) return GRADS[tk];
  const p = ["#8B5CF6", "#6366F1", "#A855F7", "#3b82f6", "#22C55E", "#f59e0b"];
  let h = 0; for (const c of tk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `linear-gradient(135deg,${p[h % p.length]},${p[(h >> 3) % p.length]})`;
}

// Premium searchable company combobox over the full EDGAR list.
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
        <input value={q} placeholder="Search SEC company…" spellCheck={false} autoComplete="off"
          onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKey} />
        {loading ? <span className="spin d sm" /> : <span className="kbd">↵</span>}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="picker-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}>
            <div className="menu-label">{q ? "Results" : "Popular companies"}</div>
            {opts.length === 0 && !loading && <div className="picker-hint">No matches — try NVDA or a company name.</div>}
            {opts.map((o, i) => (
              <div key={o.ticker} className={"opt" + (i === hl ? " hl" : "")}
                onMouseEnter={() => setHl(i)} onClick={() => choose(o)}>
                <span className="otk" style={{ background: grad(o.ticker) }}>{o.ticker}</span>
                <span className="otitle">{titleCase(o.title)}</span>
                {o.indexed ? <span className="obadge">indexed</span>
                  : <span className="ico" style={{ color: "var(--muted)" }}><Icon name="chev" size={15} /></span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function titleCase(s) { return (s || "").toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()); }
