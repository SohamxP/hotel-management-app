import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import {
  generateGuestRecoveryDraft,
  generateQualityPlan,
  getQualityOverview,
} from "../controllers/qualityController";

const router = express.Router();

router.get(
  "/overview",
  verifyToken,
  authorize("Manager"),
  getQualityOverview
);

router.post(
  "/plan",
  verifyToken,
  authorize("Manager"),
  generateQualityPlan
);

router.post(
  "/guest-recovery-draft",
  verifyToken,
  authorize("Manager"),
  generateGuestRecoveryDraft
);

export default router;