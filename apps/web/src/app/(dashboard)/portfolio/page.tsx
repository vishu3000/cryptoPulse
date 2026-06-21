"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CoinIcon from "@/components/CoinIcon";
import AnimatedNumber from "@/components/AnimatedNumber";
import { getPortfolio, getMarkets, addHolding, deleteHolding, type Holding, type Coin } from "@/lib/api";
import { COINS, fmt, price } from "@/lib/staticData";
import { TrendingUp, TrendingDown, Plus, Trash2, X } from "lucide-react";

type EnrichedHolding = Holding & { coin: Coin };

const BRAND_COLORS: Record<string, string> = {
  bitcoin: "#F7931A", ethereum: "#627EEA", tether: "#26A17B", bnb: "#F3BA2F",
  solana: "#9945FF", xrp: "#6B7785", "usd-coin": "#2775CA", dogecoin: "#C2A633",
  cardano: "#2A5ADA", avalanche: "#E84142", chainlink: "#2A5ADA", polkadot: "#E6007A",
};

export default function Portfolio() {
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([]);
  const [allCoins, setAllCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ coinId: "bitcoin", qty: "", avgBuyPrice: "" });

  async function load() {
    const [holdings, markets] = await Promise.all([getPortfolio(), getMarkets(50)]);
    const coinMap = new Map(markets.map((c) => [c.id, c]));
    setAllCoins(markets);
    setEnriched(holdings.map((h) => {
      const coin = coinMap.get(h.coinId) ?? {
        id: h.coinId, symbol: h.coinId.toUpperCase(), name: h.coinId,
        price: h.currentPrice ?? 0, change24h: 0, change7d: 0,
        marketCap: 0, volume24h: 0, rank: 0,
        color: BRAND_COLORS[h.coinId] ?? "#888888",
        sparkline: [], circulatingSupply: 0, maxSupply: null,
        ath: 0, athDate: "", athChange: 0, atl: 0, atlDate: "", atlChange: 0,
        high24h: 0, low24h: 0,
      };
      return { ...h, coin };
    }));
  }

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleAddHolding() {
    if (!form.qty || !form.avgBuyPrice) return;
    await addHolding(form.coinId, Number(form.qty), Number(form.avgBuyPrice)).catch(console.error);
    setForm({ coinId: "bitcoin", qty: "", avgBuyPrice: "" });
    setShowAdd(false);
    await load().catch(console.error);
  }

  async function handleDelete(id: string) {
    setEnriched((p) => p.filter((h) => h.id !== id));
    await deleteHolding(id).catch(console.error);
  }

  const totalValue = enriched.reduce((s, h) => s + (h.currentValue ?? 0), 0);
  const totalCost = enriched.reduce((s, h) => s + h.quantity * h.avgBuyPrice, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  let acc = 0;
  const segs = enriched
    .map((h) => ({ coin: h.coin, pct: totalValue > 0 ? ((h.currentValue ?? 0) / totalValue) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .map((s) => { const start = acc; acc += s.pct; return { ...s, start, end: acc }; });

  const R = 70, C = 2 * Math.PI * R;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading portfolio…</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 relative">
      <h1 className="text-2xl font-extrabold">Portfolio</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="dc-card p-6 flex flex-col justify-center">
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>Total Portfolio Value</p>
          <AnimatedNumber value={totalValue} prefix="$" className="text-4xl font-extrabold mono" flash={false} />
          <div className="flex items-center gap-2.5 mt-3">
            <span className="flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg mono"
              style={{ background: totalPnl >= 0 ? "var(--cyan-soft)" : "rgba(255,45,123,0.14)", color: totalPnl >= 0 ? "var(--cyan)" : "var(--pink)" }}>
              {totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)}
            </span>
            <span className="text-sm mono" style={{ color: totalPnl >= 0 ? "var(--cyan)" : "var(--pink)" }}>
              {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}% (all time)
            </span>
          </div>
        </div>

        <div className="dc-card p-[18px] flex items-center gap-6">
          <div className="relative shrink-0" style={{ width: 170, height: 170 }}>
            <svg viewBox="0 0 180 180" className="-rotate-90">
              {segs.map((s) => (
                <circle key={s.coin.id} cx="90" cy="90" r={R} fill="none"
                  stroke={s.coin.id === "solana" ? "#9945FF" : s.coin.color} strokeWidth="18"
                  strokeDasharray={`${(s.pct / 100) * C} ${C}`}
                  strokeDashoffset={`${-(s.start / 100) * C}`} />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs" style={{ color: "var(--muted)" }}>Assets</span>
              <span className="text-2xl font-extrabold mono">{enriched.length}</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {segs.map((s) => (
              <div key={s.coin.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.coin.id === "solana" ? "#9945FF" : s.coin.color }} />
                  <span className="text-sm font-medium truncate">{s.coin.name}</span>
                </div>
                <span className="text-sm mono" style={{ color: "var(--muted)" }}>{s.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dc-card overflow-hidden">
        <h2 className="text-base font-bold px-[18px] py-4">Holdings</h2>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 780 }}>
            <div className="grid items-center px-[18px] py-2.5 text-[11px] font-semibold tracking-wide"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.3fr 1.6fr 40px", color: "var(--muted)", borderBottom: "1px solid var(--card-border)" }}>
              <span>ASSET</span><span className="text-right">AMOUNT</span><span className="text-right">AVG BUY</span>
              <span className="text-right">PRICE</span><span className="text-right">P&amp;L</span><span>ALLOCATION</span><span />
            </div>
            {enriched.map((h) => {
              const pct = totalValue > 0 ? ((h.currentValue ?? 0) / totalValue) * 100 : 0;
              const pnl = h.pnl ?? 0;
              const pnlPct = h.pnlPct ?? 0;
              return (
                <div key={h.id} className="grid items-center px-[18px] py-3.5 transition-colors hover:bg-white/[0.02]"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1.3fr 1.6fr 40px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <Link href={`/coin/${h.coinId}`} className="flex items-center gap-2.5 min-w-0">
                    <CoinIcon coin={h.coin} size={32} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{h.coin.name}</p>
                      <p className="text-xs mono" style={{ color: "var(--muted)" }}>{h.coin.symbol}</p>
                    </div>
                  </Link>
                  <span className="text-sm mono text-right">{h.quantity.toLocaleString()}</span>
                  <span className="text-sm mono text-right" style={{ color: "var(--muted-2)" }}>{price(h.avgBuyPrice)}</span>
                  <span className="text-sm font-semibold mono text-right">{price(h.coin.price)}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold mono" style={{ color: pnl >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                      {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                    </p>
                    <p className="text-xs mono" style={{ color: pnlPct >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: h.coin.id === "solana" ? "linear-gradient(90deg,#9945FF,#14F195)" : h.coin.color }} />
                    </div>
                    <span className="text-xs mono w-9 text-right" style={{ color: "var(--muted)" }}>{Math.round(pct)}%</span>
                  </div>
                  <button onClick={() => handleDelete(h.id)} className="justify-self-center">
                    <Trash2 size={14} style={{ color: "rgba(255,45,123,0.5)" }} />
                  </button>
                </div>
              );
            })}
            {enriched.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No holdings yet — add your first transaction</p>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-7 right-7 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold z-40"
        style={{ background: "var(--cyan)", color: "#05070d", boxShadow: "0 4px 30px rgba(0,240,255,0.45)" }}>
        <Plus size={17} /> Add Transaction
      </button>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAdd(false)}>
          <div className="dc-card p-6 w-full max-w-md" style={{ background: "#0d1322" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Add Transaction</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} style={{ color: "var(--muted)" }} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>COIN</label>
                <select value={form.coinId} onChange={(e) => setForm((f) => ({ ...f, coinId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
                  {(allCoins.length ? allCoins : COINS).map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#0d1322" }}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>QUANTITY</label>
                  <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl text-sm mono outline-none placeholder:text-white/30"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted)" }}>AVG BUY ($)</label>
                  <input type="number" value={form.avgBuyPrice} onChange={(e) => setForm((f) => ({ ...f, avgBuyPrice: e.target.value }))} placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl text-sm mono outline-none placeholder:text-white/30"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }} />
                </div>
              </div>
              <button onClick={handleAddHolding} className="w-full py-3 rounded-xl text-sm font-bold mt-1"
                style={{ background: "var(--cyan)", color: "#05070d" }}>Add to Portfolio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
