import { Icon } from "../icons.jsx";

export default function Masthead({ filings, pages, onOpenRail, onOpenPalette, onToggleTheme, isDark }) {
  return (
    <header className="masthead">
      <button className="iconbtn only-narrow" onClick={onOpenRail} aria-label="Open corpus">
        <Icon name="menu" size={18} />
      </button>
      <div className="mh-corpus">
        <b>{filings}</b> {filings === 1 ? "filing" : "filings"} · <b>{pages}</b> pages
      </div>
      <span className="sp" />
      <button className="ghost" onClick={onOpenPalette}>
        <Icon name="search" size={14} /> Search <span className="kbd">⌘K</span>
      </button>
      <button className="iconbtn" onClick={onToggleTheme} aria-label="Switch theme">
        <Icon name={isDark ? "sun" : "moon"} size={17} />
      </button>
    </header>
  );
}
