export type Coin = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  color: string;
  sparkline: number[];
  circulatingSupply: number;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  athChange: number;
  atl: number;
  atlDate: string;
  atlChange: number;
  high24h: number;
  low24h: number;
};

// Brand colors pulled from the imported design
export const COINS: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 67863.25, change24h: 2.34, change7d: 8.12, marketCap: 1340000000000, volume24h: 38200000000, rank: 1, color: "#F7931A", sparkline: [62100, 62800, 63400, 62900, 64600, 65200, 64800, 66100, 67200, 67863], circulatingSupply: 19710000, maxSupply: 21000000, ath: 73750, athDate: "Mar 14, 2024", athChange: -8.0, atl: 67.81, atlDate: "Jul 6, 2013", atlChange: 99900, high24h: 68120, low24h: 65840 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3511.44, change24h: 1.12, change7d: 3.14, marketCap: 422000000000, volume24h: 19400000000, rank: 2, color: "#627EEA", sparkline: [3380, 3420, 3460, 3490, 3470, 3510, 3500, 3520, 3505, 3511], circulatingSupply: 120200000, maxSupply: null, ath: 4878, athDate: "Nov 10, 2021", athChange: -28.0, atl: 0.4329, atlDate: "Oct 20, 2015", atlChange: 810000, high24h: 3540, low24h: 3460 },
  { id: "tether", symbol: "USDT", name: "Tether", price: 1.0, change24h: 0.01, change7d: 0.0, marketCap: 112400000000, volume24h: 64200000000, rank: 3, color: "#26A17B", sparkline: [1.0, 1.001, 0.999, 1.0, 1.0, 0.999, 1.0, 1.0, 1.001, 1.0], circulatingSupply: 112400000000, maxSupply: null, ath: 1.32, athDate: "Jul 24, 2018", athChange: -24, atl: 0.572, atlDate: "Mar 2, 2015", atlChange: 74, high24h: 1.001, low24h: 0.999 },
  { id: "bnb", symbol: "BNB", name: "BNB", price: 602.82, change24h: -0.45, change7d: -2.1, marketCap: 89100000000, volume24h: 2100000000, rank: 4, color: "#F3BA2F", sparkline: [615, 612, 608, 604, 600, 598, 601, 605, 603, 602.82], circulatingSupply: 147000000, maxSupply: 200000000, ath: 717, athDate: "Jun 6, 2024", athChange: -16, atl: 0.0398, atlDate: "Oct 19, 2017", atlChange: 1500000, high24h: 612, low24h: 598 },
  { id: "solana", symbol: "SOL", name: "Solana", price: 173.62, change24h: 5.67, change7d: 12.4, marketCap: 78600000000, volume24h: 4800000000, rank: 5, color: "#9945FF", sparkline: [152, 156, 159, 163, 166, 168, 171, 169, 172, 173.62], circulatingSupply: 452000000, maxSupply: null, ath: 259, athDate: "Nov 6, 2021", athChange: -33, atl: 0.5052, atlDate: "May 11, 2020", atlChange: 34000, high24h: 176, low24h: 164 },
  { id: "xrp", symbol: "XRP", name: "XRP", price: 0.5829, change24h: -1.23, change7d: -4.3, marketCap: 32400000000, volume24h: 1600000000, rank: 6, color: "#6B7785", sparkline: [0.61, 0.60, 0.595, 0.59, 0.588, 0.585, 0.583, 0.584, 0.583, 0.5829], circulatingSupply: 55600000000, maxSupply: 100000000000, ath: 3.4, athDate: "Jan 7, 2018", athChange: -83, atl: 0.0028, atlDate: "May 22, 2014", atlChange: 20000, high24h: 0.601, low24h: 0.578 },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", price: 1.0, change24h: 0.0, change7d: 0.0, marketCap: 33900000000, volume24h: 7200000000, rank: 7, color: "#2775CA", sparkline: [1.0, 1.0, 0.999, 1.0, 1.0, 1.0, 0.999, 1.0, 1.0, 1.0], circulatingSupply: 33900000000, maxSupply: null, ath: 1.17, athDate: "May 8, 2019", athChange: -15, atl: 0.877, atlDate: "Mar 11, 2023", atlChange: 14, high24h: 1.0, low24h: 0.999 },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.1622, change24h: 3.88, change7d: 9.8, marketCap: 23600000000, volume24h: 1900000000, rank: 8, color: "#C2A633", sparkline: [0.146, 0.149, 0.152, 0.155, 0.158, 0.16, 0.159, 0.161, 0.162, 0.1622], circulatingSupply: 145000000000, maxSupply: null, ath: 0.731, athDate: "May 8, 2021", athChange: -78, atl: 0.0000869, atlDate: "May 6, 2015", atlChange: 186000, high24h: 0.165, low24h: 0.156 },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.4523, change24h: -0.92, change7d: 2.1, marketCap: 16100000000, volume24h: 600000000, rank: 9, color: "#2A5ADA", sparkline: [0.44, 0.445, 0.45, 0.455, 0.452, 0.45, 0.451, 0.453, 0.452, 0.4523], circulatingSupply: 35600000000, maxSupply: 45000000000, ath: 3.09, athDate: "Sep 2, 2021", athChange: -85, atl: 0.0192, atlDate: "Oct 1, 2017", atlChange: 2200, high24h: 0.461, low24h: 0.448 },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", price: 38.22, change24h: -1.91, change7d: 1.5, marketCap: 15700000000, volume24h: 480000000, rank: 10, color: "#E84142", sparkline: [39.5, 39.1, 38.8, 38.5, 38.2, 38.0, 38.1, 38.3, 38.2, 38.22], circulatingSupply: 410000000, maxSupply: 720000000, ath: 146, athDate: "Nov 21, 2021", athChange: -74, atl: 2.8, atlDate: "Dec 31, 2020", atlChange: 1265, high24h: 39.5, low24h: 37.9 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 18.45, change24h: 4.21, change7d: 6.2, marketCap: 11600000000, volume24h: 540000000, rank: 11, color: "#2A5ADA", sparkline: [17.2, 17.5, 17.8, 18.0, 18.2, 18.3, 18.1, 18.4, 18.45, 18.45], circulatingSupply: 626000000, maxSupply: 1000000000, ath: 52.7, athDate: "May 10, 2021", athChange: -65, atl: 0.148, atlDate: "Nov 29, 2017", atlChange: 12300, high24h: 18.6, low24h: 17.6 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 7.82, change24h: -2.34, change7d: -5.1, marketCap: 10200000000, volume24h: 290000000, rank: 12, color: "#E6007A", sparkline: [8.2, 8.1, 8.0, 7.95, 7.9, 7.85, 7.83, 7.84, 7.82, 7.82], circulatingSupply: 1430000000, maxSupply: null, ath: 55, athDate: "Nov 4, 2021", athChange: -86, atl: 2.7, atlDate: "Aug 20, 2020", atlChange: 190, high24h: 8.2, low24h: 7.78 },
];

export const WATCHLIST_IDS = ["bitcoin", "solana", "ethereum", "chainlink"];

export const PORTFOLIO = [
  { coinId: "bitcoin", qty: 1.1742, avgBuyPrice: 48210 },
  { coinId: "ethereum", qty: 14.76, avgBuyPrice: 2890 },
  { coinId: "solana", qty: 169.42, avgBuyPrice: 98.4 },
  { coinId: "chainlink", qty: 890, avgBuyPrice: 21.1 },
  { coinId: "dogecoin", qty: 44200, avgBuyPrice: 0.142 },
];

export const ALERTS = [
  { id: "1", coinId: "bitcoin", symbol: "BTC", condition: "above" as const, targetPrice: 70000, email: "vishuyadav856@gmail.com", isActive: true, triggeredAt: null },
  { id: "2", coinId: "ethereum", symbol: "ETH", condition: "below" as const, targetPrice: 3200, email: "vishuyadav856@gmail.com", isActive: true, triggeredAt: null },
  { id: "3", coinId: "solana", symbol: "SOL", condition: "above" as const, targetPrice: 200, email: "vishuyadav856@gmail.com", isActive: false, triggeredAt: null },
];

export const MARKET_STATS = {
  totalMarketCap: 2410000000000,
  totalVolume24h: 98600000000,
  btcDominance: 54.2,
  fearGreed: 72,
  fearGreedLabel: "Greed",
  marketCapChange: 1.8,
  volumeChange: -3.2,
  btcDomChange: 0.4,
  fearGreedChange: 6,
};

export function getCoin(id: string) {
  return COINS.find((c) => c.id === id);
}

// Compact currency formatter (handles negatives)
export function fmt(n: number, currency = "$") {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e12) return `${sign}${currency}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sign}${currency}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}${currency}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1) return `${sign}${currency}${a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${sign}${currency}${a.toFixed(4)}`;
}

// Full price (no compaction) for headline numbers
export function price(n: number, currency = "$") {
  if (n >= 1) return `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency}${n.toFixed(4)}`;
}

export function compactNum(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString("en-US");
}
