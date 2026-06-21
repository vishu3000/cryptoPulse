import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { priceAlerts } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import type { Alert } from "@crypto-pulse/shared";

export const alertsRouter = Router();

function rowToAlert(r: typeof priceAlerts.$inferSelect): Alert {
  return {
    id: r.id,
    userId: r.userId,
    coinId: r.coinId,
    condition: r.condition,
    targetPrice: Number(r.targetPrice),
    email: r.email,
    isActive: r.isActive,
    triggeredAt: r.triggeredAt?.toISOString() ?? null,
    lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

alertsRouter.get("/alerts", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, req.userId));
    res.json({ data: rows.map(rowToAlert) });
  } catch (err) {
    console.error("[GET /alerts]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to fetch alerts." } });
  }
});

alertsRouter.post("/alerts", requireAuth, async (req, res) => {
  try {
    const { coinId, condition, targetPrice, email } = req.body as {
      coinId?: string; condition?: "above" | "below"; targetPrice?: number; email?: string;
    };
    if (!coinId || !condition || targetPrice == null || !email) {
      res.status(400).json({ error: { code: "MISSING_FIELDS", message: "coinId, condition, targetPrice, and email are required." } });
      return;
    }
    if (!["above", "below"].includes(condition)) {
      res.status(400).json({ error: { code: "INVALID_CONDITION", message: "condition must be 'above' or 'below'." } });
      return;
    }
    const [row] = await db.insert(priceAlerts).values({
      userId: req.userId,
      coinId,
      condition,
      targetPrice: String(targetPrice),
      email,
    }).returning();
    res.status(201).json({ data: rowToAlert(row) });
  } catch (err) {
    console.error("[POST /alerts]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to create alert." } });
  }
});

alertsRouter.patch("/alerts/:id", requireAuth, async (req, res) => {
  try {
    const { isActive, targetPrice } = req.body as { isActive?: boolean; targetPrice?: number };
    const updates: Record<string, boolean | string> = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (targetPrice !== undefined) updates.targetPrice = String(targetPrice);

    const alertId = String(req.params.id);
    const [row] = await db.update(priceAlerts)
      .set(updates)
      .where(and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, req.userId)))
      .returning();

    if (!row) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Alert not found." } });
      return;
    }
    res.json({ data: rowToAlert(row) });
  } catch (err) {
    console.error("[PATCH /alerts]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to update alert." } });
  }
});

alertsRouter.delete("/alerts/:id", requireAuth, async (req, res) => {
  try {
    const alertId = String(req.params.id);
    await db.delete(priceAlerts).where(
      and(eq(priceAlerts.id, alertId), eq(priceAlerts.userId, req.userId))
    );
    res.status(204).send();
  } catch (err) {
    console.error("[DELETE /alerts]", err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Failed to delete alert." } });
  }
});
