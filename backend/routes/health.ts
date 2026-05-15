import express from "express";
import { getDB } from "../db";

const router = express.Router();

function isConfigured(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

router.get("/", async (req, res) => {
  const startedAt = Date.now();

  try {
    const db = await getDB();
    await db.get("SELECT 1 AS ok");

    const openAiConfigured = isConfigured(process.env.OPENAI_API_KEY);
    const stripeConfigured =
      isConfigured(process.env.STRIPE_SECRET_KEY) &&
      (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_");

    res.json({
      success: true,
      status: "ok",
      message: "Hotel Management API is healthy",
      checkedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      port: Number(process.env.PORT) || 5001,
      checks: {
        api: {
          status: "ok",
        },
        database: {
          status: "ok",
          engine: "SQLite",
        },
        openai: {
          status: openAiConfigured ? "configured" : "missing_key",
          configured: openAiConfigured,
          model: process.env.OPENAI_MODEL || "not_set",
        },
        stripe: {
          status: stripeConfigured ? "configured" : "simulation_or_missing_key",
          configured: stripeConfigured,
          currency: process.env.STRIPE_CURRENCY || "usd",
          successUrlConfigured: isConfigured(process.env.STRIPE_SUCCESS_URL),
          cancelUrlConfigured: isConfigured(process.env.STRIPE_CANCEL_URL),
        },
      },
      features: [
        "Authentication",
        "Rooms",
        "Reservations",
        "Guests",
        "Services",
        "Reports",
        "AI Manager Briefing",
        "AI Action Center",
        "AI Revenue Engine",
        "AI Forecast Engine",
        "AI Quality Engine",
        "Billing",
        "Stripe Checkout",
      ],
    });
  } catch (error: any) {
    console.error("Health check failed:", error);

    res.status(500).json({
      success: false,
      status: "error",
      message: "Health check failed",
      checkedAt: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      error: error.message || "Unknown health check error",
    });
  }
});

export default router;