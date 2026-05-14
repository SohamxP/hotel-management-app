import { Request, Response } from "express";
import * as reservationService from "../services/reservationService";

export async function getReservations(req: Request, res: Response) {
  try {
    const reservations = await reservationService.getAllReservations();
    res.json(reservations);
  } catch (error) {
    console.error("GET reservations error:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
}

export async function createReservation(req: Request, res: Response) {
  try {
    const result = await reservationService.createReservation(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Create reservation error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to create reservation",
    });
  }
}

export async function cancelReservation(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id);

    const result = await reservationService.cancelReservation(reservationId);

    res.json(result);
  } catch (error: any) {
    console.error("Cancel reservation error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to cancel reservation",
    });
  }
}