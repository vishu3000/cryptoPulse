"use client";
import { useState } from "react";

const FRAMES = ["1H", "24H", "7D", "1M", "1Y"];

export default function TimeframeTabs({ initial = "7D", onChange }: { initial?: string; onChange?: (f: string) => void }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }}>
      {FRAMES.map((f) => {
        const on = f === active;
        return (
          <button key={f} onClick={() => { setActive(f); onChange?.(f); }}
            className="px-3 py-1 rounded-lg text-xs font-semibold mono transition-all"
            style={{ color: on ? "var(--cyan)" : "var(--muted)", background: on ? "var(--cyan-soft)" : "transparent" }}>
            {f}
          </button>
        );
      })}
    </div>
  );
}
