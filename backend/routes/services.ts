import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import {
  createService,
  getServices,
  updateServiceStatus,
} from "../controllers/serviceController";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getServices
);

router.post(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  createService
);

router.patch(
  "/:id/status",
  verifyToken,
  authorize("Manager", "Front Desk"),
  updateServiceStatus
);

export default router;