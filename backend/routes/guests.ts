import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createGuestSchema } from "../schemas/guestSchema";
import {
  createGuest,
  getGuestById,
  getGuestReservations,
  getGuests,
} from "../controllers/guestController";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getGuests
);

router.post(
  "/",
  verifyToken,
  authorize("Manager", "Front Desk"),
  createGuest
);

router.get(
  "/:id/reservations",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getGuestReservations
);

router.get(
  "/:id",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getGuestById
);

export default router;