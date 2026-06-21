import { pgTable, pgSchema, uuid, text, boolean, numeric, timestamp, unique, index } from "drizzle-orm/pg-core";

export const cryptoSchema = pgSchema("crypto");

export const watchlistItems = cryptoSchema.table(
  "watchlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    coinId: text("coin_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.userId, t.coinId),
    index("watchlist_user_idx").on(t.userId),
  ]
);

export const portfolioHoldings = cryptoSchema.table(
  "portfolio_holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    coinId: text("coin_id").notNull(),
    quantity: numeric("quantity", { precision: 38, scale: 18 }).notNull(),
    avgBuyPrice: numeric("avg_buy_price", { precision: 20, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("portfolio_user_idx").on(t.userId)]
);

export const priceAlerts = cryptoSchema.table(
  "price_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    coinId: text("coin_id").notNull(),
    condition: text("condition").notNull().$type<"above" | "below">(),
    targetPrice: numeric("target_price", { precision: 20, scale: 8 }).notNull(),
    email: text("email").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("alerts_user_idx").on(t.userId),
    index("alerts_active_idx").on(t.isActive),
  ]
);

export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type NewWatchlistItem = typeof watchlistItems.$inferInsert;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type NewPortfolioHolding = typeof portfolioHoldings.$inferInsert;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type NewPriceAlert = typeof priceAlerts.$inferInsert;
