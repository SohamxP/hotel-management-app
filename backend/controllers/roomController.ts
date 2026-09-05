import { Request, Response } from "express";
import * as roomService from "../services/roomService";

export async function getRooms(req: Request, res: Response) {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error("GET rooms error:", error);

    res.status(500).json({
      error: "Failed to fetch rooms",
    });
  }
}

export async function getAvailableRooms(
  req: Request,
  res: Response
) {
  try {
    const checkIn = String(
      req.query.checkIn || ""
    );

    const checkOut = String(
      req.query.checkOut || ""
    );

    const rooms =
      await roomService.getAvailableRooms(
        checkIn,
        checkOut
      );

    res.json(rooms);
  } catch (error: any) {
    console.error(
      "GET available rooms error:",
      error
    );

    res.status(error.status || 500).json({
      error:
        error.message ||
        "Failed to fetch available rooms",
    });
  }
}