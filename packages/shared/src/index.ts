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

export type CoinDetail = Coin;

export type Holding = {
  id: string;
  userId: string;
  coinId: string;
  quantity: number;
  avgBuyPrice: number;
  createdAt: string;
  updatedAt: string;
  // computed fields (joined from market data)
  currentPrice?: number;
  currentValue?: number;
  pnl?: number;
  pnlPct?: number;
  allocation?: number;
};

export type WatchlistItem = {
  id: string;
  userId: string;
  coinId: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  userId: string;
  coinId: string;
  symbol?: string;
  condition: "above" | "below";
  targetPrice: number;
  email: string;
  isActive: boolean;
  triggeredAt: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
};

export type MarketStats = {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  fearGreed: number;
  fearGreedLabel: string;
  marketCapChange: number;
  volumeChange: number;
  btcDomChange: number;
  fearGreedChange: number;
};

export type ConvertResult = {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
};

export type ApiSuccess<T> = { data: T; stale?: boolean };
export type ApiError = { error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
