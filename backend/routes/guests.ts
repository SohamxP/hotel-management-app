import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createGuest,
  getGuestById,
  getGuests,
} from "../controllers/guestController";

const router = express.Router();

router.get("/", verifyToken, getGuests);
router.get("/:id", verifyToken, getGuestById);
router.post("/", verifyToken, createGuest);

export default router;