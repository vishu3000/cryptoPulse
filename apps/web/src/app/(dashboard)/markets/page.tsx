"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Sparkline from "@/components/Sparkline";
import CoinIcon from "@/components/CoinIcon";
import AnimatedNumber from "@/components/AnimatedNumber";
import { getMarkets, addToWatchlist, removeFromWatchlist, getWatchlist, type Coin } from "@/lib/api";
import { usePriceStream } from "@/hooks/usePriceStream";
import { usePolling } from "@/hooks/usePolling";
import { Search, Star } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const FX: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5 };
const SYM: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };

type SortKey = "rank" | "price" | "change24h" | "change7d" | "marketCap" | "volume24h";

export default function Markets() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const streamPrices = usePriceStream(coins.map((c) => c.id));

  const refreshMarkets = useCallback(async () => {
    const m = await getMarkets(50);
    setCoins(m);
  }, []);
  usePolling(refreshMarkets, 15_000);

  useEffect(() => {
    Promise.all([getMarkets(50), getWatchlist()])
      .then(([m, w]) => { setCoins(m); setWatchedIds(w.map((c) => c.id)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleWatch(coinId: string) {
    const isWatched = watchedIds.includes(coinId);
    setWatchedIds((w) => isWatched ? w.filter((x) => x !== coinId) : [...w, coinId]);
    if (isWatched) await removeFromWatchlist(coinId).catch(console.error);
    else await addToWatchlist(coinId).catch(console.error);
  }

  const sym = SYM[currency];
  const rate = FX[currency];

  const rows = coins
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a[sortBy] - b[sortBy]) * (dir === "asc" ? 1 : -1));

  function toggleSort(k: SortKey) {
    if (sortBy === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(k); setDir("desc"); }
  }

  const Col = ({ k, label, align = "right" }: { k: SortKey; label: string; align?: string }) => (
    <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 text-[11px] font-semibold tracking-wide ${align === "right" ? "justify-end" : ""}`}
      style={{ color: sortBy === k ? "var(--cyan)" : "var(--muted)" }}>
      {label}<span className="text-[9px]">{sortBy === k ? (dir === "asc" ? "▲" : "▼") : "⇅"}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Markets</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Live prices across {coins.length} assets</p>
        </div>
        <div className="flex p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }}>
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => setCurrency(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold mono transition-all"
              style={{ background: currency === c ? "var(--cyan-soft)" : "transparent", color: currency === c ? "var(--cyan)" : "var(--muted)" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coins…"
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none placeholder:text-white/35"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--card-border)" }} />
      </div>

      {loading ? (
        <div className="dc-card flex items-center justify-center h-48">
          <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading markets…</p>
        </div>
      ) : (
        <div className="dc-card overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 820 }}>
              <div className="grid items-center px-[18px] py-2.5"
                style={{ gridTemplateColumns: "32px 2fr 1.3fr 1fr 1fr 1.3fr 1.2fr 90px 40px", borderBottom: "1px solid var(--card-border)" }}>
                <Col k="rank" label="#" align="left" />
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--muted)" }}>NAME</span>
                <Col k="price" label="PRICE" />
                <Col k="change24h" label="24H" />
                <Col k="change7d" label="7D" />
                <Col k="marketCap" label="MKT CAP" />
                <Col k="volume24h" label="VOLUME" />
                <span className="text-[11px] font-semibold tracking-wide text-center" style={{ color: "var(--muted)" }}>LAST 7D</span>
                <span />
              </div>
              {rows.map((c) => {
                const livePrice = streamPrices[c.id] ?? c.price;
                return (
                <div key={c.id} className="grid items-center px-[18px] py-3 transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: "32px 2fr 1.3fr 1fr 1fr 1.3fr 1.2fr 90px 40px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-xs mono" style={{ color: "var(--muted)" }}>{c.rank}</span>
                  <Link href={`/coin/${c.id}`} className="flex items-center gap-2.5 min-w-0">
                    <CoinIcon coin={c} size={30} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs mono" style={{ color: "var(--muted)" }}>{c.symbol}</p>
                    </div>
                  </Link>
                  <span className="text-sm font-semibold mono text-right">
                    <AnimatedNumber value={livePrice * rate} decimals={livePrice < 1 ? 4 : 2} prefix={sym} className="text-sm font-semibold mono" />
                  </span>
                  <span className="text-sm font-medium mono text-right" style={{ color: c.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                    {c.change24h >= 0 ? "▲" : "▼"} {Math.abs(c.change24h).toFixed(2)}%
                  </span>
                  <span className="text-sm font-medium mono text-right" style={{ color: c.change7d >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                    {c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%
                  </span>
                  <span className="text-sm mono text-right">{sym}{((c.marketCap * rate) / 1e9).toFixed(1)}B</span>
                  <span className="text-sm mono text-right" style={{ color: "var(--muted-2)" }}>{sym}{((c.volume24h * rate) / 1e9).toFixed(1)}B</span>
                  <div className="px-2"><Sparkline data={c.sparkline} positive={c.change7d >= 0} height={30} /></div>
                  <button onClick={() => toggleWatch(c.id)} className="justify-self-center">
                    <Star size={15} fill={watchedIds.includes(c.id) ? "var(--gold)" : "none"}
                      style={{ color: watchedIds.includes(c.id) ? "var(--gold)" : "var(--muted)" }} />
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
