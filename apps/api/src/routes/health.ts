import { Router } from "express";
import { pool } from "../db/client";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let db = "ok";
  try {
    await pool.query("SELECT 1");
  } catch {
    db = "error";
  }

  const status = db === "ok" ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({ status, db });
});
