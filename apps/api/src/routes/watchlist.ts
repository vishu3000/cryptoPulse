import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { watchlistItems } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { getMarkets } from "../services/marketData";

export const watchlistRouter = Router();

watchlistRouter.get("/watchlist", requireAuth, async (req, res) => {
  try {
    const items = await db.select().from(watchlistItems).where(eq(watchlistItems.userId, req.userId));
    const coinIds = items.map((i) => i.coinId);
    if (coinIds.length === 0) {
      res.json({ data: [] });
      return;
    }
    const { data: allCoins } = await getMarkets("usd", 50);
    const coins = allCoins.filter((c) => coinIds.includes(c.id));
    res.json({ data: coins });
  } catch (err) {
    console.error("[GET /watchlist]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to fetch watchlist." } });
  }
});

watchlistRouter.post("/watchlist", requireAuth, async (req, res) => {
  try {
    const { coinId } = req.body as { coinId?: string };
    if (!coinId) {
      res.status(400).json({ error: { code: "MISSING_FIELD", message: "coinId is required." } });
      return;
    }
    await db.insert(watchlistItems).values({ userId: req.userId, coinId }).onConflictDoNothing();
    res.status(201).json({ data: { coinId } });
  } catch (err) {
    console.error("[POST /watchlist]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to add to watchlist." } });
  }
});

watchlistRouter.delete("/watchlist/:coinId", requireAuth, async (req, res) => {
  try {
    const coinId = String(req.params.coinId);
    await db.delete(watchlistItems).where(
      and(eq(watchlistItems.userId, req.userId), eq(watchlistItems.coinId, coinId))
    );
    res.status(204).send();
  } catch (err) {
    console.error("[DELETE /watchlist]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to remove from watchlist." } });
  }
});
