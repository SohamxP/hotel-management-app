import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import { getRooms, reserveRoom } from "../controllers/roomController";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getRooms
);

router.post(
  "/reserve",
  verifyToken,
  authorize("Manager", "Front Desk"),
  reserveRoom
);

export default router;