import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { marketsRouter } from "./routes/markets";
import { watchlistRouter } from "./routes/watchlist";
import { portfolioRouter } from "./routes/portfolio";
import { alertsRouter } from "./routes/alerts";
import { startAlertWorker } from "./workers/alertWorker";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", marketsRouter);
app.use("/api", watchlistRouter);
app.use("/api", portfolioRouter);
app.use("/api", alertsRouter);

app.listen(PORT, () => {
  console.log(`Crypto Pulse API running on :${PORT}`);
  startAlertWorker();
});
