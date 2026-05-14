import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  askAI,
  createActionPlan,
  createGuestRecoveryDrafts,
  createManagerBriefing,
  createRevenuePlan,
  getActions,
  getAIStatus,
  getInsights,
  getRevenue,
  testAI,
} from "../controllers/aiController";

const router = express.Router();

router.get("/status", verifyToken, getAIStatus);
router.get("/test", verifyToken, testAI);
router.get("/insights", verifyToken, getInsights);
router.get("/actions", verifyToken, getActions);
router.get("/revenue", verifyToken, getRevenue);
router.post("/ask", verifyToken, askAI);
router.post("/briefing", verifyToken, createManagerBriefing);
router.post("/action-plan", verifyToken, createActionPlan);
router.post("/guest-recovery", verifyToken, createGuestRecoveryDrafts);
router.post("/revenue-plan", verifyToken, createRevenuePlan);

export default router;