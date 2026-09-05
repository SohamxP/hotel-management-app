import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import {
  getRooms,
  getAvailableRooms,
} from "../controllers/roomController";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getRooms
);

router.get(
  "/available",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getAvailableRooms
);

export default router;