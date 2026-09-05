import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import {
  askAI,
  createActionPlan,
  createForecastPlan,
  createGuestRecoveryDrafts,
  createManagerBriefing,
  createRevenuePlan,
  getActions,
  getAIStatus,
  getForecast,
  getInsights,
  getRevenue,
  testAI,
} from "../controllers/aiController";

const router = express.Router();
router.use(
  verifyToken,
  authorize("Manager")
);
router.get("/status", getAIStatus);
router.get("/test", testAI);
router.get("/insights", getInsights);
router.get("/actions", getActions);
router.get("/revenue", getRevenue);
router.get("/forecast", getForecast);

router.post("/ask", askAI);
router.post("/briefing", createManagerBriefing);
router.post("/action-plan", createActionPlan);
router.post(
  "/guest-recovery",
  createGuestRecoveryDrafts
);
router.post("/revenue-plan", createRevenuePlan);
router.post("/forecast-plan", createForecastPlan);

export default router;