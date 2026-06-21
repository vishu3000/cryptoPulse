import { Router } from "express";
import { getMarkets, getCoinDetail, getGlobal, convert } from "../services/marketData";

export const marketsRouter = Router();

marketsRouter.get("/markets", async (req, res) => {
  try {
    const vs = String(req.query.vs ?? "usd");
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const result = await getMarkets(vs, limit);
    res.json({ data: result.data, stale: result.stale });
  } catch (err) {
    console.error("[GET /markets]", err);
    res.status(502).json({ error: { code: "UPSTREAM_ERROR", message: "Failed to fetch market data." } });
  }
});

marketsRouter.get("/coins/:id", async (req, res) => {
  try {
    const vs = String(req.query.vs ?? "usd");
    const result = await getCoinDetail(req.params.id, vs);
    res.json({ data: result.data, stale: result.stale });
  } catch (err) {
    console.error(`[GET /coins/${req.params.id}]`, err);
    res.status(502).json({ error: { code: "UPSTREAM_ERROR", message: "Failed to fetch coin data." } });
  }
});

marketsRouter.get("/global", async (_req, res) => {
  try {
    const result = await getGlobal();
    res.json({ data: result.data, stale: result.stale });
  } catch (err) {
    console.error("[GET /global]", err);
    res.status(502).json({ error: { code: "UPSTREAM_ERROR", message: "Failed to fetch global stats." } });
  }
});

marketsRouter.get("/convert", async (req, res) => {
  try {
    const from = String(req.query.from ?? "BTC");
    const to = String(req.query.to ?? "USD");
    const amount = Number(req.query.amount ?? 1);
    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: { code: "INVALID_AMOUNT", message: "amount must be a positive number." } });
      return;
    }
    const result = await convert(from, to, amount);
    res.json({ data: result });
  } catch (err) {
    console.error("[GET /convert]", err);
    res.status(502).json({ error: { code: "UPSTREAM_ERROR", message: "Failed to convert." } });
  }
});
