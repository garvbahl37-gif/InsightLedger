import {
  Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const BRAND = "#8B5CF6", PINK = "#A855F7", OK = "#22C55E", CYAN = "#6366F1", MUTED = "#71717A";

// Retrieval: MaxSim score per retrieved page (shows late-interaction ranking).
export function RetrievalChart({ retrieved }) {
  const data = (retrieved || []).slice(0, 8).map((p) => ({
    name: `${p.doc_id.split("-")[0]} p.${p.page_number}`,
    score: +p.score.toFixed(2),
  }));
  return (
    <div className="chart-box">
      <div className="ct">Retrieval — MaxSim score by page</div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: MUTED }} interval={0} angle={-18} textAnchor="end" height={40} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} />
          <Tooltip cursor={{ fill: "rgba(109,124,255,.08)" }} />
          <Bar dataKey="score" radius={[5, 5, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BRAND} fillOpacity={Math.max(0.28, 1 - i * 0.11)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Confidence gauge (radial).
export function ConfidenceGauge({ value }) {
  const pct = Math.round((value || 0) * 100);
  const data = [{ name: "c", value: pct, fill: pct >= 70 ? OK : pct >= 40 ? BRAND : "#EF4444" }];
  return (
    <div className="chart-box">
      <div className="ct">Answer confidence</div>
      <div className="gauge-wrap">
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "rgba(120,130,160,.14)" }} dataKey="value" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="gauge-center">
          <div className="gv num">{pct}%</div>
          <div className="gl">verified</div>
        </div>
      </div>
    </div>
  );
}

// Verifier donut: grounded vs. ungrounded claims.
export function VerifierDonut({ claims }) {
  const ok = (claims || []).filter((c) => c.verified).length;
  const no = (claims || []).length - ok;
  const data = [
    { name: "Grounded", value: ok, fill: OK },
    { name: "Rejected", value: no, fill: "#EF4444" },
  ].filter((d) => d.value > 0);
  const total = ok + no || 1;
  return (
    <div className="chart-box">
      <div className="ct">Verifier — claim grounding</div>
      <div className="gauge-wrap">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={data.length ? data : [{ name: "none", value: 1, fill: "rgba(120,130,160,.2)" }]}
              dataKey="value" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="none">
              {(data.length ? data : [{ fill: "rgba(120,130,160,.2)" }]).map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="gauge-center">
          <div className="gv num">{ok}/{total}</div>
          <div className="gl">grounded</div>
        </div>
      </div>
    </div>
  );
}

// Corpus overview: pages per filing (dashboard KPI companion).
export function CorpusChart({ filings }) {
  const data = (filings || []).map((f) => ({ name: f.doc_id.split("-")[0], pages: f.pages }));
  if (!data.length) return null;
  return (
    <div className="chart-box">
      <div className="ct">Corpus — pages indexed per filing</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 12, left: 4, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: MUTED }} width={52} />
          <Tooltip cursor={{ fill: "rgba(109,124,255,.08)" }} />
          <Bar dataKey="pages" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((_, i) => <Cell key={i} fill={[BRAND, "#a56bff", PINK, CYAN, OK][i % 5]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
