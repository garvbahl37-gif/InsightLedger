import { motion } from "framer-motion";
import { Icon } from "../icons.jsx";

// Ticker -> gradient (Linear-label style). Deterministic hash for unknowns.
const GRADS = {
  AAPL: "linear-gradient(135deg,#8B5CF6,#A855F7)",
  MSFT: "linear-gradient(135deg,#3b82f6,#6366F1)",
  NVDA: "linear-gradient(135deg,#22C55E,#16a34a)",
  TSLA: "linear-gradient(135deg,#EF4444,#f97316)",
  GOOGL: "linear-gradient(135deg,#f59e0b,#ef4444)",
  AMZN: "linear-gradient(135deg,#f59e0b,#eab308)",
  META: "linear-gradient(135deg,#3b82f6,#8B5CF6)",
};
function grad(tk) {
  if (GRADS[tk]) return GRADS[tk];
  const palette = ["#8B5CF6", "#6366F1", "#A855F7", "#3b82f6", "#22C55E", "#f59e0b", "#ef4444"];
  let h = 0; for (const c of tk) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `linear-gradient(135deg,${palette[h % palette.length]},${palette[(h >> 3) % palette.length]})`;
}

export default function CompanyCard({ filing, active, onClick }) {
  const tk = filing.doc_id.split("-")[0];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={"ccard" + (active ? " active" : "")}
      onClick={onClick}
    >
      <div className="c1">
        <span className="ctk" style={{ background: grad(tk) }}>{tk}</span>
        <span className="cname">{filing.company || filing.title}</span>
        <span className="cchev"><Icon name="chev" size={16} /></span>
      </div>
      <div className="c2">
        <span className="st"><span className="d" /> Indexed</span>
        <span><b>{filing.doc_type}</b></span>
        <span>{filing.date}</span>
        <span><b>{filing.pages}</b> pages</span>
      </div>
    </motion.button>
  );
}
