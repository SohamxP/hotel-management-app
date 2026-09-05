import { Request, Response } from "express";
import * as reservationService from "../services/reservationService";
import { asyncHandler } from "../utils/asyncHandler";

export const getReservations = asyncHandler(
  async (req: Request, res: Response) => {
    const reservations =
      await reservationService.getAllReservations();

    res.json(reservations);
  }
);

export const createReservation = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await reservationService.createReservation(
        req.body
      );

    res.status(201).json(result);
  }
);

export const cancelReservation = asyncHandler(
  async (req: Request, res: Response) => {
    const reservationId = Number(req.params.id);

    const result =
      await reservationService.cancelReservation(
        reservationId
      );

    res.json(result);
  }
);