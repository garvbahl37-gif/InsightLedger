import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useThemeColors } from "../lib/useThemeColor.js";

// Which pages the retriever actually ranked, and how strongly. One figure, not
// a wall of gauges — the confidence and grounding numbers are already stated
// once in the summary band above, and repeating them would not add a fact.
export function RetrievalFigure({ retrieved }) {
  const c = useThemeColors(["accent", "ink-3", "rule"]);
  const data = (retrieved || []).slice(0, 8).map((p) => ({
    name: `${p.doc_id.split("-")[0]} p.${p.page_number}`,
    score: +p.score.toFixed(2),
  }));
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.score));
  return (
    <div className="figure">
      <div className="figcap">Pages retrieved <span>— MaxSim score, highest first</span></div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 26)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 34, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, max * 1.05]} />
          <YAxis
            type="category" dataKey="name" width={96} axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: c["ink-3"], fontFamily: "IBM Plex Mono, monospace" }}
          />
          <Tooltip cursor={{ fill: c["rule"], fillOpacity: 0.35 }} />
          <Bar dataKey="score" barSize={11} radius={[0, 2, 2, 0]} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={c["accent"]} fillOpacity={Math.max(0.3, 1 - i * 0.1)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
