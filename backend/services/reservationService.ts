import { getDB } from "../db";
import * as reservationRepository from "../repositories/reservationRepository";
import { AppError } from "../errors/AppError";

type CreateReservationInput = {
  guestId: number;
  roomNumber: number;
  checkInDate: string;
  checkOutDate: string;
  paymentMode: string;
  specialRequest?: string;
};

export async function getAllReservations() {
  return reservationRepository.findAllReservations();
}

export async function createReservation(input: CreateReservationInput) {
  const {
    guestId,
    roomNumber,
    checkInDate,
    checkOutDate,
    paymentMode,
    specialRequest,
  } = input;

  if (
    !guestId ||
    !roomNumber ||
    !checkInDate ||
    !checkOutDate ||
    !paymentMode
  ) {
    throw new AppError(
      400,
      "guestId, roomNumber, checkInDate, checkOutDate, and paymentMode are required"
    );
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new AppError(
      400,
      "Invalid check-in or check-out date"
    );
  }

  if (checkOut <= checkIn) {
    throw new AppError(
      400,
      "Check-out date must be after check-in date"
    );
  }

  const db = await getDB();

  try {
    await db.exec("BEGIN IMMEDIATE TRANSACTION");

    const guest =
      await reservationRepository.findGuestById(
        guestId,
        db
      );

    if (!guest) {
      throw new AppError(404, "Guest not found");
    }

    const room =
      await reservationRepository.findRoomByNumber(
        roomNumber,
        db
      );

    if (!room) {
      throw new AppError(404, "Room not found");
    }

    if (room.AvailStatus === "Blocked") {
      throw new AppError(400, "Room is blocked and cannot be reserved");
    }

    const conflictingReservation =
      await reservationRepository.findConflictingReservation(
        roomNumber,
        checkInDate,
        checkOutDate,
        db
      );

    if (conflictingReservation) {
      throw new AppError(409, "Room is already reserved for the selected dates");
    }

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const totalPrice =
      nights * room.RatePerNight;

    const reservationId = Date.now();

    await reservationRepository.createReservation(
      {
        reservationId,
        guestId,
        roomNumber,
        checkInDate,
        checkOutDate,
        totalPrice,
        paymentMode,
        specialRequest: specialRequest || null,
      },
      db
    );

    await reservationRepository.addReservationGuest(
      reservationId,
      guestId,
      db
    );

    await db.exec("COMMIT");

    return {
      success: true,
      message: "Reservation created successfully",
      reservation: {
        reservationId,
        guestId,
        roomNumber,
        checkInDate,
        checkOutDate,
        nights,
        totalPrice,
        status: "Confirmed",
        paymentMode,
      },
    };
  } catch (error) {
    try {
      await db.exec("ROLLBACK");
    } catch {
      // Ignore rollback failure so the original error is preserved.
    }

    throw error;
  } finally {
    await db.close();
  }
}

export async function cancelReservation(reservationId: number) {
  if (!reservationId) {
    throw new AppError(400, "Reservation ID is required");
  }

  const reservation =
    await reservationRepository.findReservationById(reservationId);

  if (!reservation) {
    throw new AppError(404, "Reservation not found");
  }

  if (reservation.ReservStatus === "Cancelled") {
    throw new AppError(400, "Reservation is already cancelled");
  }

  await reservationRepository.cancelReservation(reservationId);

  return {
    success: true,
    message: "Reservation cancelled successfully",
    reservationId,
  };
}