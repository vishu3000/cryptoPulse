"use client";

interface Props { data: number[]; positive: boolean; width?: number; height?: number; glow?: boolean; }

export default function Sparkline({ data, positive, width = 88, height = 32, glow = false }: Props) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const color = positive ? "#00f0ff" : "#ff2d7b";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none"
      style={glow ? { filter: `drop-shadow(0 0 3px ${color}99)` } : undefined}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
