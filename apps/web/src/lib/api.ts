import type { Coin, CoinDetail, Holding, Alert, MarketStats, ConvertResult } from "@crypto-pulse/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return (json as { data: T }).data;
}

async function mutate<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return (json as { data: T }).data;
}

// ── Market data ───────────────────────────────────────────────────────────────
export const getMarkets = (limit = 20) => get<Coin[]>(`/markets?limit=${limit}`);
export const getCoinDetail = (id: string) => get<CoinDetail>(`/coins/${id}`);
export const getGlobal = () => get<MarketStats>("/global");
export const convert = (from: string, to: string, amount: number) =>
  get<ConvertResult>(`/convert?from=${from}&to=${to}&amount=${amount}`);

// ── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlist = () => get<Coin[]>("/watchlist");
export const addToWatchlist = (coinId: string) => mutate<{ coinId: string }>("POST", "/watchlist", { coinId });
export const removeFromWatchlist = (coinId: string) => mutate<void>("DELETE", `/watchlist/${coinId}`);

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const getPortfolio = () => get<Holding[]>("/portfolio");
export const addHolding = (coinId: string, quantity: number, avgBuyPrice: number) =>
  mutate<Holding>("POST", "/portfolio", { coinId, quantity, avgBuyPrice });
export const updateHolding = (id: string, data: Partial<{ quantity: number; avgBuyPrice: number }>) =>
  mutate<Holding>("PATCH", `/portfolio/${id}`, data);
export const deleteHolding = (id: string) => mutate<void>("DELETE", `/portfolio/${id}`);

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getAlerts = () => get<Alert[]>("/alerts");
export const createAlert = (coinId: string, condition: "above" | "below", targetPrice: number, email: string) =>
  mutate<Alert>("POST", "/alerts", { coinId, condition, targetPrice, email });
export const updateAlert = (id: string, data: Partial<{ isActive: boolean; targetPrice: number }>) =>
  mutate<Alert>("PATCH", `/alerts/${id}`, data);
export const deleteAlert = (id: string) => mutate<void>("DELETE", `/alerts/${id}`);

// Re-export types so pages only need one import
export type { Coin, CoinDetail, Holding, Alert, MarketStats };
