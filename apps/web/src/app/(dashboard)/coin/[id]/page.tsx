"use client";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import AreaChart from "@/components/AreaChart";
import VolumeBars from "@/components/VolumeBars";
import CoinIcon from "@/components/CoinIcon";
import TimeframeTabs from "@/components/TimeframeTabs";
import AnimatedNumber from "@/components/AnimatedNumber";
import ConvertWidget from "@/components/ConvertWidget";
import { getCoinDetail, getMarkets, addToWatchlist, removeFromWatchlist, getWatchlist, type CoinDetail, type Coin } from "@/lib/api";
import { fmt, price, compactNum } from "@/lib/staticData";
import { usePriceStream } from "@/hooks/usePriceStream";
import { TrendingUp, TrendingDown, Star, ChevronRight } from "lucide-react";

export default function CoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [related, setRelated] = useState<Coin[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    getCoinDetail(id)
      .then(async (c) => {
        setCoin(c);
        const [markets, wl] = await Promise.allSettled([getMarkets(20), getWatchlist()]);
        if (markets.status === "fulfilled") setRelated(markets.value.filter((m) => m.id !== id).slice(0, 5));
        if (wl.status === "fulfilled") setInWatchlist(wl.value.some((w) => w.id === id));
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleWatch() {
    if (!coin) return;
    if (inWatchlist) {
      setInWatchlist(false);
      await removeFromWatchlist(id).catch(console.error);
    } else {
      setInWatchlist(true);
      await addToWatchlist(id).catch(console.error);
    }
  }

  const streamPrices = usePriceStream(coin ? [coin.id] : []);
  const livePrice = (coin && streamPrices[coin.id]) ?? coin?.price ?? 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm mono" style={{ color: "var(--muted)" }}>Loading…</p>
    </div>
  );
  if (notFoundState || !coin) return notFound();

  const up = coin.change24h >= 0;
  const rangePct = ((livePrice - coin.low24h) / (coin.high24h - coin.low24h)) * 100;

  const statsGrid = [
    { label: "Market Cap",         value: fmt(coin.marketCap),               sub: `#${coin.rank} by cap` },
    { label: "24h Volume",         value: fmt(coin.volume24h),                sub: "daily turnover" },
    { label: "Circulating Supply", value: compactNum(coin.circulatingSupply), sub: coin.maxSupply ? `${Math.round((coin.circulatingSupply / coin.maxSupply) * 100)}% of max` : "no max" },
    { label: "Max Supply",         value: coin.maxSupply ? compactNum(coin.maxSupply) : "∞", sub: coin.maxSupply ? "hard cap" : "uncapped" },
    { label: "All-Time High",      value: price(coin.ath),                    sub: `${coin.athDate} · ${coin.athChange.toFixed(1)}%`, subColor: "var(--pink)" },
    { label: "All-Time Low",       value: price(coin.atl),                    sub: `${coin.atlDate} · +${compactNum(coin.atlChange)}%`, subColor: "var(--cyan)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
        <ChevronRight size={14} />
        <span className="text-white">{coin.name}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <CoinIcon coin={coin} size={52} />
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-extrabold">{coin.name}</h1>
              <span className="text-sm mono" style={{ color: "var(--muted)" }}>{coin.symbol}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md mono" style={{ background: "var(--cyan-soft)", color: "var(--cyan)" }}>Rank #{coin.rank}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <AnimatedNumber value={livePrice} prefix="$" decimals={livePrice < 1 ? 4 : 2} className="text-3xl font-extrabold mono" />
              <span className="flex items-center gap-0.5 text-base font-bold mono" style={{ color: up ? "var(--cyan)" : "var(--pink)" }}>
                {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {Math.abs(coin.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={toggleWatch} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: inWatchlist ? "rgba(255,214,102,0.15)" : "rgba(255,214,102,0.1)", border: "1px solid rgba(255,214,102,0.3)", color: "var(--gold)" }}>
            <Star size={15} fill={inWatchlist ? "var(--gold)" : "none"} /> {inWatchlist ? "Watching" : "Watchlist"}
          </button>
          <button className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--cyan)", color: "#05070d", boxShadow: "0 0 22px rgba(0,240,255,0.4)" }}>
            Buy {coin.symbol}
          </button>
        </div>
      </div>

      <div className="dc-card p-[18px]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-4 text-xs mono" style={{ color: "var(--muted)" }}>
            <span>O <span className="text-white">{compactNum(coin.low24h + (coin.high24h - coin.low24h) * 0.3)}</span></span>
            <span>H <span style={{ color: "var(--cyan)" }}>{compactNum(coin.high24h)}</span></span>
            <span>L <span style={{ color: "var(--pink)" }}>{compactNum(coin.low24h)}</span></span>
            <span>C <span className="text-white">{compactNum(livePrice)}</span></span>
          </div>
          <TimeframeTabs initial="24H" />
        </div>
        <AreaChart data={coin.sparkline} height={240} color={up ? "#00f0ff" : "#ff2d7b"} />
        <div className="mt-2"><VolumeBars count={60} height={56} seed={coin.rank + 3} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="grid grid-cols-2 gap-3 content-start">
          {statsGrid.map((s) => (
            <div key={s.label} className="dc-card p-[18px]">
              <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{s.label}</p>
              <p className="text-xl font-extrabold mono mb-1">{s.value}</p>
              <p className="text-xs mono" style={{ color: s.subColor ?? "var(--muted)" }}>{s.sub}</p>
            </div>
          ))}

          <div className="dc-card p-[18px] col-span-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted)" }}>24h Range</span>
              <span className="text-xs mono" style={{ color: "var(--muted)" }}>Low ~ High</span>
            </div>
            <div className="relative h-2 rounded-full mb-2" style={{ background: "linear-gradient(90deg,#ff2d7b,#ffd666,#00f0ff)" }}>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white"
                style={{ left: `calc(${Math.min(Math.max(rangePct, 2), 98)}% - 8px)`, background: "#05070d", boxShadow: "0 0 8px rgba(0,240,255,0.7)" }} />
            </div>
            <div className="flex items-center justify-between text-sm mono font-semibold">
              <span style={{ color: "var(--pink)" }}>{price(coin.low24h)}</span>
              <span style={{ color: "var(--cyan)" }}>{price(coin.high24h)}</span>
            </div>
          </div>
        </div>
        <ConvertWidget coin={coin} />
      </div>

      <div>
        <h2 className="text-base font-bold mb-3">Related Coins</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {related.map((c) => (
            <Link key={c.id} href={`/coin/${c.id}`} className="dc-card p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-2 mb-2.5">
                <CoinIcon coin={c} size={28} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.symbol}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.name}</p>
                </div>
              </div>
              <p className="text-base font-bold mono">{price(c.price)}</p>
              <p className="text-xs font-semibold mono" style={{ color: c.change24h >= 0 ? "var(--cyan)" : "var(--pink)" }}>
                {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
