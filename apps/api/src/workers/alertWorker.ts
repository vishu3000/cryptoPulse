import cron from "node-cron";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { priceAlerts } from "../db/schema";
import { getPricesForCoins } from "../services/marketData";

const DEBOUNCE_MS = 6 * 60 * 60 * 1000; // 6 hours

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
});

async function runAlertCheck() {
  try {
    const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.isActive, true));
    if (alerts.length === 0) return;

    const coinIds = [...new Set(alerts.map((a) => a.coinId))];
    const prices = await getPricesForCoins(coinIds);
    const now = new Date();

    for (const alert of alerts) {
      const price = prices[alert.coinId];
      if (price == null) continue;

      const target = Number(alert.targetPrice);
      const triggered = alert.condition === "above" ? price >= target : price <= target;
      if (!triggered) continue;

      if (alert.lastNotifiedAt) {
        const elapsed = now.getTime() - alert.lastNotifiedAt.getTime();
        if (elapsed < DEBOUNCE_MS) continue;
      }

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? "alerts@cryptopulse.dev",
          to: alert.email,
          subject: `Price Alert: ${alert.coinId.toUpperCase()} ${alert.condition === "above" ? "exceeded" : "fell below"} $${target.toLocaleString()}`,
          html: `
            <h2>Crypto Pulse Price Alert</h2>
            <p><strong>${alert.coinId.toUpperCase()}</strong> is now at <strong>$${price.toLocaleString()}</strong>.</p>
            <p>Your alert: ${alert.condition === "above" ? "above" : "below"} $${target.toLocaleString()}</p>
            <hr/>
            <small>Manage your alerts at <a href="${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/alerts">Crypto Pulse</a></small>
          `,
        });
        console.log(`[alertWorker] Sent alert for ${alert.coinId} to ${alert.email}`);
      } catch (mailErr) {
        console.error(`[alertWorker] Failed to send mail for alert ${alert.id}:`, mailErr);
        continue;
      }

      await db.update(priceAlerts)
        .set({
          triggeredAt: alert.triggeredAt ?? now,
          lastNotifiedAt: now,
        })
        .where(eq(priceAlerts.id, alert.id));
    }
  } catch (err) {
    console.error("[alertWorker] Check failed:", err);
  }
}

export function startAlertWorker() {
  cron.schedule("* * * * *", runAlertCheck);
  console.log("[alertWorker] Started — checking every 60s");
}
