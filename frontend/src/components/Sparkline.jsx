// Tiny inline SVG sparkline with a soft gradient fill — decorative, brand-toned.
export default function Sparkline({ data, id, color = "#8B5CF6", height = 34 }) {
  const w = 120, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((d - min) / span) * (h - 8),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}
