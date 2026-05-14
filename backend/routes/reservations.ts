import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createReservation,
  getReservations,
  cancelReservation,
} from "../controllers/reservationController";

const router = express.Router();

router.get("/", verifyToken, getReservations);
router.post("/", verifyToken, createReservation);
router.patch("/:id/cancel", verifyToken, cancelReservation);

export default router;