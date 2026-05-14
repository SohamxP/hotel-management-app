import express from "express";
import { getDB } from "../db";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

router.get("/room-type-summary", verifyToken, async (req, res) => {
  try {
    const db = await getDB();

    const result = await db.all(`
      SELECT 
        RoomType,
        COUNT(*) AS count,
        ROUND(AVG(RatePerNight), 2) AS avgRate
      FROM Room
      GROUP BY RoomType
      ORDER BY count DESC
    `);

    res.json(result);
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export default router;