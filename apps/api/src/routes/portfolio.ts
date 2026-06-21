import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { portfolioHoldings } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { getPricesForCoins } from "../services/marketData";
import type { Holding } from "@crypto-pulse/shared";

export const portfolioRouter = Router();

portfolioRouter.get("/portfolio", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, req.userId));
    if (rows.length === 0) {
      res.json({ data: [] });
      return;
    }

    const prices = await getPricesForCoins(rows.map((r) => r.coinId));
    const totalValue = rows.reduce((sum, r) => {
      const price = prices[r.coinId] ?? 0;
      return sum + Number(r.quantity) * price;
    }, 0);

    const holdings: Holding[] = rows.map((r) => {
      const currentPrice = prices[r.coinId] ?? 0;
      const currentValue = Number(r.quantity) * currentPrice;
      const costBasis = Number(r.quantity) * Number(r.avgBuyPrice);
      const pnl = currentValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return {
        id: r.id,
        userId: r.userId,
        coinId: r.coinId,
        quantity: Number(r.quantity),
        avgBuyPrice: Number(r.avgBuyPrice),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        currentPrice,
        currentValue,
        pnl,
        pnlPct,
        allocation: totalValue > 0 ? (currentValue / totalValue) * 100 : 0,
      };
    });

    res.json({ data: holdings });
  } catch (err) {
    console.error("[GET /portfolio]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to fetch portfolio." } });
  }
});

portfolioRouter.post("/portfolio", requireAuth, async (req, res) => {
  try {
    const { coinId, quantity, avgBuyPrice } = req.body as { coinId?: string; quantity?: number; avgBuyPrice?: number };
    if (!coinId || quantity == null || avgBuyPrice == null) {
      res.status(400).json({ error: { code: "MISSING_FIELDS", message: "coinId, quantity, and avgBuyPrice are required." } });
      return;
    }
    const [row] = await db.insert(portfolioHoldings).values({
      userId: req.userId,
      coinId,
      quantity: String(quantity),
      avgBuyPrice: String(avgBuyPrice),
    }).returning();
    res.status(201).json({ data: row });
  } catch (err) {
    console.error("[POST /portfolio]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to add holding." } });
  }
});

portfolioRouter.patch("/portfolio/:id", requireAuth, async (req, res) => {
  try {
    const { quantity, avgBuyPrice } = req.body as { quantity?: number; avgBuyPrice?: number };
    const updates: Record<string, string | Date> = { updatedAt: new Date() };
    if (quantity != null) updates.quantity = String(quantity);
    if (avgBuyPrice != null) updates.avgBuyPrice = String(avgBuyPrice);

    const holdingId = String(req.params.id);
    const [row] = await db.update(portfolioHoldings)
      .set(updates)
      .where(and(eq(portfolioHoldings.id, holdingId), eq(portfolioHoldings.userId, req.userId)))
      .returning();

    if (!row) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Holding not found." } });
      return;
    }
    res.json({ data: row });
  } catch (err) {
    console.error("[PATCH /portfolio]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to update holding." } });
  }
});

portfolioRouter.delete("/portfolio/:id", requireAuth, async (req, res) => {
  try {
    const holdingId = String(req.params.id);
    await db.delete(portfolioHoldings).where(
      and(eq(portfolioHoldings.id, holdingId), eq(portfolioHoldings.userId, req.userId))
    );
    res.status(204).send();
  } catch (err) {
    console.error("[DELETE /portfolio]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to delete holding." } });
  }
});
