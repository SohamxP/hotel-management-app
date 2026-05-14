import { Request, Response } from "express";
import * as guestService from "../services/guestService";

export async function getGuests(req: Request, res: Response) {
  try {
    const guests = await guestService.getAllGuests();
    res.json(guests);
  } catch (error) {
    console.error("GET guests error:", error);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
}

export async function getGuestById(req: Request, res: Response) {
  try {
    const guestId = Number(req.params.id);
    const guest = await guestService.getGuestById(guestId);
    res.json(guest);
  } catch (error: any) {
    console.error("GET guest error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch guest",
    });
  }
}