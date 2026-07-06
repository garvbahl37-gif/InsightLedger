import { motion } from "framer-motion";
import { Icon } from "../icons.jsx";

const FLOW = ["router", "retriever", "extractor", "verifier", "synthesizer"];

// Animated multi-agent pipeline stepper. When `running`, nodes light up in
// sequence; otherwise all are shown complete with the retry count on verifier.
export default function Pipeline({ retries = 0, running = false }) {
  return (
    <div className="flow">
      {FLOW.map((n, i) => (
        <div key={n} style={{ display: "flex", alignItems: "center" }}>
          <motion.span
            className={"node" + (running ? "" : " done")}
            initial={running ? { opacity: 0.4, y: 3 } : false}
            animate={running ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: running ? i * 0.4 : 0, duration: 0.3 }}
          >
            <span className="idx">{i + 1}</span>
            {n}
            {n === "verifier" && retries > 0 && <span className="retry">retry {retries}</span>}
          </motion.span>
          {i < FLOW.length - 1 && <span className="arrow"><Icon name="chev" size={13} /></span>}
        </div>
      ))}
    </div>
  );
}
