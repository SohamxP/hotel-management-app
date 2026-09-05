import { prisma } from "../prismaClient";
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

export async function createReservation(
  input: CreateReservationInput
) {
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

  const reservationId = Date.now();

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const guest =
          await reservationRepository.findGuestById(
            guestId,
            tx
          );

        if (!guest) {
          throw new AppError(
            404,
            "Guest not found"
          );
        }

        const room =
          await reservationRepository.findRoomByNumber(
            roomNumber,
            tx
          );

        if (!room) {
          throw new AppError(
            404,
            "Room not found"
          );
        }

        if (room.AvailStatus === "Blocked") {
          throw new AppError(
            400,
            "Room is blocked and cannot be reserved"
          );
        }

        const conflictingReservation =
          await reservationRepository.findConflictingReservation(
            roomNumber,
            checkInDate,
            checkOutDate,
            tx
          );

        if (conflictingReservation) {
          throw new AppError(
            409,
            "Room is already reserved for the selected dates"
          );
        }

        const totalPrice =
          nights * room.RatePerNight;

        await reservationRepository.createReservation(
          {
            reservationId,
            guestId,
            roomNumber,
            checkInDate,
            checkOutDate,
            totalPrice,
            paymentMode,
            specialRequest:
              specialRequest || null,
          },
          tx
        );

        await reservationRepository.addReservationGuest(
          reservationId,
          guestId,
          tx
        );

        return {
          totalPrice,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return {
      success: true,
      message:
        "Reservation created successfully",
      reservation: {
        reservationId,
        guestId,
        roomNumber,
        checkInDate,
        checkOutDate,
        nights,
        totalPrice: result.totalPrice,
        status: "Confirmed",
        paymentMode,
      },
    };
  } catch (error: any) {
    if (error?.code === "P2034") {
      throw new AppError(
        409,
        "Reservation conflict detected. Please retry the booking."
      );
    }

    throw error;
  }
}

export async function cancelReservation(
  reservationId: number
) {
  if (!reservationId) {
    throw new AppError(
      400,
      "Reservation ID is required"
    );
  }

  const reservation =
    await reservationRepository.findReservationById(
      reservationId
    );

  if (!reservation) {
    throw new AppError(
      404,
      "Reservation not found"
    );
  }

  if (
    reservation.ReservStatus ===
    "Cancelled"
  ) {
    throw new AppError(
      400,
      "Reservation is already cancelled"
    );
  }

  await reservationRepository.cancelReservation(
    reservationId
  );

  return {
    success: true,
    message:
      "Reservation cancelled successfully",
    reservationId,
  };
}