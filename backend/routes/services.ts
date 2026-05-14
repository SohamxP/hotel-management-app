import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createService,
  getServices,
  updateServiceStatus,
} from "../controllers/serviceController";

const router = express.Router();

router.get("/", verifyToken, getServices);
router.post("/", verifyToken, createService);
router.patch("/:id/status", verifyToken, updateServiceStatus);

export default router;