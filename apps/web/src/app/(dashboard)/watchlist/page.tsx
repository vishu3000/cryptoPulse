"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import CoinIcon from "@/components/CoinIcon";
import { getWatchlist, getMarkets, addToWatchlist, removeFromWatchlist, type Coin } from "@/lib/api";
import { price, fmt } from "@/lib/staticData";
import { Star, Trash2, Bell, Plus, Search } from "lucide-react";

export default function Watchlist() {
  const [watchCoins, setWatchCoins] = useState<Coin[]>([]);
  const [allCoins, setAllCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([getWatchlist(), getMarkets(50)])
      .then(([w, m]) => { setWatchCoins(w); setAllCoins(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addCoin(coin: Coin) {
    setWatchCoins((p) => [...p, coin]);
    setSearch("");
    await addToWatchlist(coin.id).catch(console.error);
  }

  async function removeCoin(id: string) {
    setWatchCoins((p) => p.filter((c) => c.id !== id));
    await removeFromWatchlist(id).catch(console.error);
  }

  const watchedIds = watchCoins.map((c) => c.id);
  const results = allCoins
    .filter((c) => !watchedIds.includes(c.id) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())))
    .slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading watchlist…</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Watchlist</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{watchCoins.length} coins tracked</p>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--cyan)", color: "#05070d", boxShadow: "0 0 20px rgba(0,240,255,0.35)" }}>
          <Plus size={15} /> Add Coin
        </button>
      </div>

      {showAdd && (
        <div className="dc-card p-4">
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search to add…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-white/30"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }} />
          </div>
          {search && results.map((c) => (
            <button key={c.id} onClick={() => addCoin(c)}
              className="w-full flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              <CoinIcon coin={c} size={28} />
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs mono" style={{ color: "var(--muted)" }}>{c.symbol}</span>
              <span className="ml-auto text-xs font-semibold" style={{ color: "var(--cyan)" }}>+ Add</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {watchCoins.map((c) => (
          <div key={c.id} className="dc-card p-[18px]">
            <div className="flex items-start justify-between mb-3">
              <Link href={`/coin/${c.id}`} className="flex items-center gap-3">
                <CoinIcon coin={c} size={40} />
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs mono" style={{ color: "var(--muted)" }}>{c.symbol}</p>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <Link href="/alerts" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
                  <Bell size={14} style={{ color: "var(--muted)" }} />
                </Link>
                <button onClick={() => removeCoin(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
                  <Trash2 size={14} style={{ color: "rgba(255,45,123,0.5)" }} />
                </button>
              </div>
            </div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-2xl font-extrabold mono">{price(c.price)}</p>
                <p className="text-xs mono mt-0.5" style={{ color: "var(--muted)" }}>Mkt Cap {fmt(c.marketCap)}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 rounded-lg text-sm font-bold mono"
                  style={{ background: c.change24h >= 0 ? "var(--cyan-soft)" : "rgba(255,45,123,0.14)", color: c.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                  {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                </span>
                <p className="text-xs mono mt-1" style={{ color: c.change7d >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                  7d {c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%
                </p>
              </div>
            </div>
            <Sparkline data={c.sparkline} positive={c.change24h >= 0} height={44} glow />
          </div>
        ))}
      </div>

      {watchCoins.length === 0 && (
        <div className="dc-card flex flex-col items-center justify-center py-16 gap-3">
          <Star size={40} style={{ color: "rgba(255,255,255,0.12)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>No coins in your watchlist yet</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--cyan-soft)", color: "var(--cyan)" }}>Add your first coin</button>
        </div>
      )}
    </div>
  );
}
