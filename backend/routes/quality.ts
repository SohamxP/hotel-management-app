import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  generateGuestRecoveryDraft,
  generateQualityPlan,
  getQualityOverview,
} from "../controllers/qualityController";

const router = express.Router();

router.get("/overview", verifyToken, getQualityOverview);
router.post("/plan", verifyToken, generateQualityPlan);
router.post("/guest-recovery-draft", verifyToken, generateGuestRecoveryDraft);

export default router;