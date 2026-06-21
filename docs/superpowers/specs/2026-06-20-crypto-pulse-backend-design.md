# Crypto Pulse — Backend Design

**Date:** 2026-06-20
**Status:** Approved design → ready for implementation plan
**Scope:** Backend for the existing Crypto Pulse frontend (Next.js, neon theme, 8 pages already built with static data). This spec covers the API service, database, auth integration, external-data layer, real-time updates, and price-alert emails.

---

## 1. Goals & Non-Goals

**Goals**
- Persist per-user **watchlist**, **portfolio holdings**, and **price alerts**.
- Authenticate users via the existing **`vi-auth-sdk`** (separate authSDK service) — Crypto Pulse never stores passwords.
- Serve **live market data** (CoinGecko + Frankfurter) through our own API with caching.
- **Real-time prices**: CoinCap WebSocket drives animated tickers; polling refreshes tables/stats.
- Email users when a **price alert** crosses its threshold.

**Non-Goals**
- No real trading/custody (the "Buy" button stays a no-op CTA).
- No social/sharing features.
- No mobile-native app (responsive web only).
- Not modifying the authSDK source — it is consumed as-is via its server + SDK.

---

## 2. Architecture — Option A (Separate Services)

```
┌────────────────────┐    cookie/session    ┌─────────────────────┐
│  Next.js  :3000    │ ───────────────────► │  authSDK server     │
│  - UI (neon theme) │ ◄─────────────────── │  :3002 (Hono)       │
│  - vi-auth-sdk     │                      │  Postgres + Redis   │
│  - server actions  │                      └─────────────────────┘
│  - CoinCap WS (browser)                              ▲
└─────────┬──────────┘                                 │ sk_ key
          │ REST /api/*                                 │ /v1/auth/me
          ▼                                             │
┌─────────────────────────────────────────────┐        │
│  Crypto Pulse API  :4000 (Express)           │────────┘
│  - authMiddleware (validates session)        │
│  - watchlist / portfolio / alerts CRUD       │
│  - marketData service (CoinGecko/Frankfurter)│
│  - alert worker (cron + Nodemailer)          │
│  - Drizzle ORM                               │
└──────────┬───────────────────┬───────────────┘
           ▼                    ▼
   ┌────────────────┐   ┌──────────────────┐
   │ Postgres :5432 │   │ Mailpit :8025    │
   │ schema: crypto │   │ (dev email)      │
   └────────────────┘   └──────────────────┘
```

**Ports.** authSDK's README defaults its server to `:3000`, which collides with our frontend. We run authSDK with `PORT=3002`. Final map: Next `:3000`, API `:4000`, authSDK `:3002`, Postgres `:5432`, Redis `:6379`, Mailpit UI `:8025`.

**Monorepo layout (pnpm workspaces):**
```
cryptoPulse/
├── apps/
│   ├── web/          ← existing Next.js app (move src/ here)
│   └── api/          ← new Express + Drizzle service
├── packages/
│   └── shared/       ← shared TS types (Coin, Holding, Alert, ApiResponse)
├── docker-compose.yml
└── .env.example
```
The frontend currently lives at repo root `src/`. Phase 1 moves it under `apps/web/` and adds the workspace. (If the move proves disruptive, fallback: keep web at root and add `api/` as a sibling — same runtime topology.)

---

## 3. Auth Integration (vi-auth-sdk bridge)

Crypto Pulse is a **tenant** of the authSDK. It holds:
- `pk_test_…` publishable key → used in the browser/Next for login/signup forms.
- `sk_test_…` secret key → used server-side (Next server actions + Express) to validate sessions.

**Frontend**
- `lib/auth.ts` exports a configured `AuthClient`.
- Login/Signup pages call `auth.login()` / `auth.signup()`; on `MfaRequiredError`, route to an MFA step (SDK already supports `submitMfaChallenge`).
- **Next middleware** (`middleware.ts`) protects `(dashboard)` + `(dashboard)/coin/*`: it forwards the session cookie to `auth.me()`; on failure → redirect `/login`. `(auth)` routes stay public.

**Backend**
- `authMiddleware` (Express): reads the session cookie from the request, instantiates `AuthClient({ secretKey, getCookie })`, calls `me()`. Success → `req.userId`. Failure → `401`.
- Every `/api/*` data route (except `/api/health` and read-only market endpoints) requires `req.userId` and scopes all DB queries by it.

**Boundary:** authSDK owns identity, sessions, MFA, password reset. Crypto Pulse owns crypto data keyed by `user_id` (a UUID string from authSDK). No foreign-key across services — `user_id` is stored as an indexed text column.

---

## 4. Database (Postgres, `crypto` schema, Drizzle ORM)

One Postgres instance; authSDK uses its schema, we use `crypto`.

```
crypto.watchlist_items
  id            uuid pk default gen_random_uuid()
  user_id       text not null            -- authSDK user id
  coin_id       text not null            -- e.g. "bitcoin"
  created_at    timestamptz default now()
  UNIQUE (user_id, coin_id)
  INDEX (user_id)

crypto.portfolio_holdings
  id            uuid pk
  user_id       text not null
  coin_id       text not null
  quantity      numeric(38,18) not null
  avg_buy_price numeric(20,8)  not null  -- USD
  created_at    timestamptz default now()
  updated_at    timestamptz default now()
  INDEX (user_id)

crypto.price_alerts
  id               uuid pk
  user_id          text not null
  coin_id          text not null
  condition        text not null         -- 'above' | 'below'
  target_price     numeric(20,8) not null -- USD
  email            text not null
  is_active        boolean default true
  triggered_at     timestamptz null
  last_notified_at timestamptz null      -- debounce
  created_at       timestamptz default now()
  INDEX (user_id)
  INDEX (is_active) WHERE is_active
```

Migrations via `drizzle-kit`. A `seed` script inserts demo rows for the current dev user so the UI isn't empty.

---

## 5. API Surface (`:4000`)

All JSON. Envelope: `{ data }` on success, `{ error: { code, message } }` on failure.

**Market data (public, cached)**
```
GET /api/markets?vs=usd&limit=20      → Coin[] (list + sparkline + 24h/7d)
GET /api/coins/:id?vs=usd             → CoinDetail (stats, OHLC, sparkline)
GET /api/convert?from=BTC&to=USD&amount=1   → { rate, result } (Frankfurter for fiat)
GET /api/global                       → { totalMarketCap, volume, btcDominance, fearGreed }
```

**Watchlist (auth)**
```
GET    /api/watchlist                 → Coin[] (joined w/ live prices)
POST   /api/watchlist  { coinId }     → 201
DELETE /api/watchlist/:coinId         → 204
```

**Portfolio (auth)**
```
GET    /api/portfolio                 → Holding[] (+ live value, pnl, allocation)
POST   /api/portfolio  { coinId, quantity, avgBuyPrice }
PATCH  /api/portfolio/:id  { quantity?, avgBuyPrice? }
DELETE /api/portfolio/:id
```

**Alerts (auth)**
```
GET    /api/alerts                    → Alert[]
POST   /api/alerts  { coinId, condition, targetPrice, email }
PATCH  /api/alerts/:id { isActive?, targetPrice? }
DELETE /api/alerts/:id
```

**Health:** `GET /api/health → { status, db, upstream }`

---

## 6. External-Data Layer

`services/marketData.ts` wraps upstreams behind one interface so routes never call them directly.

- **CoinGecko** (`/coins/markets`, `/coins/:id`, `/global`) — no auth, CORS-ok, but rate-limited (~10–30 req/min free). Every call goes through a **TTL cache** (Redis, fallback in-memory) keyed by URL+params:
  - markets/global: 30s TTL
  - coin detail: 30s TTL
- **Frankfurter** (`/latest?from=USD&to=EUR…`) — fiat FX for the currency switcher + Convert widget; 1h TTL.
- Crypto→crypto conversion in the Convert widget is computed from USD prices (CoinGecko); Frankfurter only does fiat legs.
- The frontend always hits *our* API, never upstream — single choke point for caching, CORS, and the future live layer.

**Failure handling:** on upstream error, serve last cached value if present (stale-while-error) and flag `stale: true`; otherwise `502` with a typed error the UI shows as a non-blocking toast.

---

## 7. Real-Time Prices

**Tickers (WebSocket):** the browser opens a CoinCap WS (`wss://ws.coincap.io/prices?assets=bitcoin,ethereum,…`) for the visible symbols. Incoming ticks feed the existing `AnimatedNumber` flash + the ticker strip. A `usePriceStream` hook manages the socket, reconnect/backoff, and maps CoinCap ids → our coin ids. Pure client-side; no backend involvement.

**Tables/stats (polling):** `usePolling(fetcher, 15000)` re-fetches `/api/markets`, `/api/global`, watchlist, and portfolio value every ~15s (pauses when tab hidden via `visibilitychange`). Keeps cache pressure on CoinGecko low (1 request per interval, shared via server cache).

**Reconciliation:** CoinCap WS gives the live "current price" for animation; the authoritative numbers (market cap, %change, volume) come from the polled CoinGecko snapshot. The UI shows WS price on top of the last polled row, so they stay visually consistent.

---

## 8. Price-Alert Worker

A `node-cron` job in the API process, every 60s:
1. Load all `is_active = true` alerts (single query).
2. Fetch current prices once (reuse marketData cache) for the distinct `coin_id`s.
3. For each alert where `above`→price ≥ target, or `below`→price ≤ target:
   - Skip if `last_notified_at` within the last 6h (debounce).
   - Send email via **Nodemailer → Mailpit** (dev SMTP `:1025`), templated ("BTC crossed $70,000").
   - Set `triggered_at` (first cross) + `last_notified_at = now()`.
4. Errors are logged per-alert; one failure doesn't abort the batch.

Production email swap (SES/Resend) is a config change, out of scope here.

---

## 9. Frontend Wiring Changes

- Replace `src/lib/staticData.ts` imports with `src/lib/api.ts` (typed fetch client) + the `usePriceStream` / `usePolling` hooks.
- Server Components fetch initial data from `:4000`; mutations go through Server Actions (`addHolding`, `toggleAlert`, `addToWatchlist`, …) that call the API with the forwarded cookie.
- Shared types move to `packages/shared` and are imported by both `web` and `api`.
- Keep the static data as a **fixture** for tests/storybook and for graceful empty states.

---

## 10. Testing

- **API unit:** marketData cache (hit/miss/stale), alert threshold logic (above/below/debounce), auth middleware (valid/invalid/expired cookie) with the authSDK client mocked.
- **API integration:** CRUD routes against a real test Postgres (Drizzle migrations applied), userId injected via a stubbed authMiddleware.
- **Frontend:** hook tests for `usePriceStream` (mock WS) and `usePolling`; a smoke test that each page renders against a mocked api client.
- Upstream calls (CoinGecko/Frankfurter/CoinCap) are always mocked in tests — no live network.

---

## 11. Build Phases

1. **Workspace + DB**: pnpm workspaces, `apps/api` Express skeleton, docker-compose (Postgres), Drizzle schema + migrations + seed.
2. **Auth bridge**: register tenant, env keys, Express `authMiddleware`, Next `middleware.ts`, wire real login/signup.
3. **Market data**: `marketData` service + cache, `/api/markets`, `/api/coins/:id`, `/api/global`, `/api/convert`.
4. **CRUD**: watchlist, portfolio, alerts routes + Drizzle queries.
5. **Alert worker**: cron + Nodemailer + Mailpit.
6. **Frontend swap**: `lib/api.ts`, server actions, replace static data, empty/error states.
7. **Real-time**: `usePriceStream` (CoinCap WS) + `usePolling`, hook into tickers/tables.
8. **Tests + polish**: the test matrix above, health check, README/run docs.

---

## 12. Risks & Mitigations

- **CoinGecko rate limits** → server-side TTL cache + single polling interval shared across clients; stale-while-error fallback.
- **CoinCap id mismatch** → explicit id map in `shared`; unknown ids fall back to polled price only.
- **authSDK port/tenant setup friction** → documented `.env.example` + a `pnpm setup:auth` helper; health check verifies the auth round-trip on boot.
- **Monorepo move breaking the running app** → do the move in Phase 1 behind a clean commit; fallback topology (web at root) documented in §2.
- **Numeric precision** (crypto quantities) → `numeric` columns + integer-safe math, never JS floats for stored values.
