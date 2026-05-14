import express from "express";
import { verifyToken } from "../middleware/auth";
import { getRooms, reserveRoom } from "../controllers/roomController";

const router = express.Router();

router.get("/", verifyToken, getRooms);
router.post("/reserve", verifyToken, reserveRoom);

export default router;