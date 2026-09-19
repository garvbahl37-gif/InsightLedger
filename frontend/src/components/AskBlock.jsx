import { Icon } from "../icons.jsx";
import { QUESTIONS } from "../lib/questions.js";

// The question box. It is also the empty state — there is no separate "nothing
// here yet" panel, because the thing to do next is always the same: ask.
export default function AskBlock({ q, setQ, onAsk, asking, scopedTo, onClearScope, corpusSize, showSuggestions }) {
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); }
  };
  const grow = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 230) + "px";
  };

  return (
    <>
      <div className="ask">
        <div className="ask-scope">
          {scopedTo ? (
            <>
              Reading
              <span className="scope-chip">
                {scopedTo.company || scopedTo.doc_id}
                <button onClick={onClearScope} aria-label="Search all filings instead">
                  <Icon name="x" size={12} />
                </button>
              </span>
            </>
          ) : (
            <>Reading all {corpusSize} indexed {corpusSize === 1 ? "filing" : "filings"}</>
          )}
        </div>

        <textarea
          value={q}
          rows={1}
          spellCheck={false}
          placeholder="Ask a question about these filings…"
          onChange={(e) => { setQ(e.target.value); grow(e); }}
          onKeyDown={onKey}
          aria-label="Your question"
        />

        <div className="ask-tools">
          <span className="ask-hint">Return to ask · Shift-Return for a new line</span>
          <button className="btn btn-primary" onClick={() => onAsk()} disabled={asking || !q.trim()}>
            {asking ? <span className="spin on-accent" /> : null}
            {asking ? "Reading…" : "Ask"}
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="suggest">
          {QUESTIONS.map((t) => (
            <button className="sg" key={t} onClick={() => onAsk(t)}>
              <span>{t}</span>
              <span className="go">Ask</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
