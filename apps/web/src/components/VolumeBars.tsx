"use client";

// Cyan/pink alternating volume histogram from the imported design.
export default function VolumeBars({ count = 56, height = 60, seed = 7 }: { count?: number; height?: number; seed?: number }) {
  // deterministic pseudo-random so SSR and client match
  const bars = Array.from({ length: count }, (_, i) => {
    const r = Math.abs(Math.sin((i + 1) * seed * 12.9898) * 43758.5453) % 1;
    const up = Math.abs(Math.sin((i + 1) * seed * 3.233) * 1000) % 1 > 0.45;
    return { h: 0.25 + r * 0.75, up };
  });
  return (
    <div className="flex items-end gap-[3px] w-full" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{
          height: `${b.h * 100}%`,
          background: b.up ? "rgba(0,240,255,0.55)" : "rgba(255,45,123,0.55)",
        }} />
      ))}
    </div>
  );
}
