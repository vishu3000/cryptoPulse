"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import AreaChart from "@/components/AreaChart";
import Sparkline from "@/components/Sparkline";
import CoinIcon from "@/components/CoinIcon";
import TimeframeTabs from "@/components/TimeframeTabs";
import AnimatedNumber from "@/components/AnimatedNumber";
import { getMarkets, getGlobal, getWatchlist, getAlerts, updateAlert, type Coin, type Alert, type MarketStats } from "@/lib/api";
import { fmt, price } from "@/lib/staticData";
import { usePriceStream } from "@/hooks/usePriceStream";
import { usePolling } from "@/hooks/usePolling";
import { TrendingUp, TrendingDown, Star, Plus, ArrowUpRight } from "lucide-react";

const KPISPARK: Record<string, number[]> = {
  "Global Market Cap": [2.31, 2.33, 2.36, 2.34, 2.38, 2.4, 2.39, 2.41],
  "24h Volume":        [104, 101, 99, 102, 100, 98, 99, 98.6],
  "BTC Dominance":     [53.6, 53.8, 53.9, 54.0, 54.1, 54.0, 54.2, 54.2],
  "Fear & Greed":      [60, 62, 64, 66, 68, 70, 71, 72],
};

export default function Dashboard() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [watchCoins, setWatchCoins] = useState<Coin[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const coinIds = coins.map((c) => c.id);
  const streamPrices = usePriceStream(coinIds);

  const refreshMarkets = useCallback(async () => {
    const [m, g, w] = await Promise.all([getMarkets(20), getGlobal(), getWatchlist()]);
    setCoins(m); setStats(g); setWatchCoins(w);
  }, []);
  usePolling(refreshMarkets, 15_000);

  useEffect(() => {
    Promise.all([getMarkets(20), getGlobal(), getWatchlist(), getAlerts()])
      .then(([m, g, w, a]) => { setCoins(m); setStats(g); setWatchCoins(w); setAlerts(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleAlert(id: string, isActive: boolean) {
    setAlerts((p) => p.map((a) => a.id === id ? { ...a, isActive } : a));
    await updateAlert(id, { isActive }).catch(console.error);
  }

  const btcBase = coins[0];
  const btc = btcBase ? { ...btcBase, price: streamPrices[btcBase.id] ?? btcBase.price } : undefined;
  const kpis = stats ? [
    { label: "Global Market Cap", value: fmt(stats.totalMarketCap), change: stats.marketCapChange, color: "#00f0ff" },
    { label: "24h Volume",        value: fmt(stats.totalVolume24h),  change: stats.volumeChange,    color: "#ff2d7b" },
    { label: "BTC Dominance",     value: `${stats.btcDominance.toFixed(1)}%`, change: stats.btcDomChange, color: "#00f0ff" },
    { label: "Fear & Greed",      value: `${stats.fearGreed} ${stats.fearGreedLabel}`, change: stats.fearGreedChange, color: "#ffd666" },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading market data…</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="dc-card p-[18px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>{k.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mono"
                  style={{ background: k.change >= 0 ? "var(--cyan-soft)" : "rgba(255,45,123,0.14)", color: k.change >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                  {k.change >= 0 ? "+" : ""}{k.change.toFixed(2)}{k.label === "Fear & Greed" ? "" : "%"}
                </span>
              </div>
              <p className="text-2xl font-extrabold mono mb-2">{k.value}</p>
              <Sparkline data={KPISPARK[k.label]} positive={k.change >= 0} height={28} glow />
            </div>
          ))}
        </div>

        {/* Main chart */}
        {btc && (
          <div className="dc-card p-[18px]">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CoinIcon coin={btc} size={40} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{btc.name}</span>
                    <span className="text-sm mono" style={{ color: "var(--muted)" }}>{btc.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AnimatedNumber value={btc.price} prefix="$" className="text-2xl font-extrabold mono" />
                    <span className="flex items-center gap-0.5 text-sm font-semibold mono" style={{ color: btc.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                      {btc.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(btc.change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <TimeframeTabs />
            </div>
            <AreaChart data={btc.sparkline} height={260} />
          </div>
        )}

        {/* Top Markets */}
        <div className="dc-card overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-4">
            <h2 className="text-base font-bold">Top Markets</h2>
            <span className="text-xs" style={{ color: "var(--muted)" }}>Top 20 by market cap</span>
          </div>
          <div className="overflow-x-auto">
            <div style={{ minWidth: 720 }}>
              <div className="grid items-center px-[18px] py-2 text-[11px] font-semibold tracking-wide"
                style={{ gridTemplateColumns: "28px 2fr 1.2fr 1fr 1fr 1.2fr 1.1fr 80px 36px", color: "var(--muted)", borderBottom: "1px solid var(--card-border)" }}>
                <span>#</span><span>NAME</span><span className="text-right">PRICE</span><span className="text-right">24H</span>
                <span className="text-right">7D</span><span className="text-right">MKT CAP</span><span className="text-right">VOLUME</span>
                <span className="text-center">LAST 7D</span><span />
              </div>
              {coins.map((c) => {
                const livePrice = streamPrices[c.id] ?? c.price;
                return (
                <Link key={c.id} href={`/coin/${c.id}`}
                  className="grid items-center px-[18px] py-3 transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: "28px 2fr 1.2fr 1fr 1fr 1.2fr 1.1fr 80px 36px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-xs mono" style={{ color: "var(--muted)" }}>{c.rank}</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CoinIcon coin={c} size={28} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs mono" style={{ color: "var(--muted)" }}>{c.symbol}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold mono text-right">
                    <AnimatedNumber value={livePrice} prefix="$" decimals={livePrice < 1 ? 4 : 2} className="text-sm font-semibold mono" />
                  </span>
                  <span className="text-sm font-medium mono text-right" style={{ color: c.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                    {c.change24h >= 0 ? "▲" : "▼"} {Math.abs(c.change24h).toFixed(2)}%
                  </span>
                  <span className="text-sm font-medium mono text-right" style={{ color: c.change7d >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                    {c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%
                  </span>
                  <span className="text-sm mono text-right">{fmt(c.marketCap)}</span>
                  <span className="text-sm mono text-right" style={{ color: "var(--muted-2)" }}>{fmt(c.volume24h)}</span>
                  <div className="px-2"><Sparkline data={c.sparkline} positive={c.change7d >= 0} height={28} /></div>
                  <Star size={14} className="justify-self-center"
                    fill={watchCoins.some((w) => w.id === c.id) ? "var(--gold)" : "none"}
                    style={{ color: watchCoins.some((w) => w.id === c.id) ? "var(--gold)" : "var(--muted)" }} />
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <div className="flex flex-col gap-4">
        {/* Watchlist */}
        <div className="dc-card p-[18px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">My Watchlist</h2>
            <Star size={16} fill="var(--gold)" style={{ color: "var(--gold)" }} />
          </div>
          <div className="flex flex-col gap-1">
            {watchCoins.map((c) => {
              const livePrice = streamPrices[c.id] ?? c.price;
              return (
              <Link key={c.id} href={`/coin/${c.id}`} className="flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors hover:bg-white/[0.03]">
                <CoinIcon coin={c} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.symbol}</p>
                  <AnimatedNumber value={livePrice} prefix="$" decimals={livePrice < 1 ? 4 : 2} className="text-xs mono" />
                </div>
                <div className="w-14"><Sparkline data={c.sparkline} positive={c.change24h >= 0} height={24} /></div>
                <span className="text-xs font-semibold mono w-12 text-right" style={{ color: c.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                  {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                </span>
              </Link>
              );
            })}
            {watchCoins.length === 0 && <p className="text-xs py-3 text-center" style={{ color: "var(--muted)" }}>No coins in watchlist</p>}
          </div>
        </div>

        {/* Price Alerts */}
        <div className="dc-card p-[18px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Price Alerts</h2>
            <Link href="/alerts" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "var(--cyan)" }}>
              <Plus size={13} /> New
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--card-border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: a.condition === "above" ? "var(--cyan-soft)" : "rgba(255,45,123,0.14)" }}>
                  {a.condition === "above"
                    ? <TrendingUp size={15} style={{ color: "var(--cyan)" }} />
                    : <TrendingDown size={15} style={{ color: "var(--pink)" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{a.coinId.toUpperCase()} {a.condition}</p>
                  <p className="text-xs mono" style={{ color: "var(--muted)" }}>target {fmt(a.targetPrice)}</p>
                </div>
                <button onClick={() => toggleAlert(a.id, !a.isActive)}
                  className="w-10 h-6 rounded-full relative transition-all shrink-0"
                  style={{ background: a.isActive ? "var(--cyan)" : "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: a.isActive ? "18px" : "2px" }} />
                </button>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-xs py-3 text-center" style={{ color: "var(--muted)" }}>No alerts set</p>}
          </div>
        </div>

        {/* CTA */}
        <Link href="/markets" className="dc-card p-[18px] flex items-center justify-between group"
          style={{ background: "linear-gradient(135deg,rgba(0,240,255,0.08),rgba(255,45,123,0.05))" }}>
          <div>
            <p className="text-sm font-bold">Explore all markets</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>13,204 coins tracked live</p>
          </div>
          <ArrowUpRight size={20} style={{ color: "var(--cyan)" }} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
