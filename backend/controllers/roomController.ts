import { Request, Response } from "express";
import * as roomService from "../services/roomService";

export async function getRooms(req: Request, res: Response) {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error("GET rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
}

export async function reserveRoom(req: Request, res: Response) {
  try {
    const { RoomNumber } = req.body;

    const result = await roomService.reserveRoom(RoomNumber);

    res.json(result);
  } catch (error: any) {
    console.error("Reserve room error:", error);

    res.status(error.status || 500).json({
      error: error.message || "Reservation failed",
    });
  }
}