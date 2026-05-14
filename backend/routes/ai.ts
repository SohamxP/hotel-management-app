import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  askAI,
  generateBriefing,
  getInsights,
  getOpenAIStatus,
  testOpenAI,
} from "../controllers/aiController";

const router = express.Router();

router.get("/insights", verifyToken, getInsights);
router.get("/status", verifyToken, getOpenAIStatus);
router.get("/test", verifyToken, testOpenAI);
router.post("/ask", verifyToken, askAI);
router.post("/briefing", verifyToken, generateBriefing);

export default router;