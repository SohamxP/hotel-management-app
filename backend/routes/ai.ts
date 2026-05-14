import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  askAI,
  createActionPlan,
  createManagerBriefing,
  getActions,
  getAIStatus,
  getInsights,
  testAI,
} from "../controllers/aiController";

const router = express.Router();

router.get("/status", verifyToken, getAIStatus);
router.get("/test", verifyToken, testAI);
router.get("/insights", verifyToken, getInsights);
router.get("/actions", verifyToken, getActions);
router.post("/ask", verifyToken, askAI);
router.post("/briefing", verifyToken, createManagerBriefing);
router.post("/action-plan", verifyToken, createActionPlan);

export default router;