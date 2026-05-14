import express from "express";
import { getDB } from "../db";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const db = await getDB();
    const rooms = await db.all("SELECT * FROM Room");
    res.json(rooms);
  } catch (error) {
    console.error("GET rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.post("/reserve", verifyToken, async (req, res) => {
  try {
    const { RoomNumber } = req.body;

    if (!RoomNumber) {
      return res.status(400).json({ error: "RoomNumber is required" });
    }

    const db = await getDB();

    const room = await db.get(
      "SELECT * FROM Room WHERE RoomNumber = ?",
      [RoomNumber]
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.AvailStatus !== "Available") {
      return res.status(400).json({ error: "Room is not available" });
    }

    await db.run(
      "UPDATE Room SET AvailStatus = 'Reserved' WHERE RoomNumber = ?",
      [RoomNumber]
    );

    res.json({
      success: true,
      message: "Room reserved successfully",
      RoomNumber,
    });
  } catch (error) {
    console.error("Reserve room error:", error);
    res.status(500).json({ error: "Reservation failed" });
  }
});

export default router;