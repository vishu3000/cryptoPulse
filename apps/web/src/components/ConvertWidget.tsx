"use client";
import { useState } from "react";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import { type Coin } from "@/lib/staticData";

// Frankfurter-style fiat rates (static for now)
const FIAT: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5 };

export default function ConvertWidget({ coin }: { coin: Coin }) {
  const [amount, setAmount] = useState("1.00");
  const [fiat, setFiat] = useState("USD");
  const [flipped, setFlipped] = useState(false);

  const rate = coin.price * FIAT[fiat];
  const qty = parseFloat(amount) || 0;
  const received = flipped ? qty / rate : qty * rate;
  const recvDecimals = flipped ? 6 : 2;

  return (
    <div className="dc-card p-[18px]">
      <h3 className="text-base font-bold mb-4">Convert</h3>

      {/* You pay */}
      <div className="rounded-xl p-3 mb-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
        <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>You pay</p>
        <div className="flex items-center justify-between gap-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
            className="bg-transparent outline-none text-2xl font-bold mono w-full min-w-0" />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
            <div className="w-4 h-4 rounded-full" style={{ background: flipped ? "#22c55e" : coin.color }} />
            <span className="text-sm font-semibold mono">{flipped ? fiat : coin.symbol}</span>
            <ChevronDown size={13} style={{ color: "var(--muted)" }} />
          </div>
        </div>
      </div>

      {/* Swap */}
      <div className="flex justify-center -my-2.5 relative z-10">
        <button onClick={() => setFlipped((f) => !f)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:rotate-180"
          style={{ background: "var(--bg)", border: "1px solid var(--card-border)" }}>
          <ArrowDownUp size={14} style={{ color: "var(--cyan)" }} />
        </button>
      </div>

      {/* You receive */}
      <div className="rounded-xl p-3 mt-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--card-border)" }}>
        <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>You receive</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-bold mono truncate" style={{ color: "var(--cyan)" }}>
            {received.toLocaleString("en-US", { minimumFractionDigits: recvDecimals, maximumFractionDigits: recvDecimals })}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
            <div className="w-4 h-4 rounded-full" style={{ background: flipped ? coin.color : "#22c55e" }} />
            <select value={fiat} onChange={(e) => setFiat(e.target.value)}
              className="bg-transparent outline-none text-sm font-semibold mono appearance-none cursor-pointer"
              style={{ display: flipped ? "none" : "block" }}>
              {Object.keys(FIAT).map((f) => <option key={f} value={f} style={{ background: "#0a0e1a" }}>{f}</option>)}
            </select>
            {flipped && <span className="text-sm font-semibold mono">{coin.symbol}</span>}
            <ChevronDown size={13} style={{ color: "var(--muted)" }} />
          </div>
        </div>
      </div>

      <p className="text-xs mono text-center mt-3" style={{ color: "var(--muted)" }}>
        1 {coin.symbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 2 })} {fiat}
      </p>
    </div>
  );
}
