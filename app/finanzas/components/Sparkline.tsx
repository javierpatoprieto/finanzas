type Props = {
  points: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  points,
  stroke = "var(--green)",
  fill = "rgba(34,215,138,0.18)",
  width = 120,
  height = 36,
}: Props) {
  if (points.length < 2) return null;
  const pad = 2;
  let min = Math.min(...points);
  let max = Math.max(...points);
  if (min === max) { min -= 1; max += 1; }
  const w = width - pad * 2;
  const h = height - pad * 2;
  const x = (i: number) => pad + (i / (points.length - 1)) * w;
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * h;
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L ${x(points.length - 1).toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={area} fill={fill} stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={2.2} fill={stroke} />
    </svg>
  );
}
