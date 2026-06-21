import "dotenv/config";
import { db, pool } from "./client";
import { watchlistItems, portfolioHoldings, priceAlerts } from "./schema";

const DEV_USER_ID = "dev-user-001";

async function main() {
  console.log("Seeding dev data…");

  await db.delete(priceAlerts);
  await db.delete(portfolioHoldings);
  await db.delete(watchlistItems);

  await db.insert(watchlistItems).values([
    { userId: DEV_USER_ID, coinId: "bitcoin" },
    { userId: DEV_USER_ID, coinId: "solana" },
    { userId: DEV_USER_ID, coinId: "ethereum" },
    { userId: DEV_USER_ID, coinId: "chainlink" },
  ]);

  await db.insert(portfolioHoldings).values([
    { userId: DEV_USER_ID, coinId: "bitcoin", quantity: "1.1742", avgBuyPrice: "48210" },
    { userId: DEV_USER_ID, coinId: "ethereum", quantity: "14.76", avgBuyPrice: "2890" },
    { userId: DEV_USER_ID, coinId: "solana", quantity: "169.42", avgBuyPrice: "98.4" },
    { userId: DEV_USER_ID, coinId: "chainlink", quantity: "890", avgBuyPrice: "21.1" },
    { userId: DEV_USER_ID, coinId: "dogecoin", quantity: "44200", avgBuyPrice: "0.142" },
  ]);

  await db.insert(priceAlerts).values([
    { userId: DEV_USER_ID, coinId: "bitcoin", condition: "above", targetPrice: "70000", email: "vishuyadav856@gmail.com", isActive: true },
    { userId: DEV_USER_ID, coinId: "ethereum", condition: "below", targetPrice: "3200", email: "vishuyadav856@gmail.com", isActive: true },
    { userId: DEV_USER_ID, coinId: "solana", condition: "above", targetPrice: "200", email: "vishuyadav856@gmail.com", isActive: false },
  ]);

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
