import express from "express";
import { verifyToken } from "../middleware/auth";
import { getGuests, getGuestById } from "../controllers/guestController";

const router = express.Router();

router.get("/", verifyToken, getGuests);
router.get("/:id", verifyToken, getGuestById);

export default router;