import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createGuest,
  getGuestById,
  getGuestReservations,
  getGuests,
} from "../controllers/guestController";

const router = express.Router();

router.get("/", verifyToken, getGuests);
router.post("/", verifyToken, createGuest);
router.get("/:id/reservations", verifyToken, getGuestReservations);
router.get("/:id", verifyToken, getGuestById);

export default router;