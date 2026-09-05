import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createReservationSchema } from "../schemas/reservationSchema";
import {
  createReservation,
  getReservations,
  cancelReservation,
} from "../controllers/reservationController";

const router = express.Router();
router.get(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getReservations
);

router.post(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  validateBody(createReservationSchema),
  createReservation
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorize("Manager", "Front Desk"),
  cancelReservation
);

export default router;