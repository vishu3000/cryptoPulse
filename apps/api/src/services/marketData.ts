import type { Coin, CoinDetail, MarketStats, ConvertResult } from "@crypto-pulse/shared";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const FRANKFURTER_BASE = "https://api.frankfurter.app";

type CacheEntry<T> = { data: T; ts: number; stale?: boolean };
const cache = new Map<string, CacheEntry<unknown>>();

function get<T>(key: string): CacheEntry<T> | undefined {
  return cache.get(key) as CacheEntry<T> | undefined;
}

function set<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

function isExpired(entry: CacheEntry<unknown>, ttlMs: number) {
  return Date.now() - entry.ts > ttlMs;
}

async function fetchWithCache<T>(key: string, url: string, ttlMs: number): Promise<{ data: T; stale: boolean }> {
  const cached = get<T>(key);

  if (cached && !isExpired(cached, ttlMs)) {
    return { data: cached.data, stale: false };
  }

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    set(key, data);
    return { data, stale: false };
  } catch (err) {
    if (cached) {
      console.warn(`[marketData] upstream error, serving stale cache for ${key}:`, err);
      return { data: cached.data, stale: true };
    }
    throw err;
  }
}

// CoinGecko id → our id (some differ)
const CG_ID_MAP: Record<string, string> = {
  "usd-coin": "usd-coin",
};

function mapCgCoin(raw: Record<string, unknown>): Coin {
  const sparkRaw = (raw.sparkline_in_7d as { price?: number[] } | undefined)?.price ?? [];
  const step = Math.max(1, Math.floor(sparkRaw.length / 10));
  const sparkline = Array.from({ length: 10 }, (_, i) => sparkRaw[i * step] ?? 0);

  return {
    id: String(raw.id),
    symbol: String(raw.symbol).toUpperCase(),
    name: String(raw.name),
    price: Number(raw.current_price ?? 0),
    change24h: Number(raw.price_change_percentage_24h ?? 0),
    change7d: Number(raw.price_change_percentage_7d_in_currency ?? 0),
    marketCap: Number(raw.market_cap ?? 0),
    volume24h: Number(raw.total_volume ?? 0),
    rank: Number(raw.market_cap_rank ?? 0),
    color: "#888888",
    sparkline,
    circulatingSupply: Number(raw.circulating_supply ?? 0),
    maxSupply: raw.max_supply != null ? Number(raw.max_supply) : null,
    ath: Number(raw.ath ?? 0),
    athDate: String(raw.ath_date ?? ""),
    athChange: Number(raw.ath_change_percentage ?? 0),
    atl: Number(raw.atl ?? 0),
    atlDate: String(raw.atl_date ?? ""),
    atlChange: Number(raw.atl_change_percentage ?? 0),
    high24h: Number(raw.high_24h ?? 0),
    low24h: Number(raw.low_24h ?? 0),
  };
}

// Coin brand colors (same as staticData)
const BRAND_COLORS: Record<string, string> = {
  bitcoin: "#F7931A", ethereum: "#627EEA", tether: "#26A17B", bnb: "#F3BA2F",
  solana: "#9945FF", xrp: "#6B7785", "usd-coin": "#2775CA", dogecoin: "#C2A633",
  cardano: "#2A5ADA", avalanche: "#E84142", chainlink: "#2A5ADA", polkadot: "#E6007A",
};

export async function getMarkets(vs = "usd", limit = 20): Promise<{ data: Coin[]; stale: boolean }> {
  const key = `markets:${vs}:${limit}`;
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h%2C7d`;
  const result = await fetchWithCache<Record<string, unknown>[]>(key, url, 30_000);
  const coins = result.data.map((raw) => {
    const coin = mapCgCoin(raw);
    coin.color = BRAND_COLORS[coin.id] ?? "#888888";
    return coin;
  });
  return { data: coins, stale: result.stale };
}

export async function getCoinDetail(id: string, vs = "usd"): Promise<{ data: CoinDetail; stale: boolean }> {
  const key = `coin:${id}:${vs}`;
  const url = `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&sparkline=true`;
  const result = await fetchWithCache<Record<string, unknown>>(key, url, 30_000);
  const raw = result.data;
  const mkt = raw.market_data as Record<string, Record<string, number>>;

  const sparkRaw = (raw.market_data as Record<string, { price?: number[] }>)?.sparkline_7d?.price ?? [];
  const step = Math.max(1, Math.floor(sparkRaw.length / 10));
  const sparkline = Array.from({ length: 10 }, (_, i) => sparkRaw[i * step] ?? 0);

  const coin: CoinDetail = {
    id: String(raw.id),
    symbol: (String(raw.symbol)).toUpperCase(),
    name: String(raw.name),
    price: mkt.current_price?.[vs] ?? 0,
    change24h: mkt.price_change_percentage_24h_in_currency?.[vs] ?? 0,
    change7d: mkt.price_change_percentage_7d_in_currency?.[vs] ?? 0,
    marketCap: mkt.market_cap?.[vs] ?? 0,
    volume24h: mkt.total_volume?.[vs] ?? 0,
    rank: Number(raw.market_cap_rank ?? 0),
    color: BRAND_COLORS[String(raw.id)] ?? "#888888",
    sparkline,
    circulatingSupply: Number(mkt.circulating_supply ?? 0),
    maxSupply: mkt.max_supply != null ? Number(mkt.max_supply) : null,
    ath: mkt.ath?.[vs] ?? 0,
    athDate: String((mkt as unknown as Record<string, Record<string, string>>).ath_date?.[vs] ?? ""),
    athChange: mkt.ath_change_percentage?.[vs] ?? 0,
    atl: mkt.atl?.[vs] ?? 0,
    atlDate: String((mkt as unknown as Record<string, Record<string, string>>).atl_date?.[vs] ?? ""),
    atlChange: mkt.atl_change_percentage?.[vs] ?? 0,
    high24h: mkt.high_24h?.[vs] ?? 0,
    low24h: mkt.low_24h?.[vs] ?? 0,
  };
  return { data: coin, stale: result.stale };
}

export async function getGlobal(): Promise<{ data: MarketStats; stale: boolean }> {
  const key = "global";
  const url = `${COINGECKO_BASE}/global`;
  const result = await fetchWithCache<{ data: Record<string, unknown> }>(key, url, 30_000);
  const d = result.data.data as Record<string, unknown>;

  const stats: MarketStats = {
    totalMarketCap: Number((d.total_market_cap as Record<string, number>)?.usd ?? 0),
    totalVolume24h: Number((d.total_volume as Record<string, number>)?.usd ?? 0),
    btcDominance: Number(d.market_cap_percentage ? (d.market_cap_percentage as Record<string, number>).btc : 0),
    fearGreed: 72,
    fearGreedLabel: "Greed",
    marketCapChange: Number(d.market_cap_change_percentage_24h_usd ?? 0),
    volumeChange: 0,
    btcDomChange: 0,
    fearGreedChange: 0,
  };
  return { data: stats, stale: result.stale };
}

export async function convert(from: string, to: string, amount: number): Promise<ConvertResult> {
  // Crypto → crypto or crypto → fiat via CoinGecko price
  const FIAT = ["usd", "eur", "gbp", "jpy", "inr", "aud", "cad", "chf"];
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (!FIAT.includes(fromLower) && !FIAT.includes(toLower)) {
    // crypto → crypto
    const [fromD, toD] = await Promise.all([getCoinDetail(fromLower), getCoinDetail(toLower)]);
    const rate = fromD.data.price / toD.data.price;
    return { from, to, amount, rate, result: amount * rate };
  }

  if (!FIAT.includes(fromLower)) {
    // crypto → fiat
    const { data } = await getCoinDetail(fromLower);
    const fiatPrice = data.price;
    if (toLower === "usd") return { from, to, amount, rate: fiatPrice, result: amount * fiatPrice };
    // convert USD → target fiat via Frankfurter
    const fxKey = `fx:USD:${toLower.toUpperCase()}`;
    const fxUrl = `${FRANKFURTER_BASE}/latest?from=USD&to=${toLower.toUpperCase()}`;
    const fxResult = await fetchWithCache<{ rates: Record<string, number> }>(fxKey, fxUrl, 3_600_000);
    const fxRate = fxResult.data.rates[toLower.toUpperCase()] ?? 1;
    const rate = fiatPrice * fxRate;
    return { from, to, amount, rate, result: amount * rate };
  }

  // fiat → fiat via Frankfurter
  const fxKey = `fx:${fromLower.toUpperCase()}:${toLower.toUpperCase()}`;
  const fxUrl = `${FRANKFURTER_BASE}/latest?from=${fromLower.toUpperCase()}&to=${toLower.toUpperCase()}`;
  const fxResult = await fetchWithCache<{ rates: Record<string, number> }>(fxKey, fxUrl, 3_600_000);
  const rate = fxResult.data.rates[toLower.toUpperCase()] ?? 1;
  return { from, to, amount, rate, result: amount * rate };
}

export async function getPricesForCoins(coinIds: string[]): Promise<Record<string, number>> {
  if (coinIds.length === 0) return {};
  const ids = coinIds.join(",");
  const key = `simple:${ids}`;
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`;
  const result = await fetchWithCache<Record<string, { usd: number }>>(key, url, 30_000);
  return Object.fromEntries(Object.entries(result.data).map(([id, v]) => [id, v.usd]));
}
