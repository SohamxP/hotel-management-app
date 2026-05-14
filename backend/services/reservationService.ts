import * as reservationRepository from "../repositories/reservationRepository";

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

  if (!guestId || !roomNumber || !checkInDate || !checkOutDate || !paymentMode) {
    throw {
      status: 400,
      message:
        "guestId, roomNumber, checkInDate, checkOutDate, and paymentMode are required",
    };
  }

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw {
      status: 400,
      message: "Invalid check-in or check-out date",
    };
  }

  if (checkOut <= checkIn) {
    throw {
      status: 400,
      message: "Check-out date must be after check-in date",
    };
  }

  const guest = await reservationRepository.findGuestById(guestId);

  if (!guest) {
    throw {
      status: 404,
      message: "Guest not found",
    };
  }

  const room = await reservationRepository.findRoomByNumber(roomNumber);

  if (!room) {
    throw {
      status: 404,
      message: "Room not found",
    };
  }

  if (room.AvailStatus !== "Available") {
    throw {
      status: 400,
      message: "Room is not available",
    };
  }

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalPrice = nights * room.RatePerNight;

  const reservationId = Date.now();

  await reservationRepository.createReservation({
    reservationId,
    guestId,
    roomNumber,
    checkInDate,
    checkOutDate,
    totalPrice,
    paymentMode,
    specialRequest: specialRequest || null,
  });

  await reservationRepository.addReservationGuest(reservationId, guestId);

  await reservationRepository.updateRoomStatus(roomNumber, "Reserved");

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
}

export async function cancelReservation(reservationId: number) {
  if (!reservationId) {
    throw {
      status: 400,
      message: "Reservation ID is required",
    };
  }

  const reservation =
    await reservationRepository.findReservationById(reservationId);

  if (!reservation) {
    throw {
      status: 404,
      message: "Reservation not found",
    };
  }

  if (reservation.ReservStatus === "Cancelled") {
    throw {
      status: 400,
      message: "Reservation is already cancelled",
    };
  }

  await reservationRepository.cancelReservation(reservationId);

  await reservationRepository.updateRoomStatus(
    reservation.RoomNumber,
    "Available"
  );

  return {
    success: true,
    message: "Reservation cancelled successfully",
    reservationId,
  };
}