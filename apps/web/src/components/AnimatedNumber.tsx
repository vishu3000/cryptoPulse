"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
  flash?: boolean;
}

// Counts up to the target value; optionally flashes cyan/pink on change.
export default function AnimatedNumber({ value, prefix = "", decimals = 2, className, flash = true }: Props) {
  const [display, setDisplay] = useState(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const prev = useRef(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    setDir(to > from ? "up" : "down");
    const start = performance.now();
    const dur = 600;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else { prev.current = to; setTimeout(() => setDir(null), 200); }
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  const flashClass = flash && dir === "up" ? "flash-up" : flash && dir === "down" ? "flash-down" : "";
  return (
    <span className={`${className ?? ""} ${flashClass} rounded-md transition-colors`}>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
