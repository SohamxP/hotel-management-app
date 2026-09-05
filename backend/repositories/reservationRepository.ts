import { prisma } from "../prismaClient";
import {
  PaymentMode,
  ReservationStatus,
  RoomAvailability,
} from "../generated/prisma/client";

type CreateReservationData = {
  reservationId: number;
  guestId: number;
  roomNumber: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentMode: string;
  specialRequest: string | null;
};

function paymentModeToPrisma(value: string): PaymentMode {
  switch (value) {
    case "Credit Card":
      return PaymentMode.CREDIT_CARD;
    case "Debit Card":
      return PaymentMode.DEBIT_CARD;
    case "Cash":
      return PaymentMode.CASH;
    case "Bank Transfer":
      return PaymentMode.BANK_TRANSFER;
    case "Amex":
      return PaymentMode.AMEX;
    default:
      throw new Error(`Invalid payment mode: ${value}`);
  }
}

function paymentModeToLegacy(value: PaymentMode): string {
  switch (value) {
    case PaymentMode.CREDIT_CARD:
      return "Credit Card";
    case PaymentMode.DEBIT_CARD:
      return "Debit Card";
    case PaymentMode.CASH:
      return "Cash";
    case PaymentMode.BANK_TRANSFER:
      return "Bank Transfer";
    case PaymentMode.AMEX:
      return "Amex";
  }
}

function reservationStatusToLegacy(value: ReservationStatus): string {
  switch (value) {
    case ReservationStatus.CONFIRMED:
      return "Confirmed";
    case ReservationStatus.PENDING:
      return "Pending";
    case ReservationStatus.CANCELLED:
      return "Cancelled";
    case ReservationStatus.COMPLETED:
      return "Completed";
    case ReservationStatus.NO_SHOW:
      return "No-Show";
  }
}

function roomAvailabilityToLegacy(value: RoomAvailability): string {
  switch (value) {
    case RoomAvailability.AVAILABLE:
      return "Available";
    case RoomAvailability.RESERVED:
      return "Reserved";
    case RoomAvailability.OCCUPIED:
      return "Occupied";
    case RoomAvailability.BLOCKED:
      return "Blocked";
  }
}

function reservationToLegacy(reservation: any) {
  return {
    ReservationID: Number(reservation.reservationId),
    GuestID: reservation.guestId,
    RoomNumber: reservation.roomNumber,
    CheckInDate: reservation.checkInDate,
    CheckInTime: reservation.checkInTime,
    CheckOutDate: reservation.checkOutDate,
    TotalPrice: reservation.totalPrice,
    ReservStatus: reservationStatusToLegacy(
      reservation.reservStatus
    ),
    SpecialRequest: reservation.specialRequest,
    PaymentMode: paymentModeToLegacy(
      reservation.paymentMode
    ),
  };
}

export async function findAllReservations() {
  const reservations = await prisma.reservation.findMany({
    include: {
      guest: true,
      room: true,
    },
    orderBy: {
      checkInDate: "desc",
    },
  });

  return reservations.map((reservation) => ({
    ...reservationToLegacy(reservation),
    FirstName: reservation.guest.firstName,
    LastName: reservation.guest.lastName,
    RoomType: reservation.room.roomType,
    RatePerNight: reservation.room.ratePerNight,
  }));
}

export async function findGuestById(
  guestId: number,
  db: any = prisma
) {
  const guest = await db.guest.findUnique({
    where: {
      guestId,
    },
  });

  if (!guest) {
    return undefined;
  }

  return {
    GuestID: guest.guestId,
    FirstName: guest.firstName,
    LastName: guest.lastName,
    DateOfBirth: guest.dateOfBirth,
    PhoneNumber: guest.phoneNumber,
    Email: guest.email,
  };
}

export async function findRoomByNumber(
  roomNumber: number,
  db: any = prisma
) {
  const room = await db.room.findUnique({
    where: {
      roomNumber,
    },
  });

  if (!room) {
    return undefined;
  }

  return {
    RoomNumber: room.roomNumber,
    RoomType: room.roomType,
    RatePerNight: room.ratePerNight,
    AvailStatus: roomAvailabilityToLegacy(
      room.availStatus
    ),
    MaxOccupancy: room.maxOccupancy,
    HasBalcony: room.hasBalcony,
    IsSmoking: room.isSmoking,
    BedCount: room.bedCount,
    BuildingNumber: room.buildingNumber,
    HasWifi: room.hasWifi,
    HasTv: room.hasTv,
  };
}

export async function findConflictingReservation(
  roomNumber: number,
  checkInDate: string,
  checkOutDate: string,
  db: any = prisma
) {
  const reservation =
    await db.reservation.findFirst({
      where: {
        roomNumber,
        reservStatus: {
          in: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.PENDING,
          ],
        },
        checkInDate: {
          lt: checkOutDate,
        },
        checkOutDate: {
          gt: checkInDate,
        },
      },
    });

  return reservation
    ? reservationToLegacy(reservation)
    : undefined;
}

export async function findReservationById(
  reservationId: number
) {
  const reservation =
    await prisma.reservation.findUnique({
      where: {
        reservationId: BigInt(reservationId),
      },
    });

  return reservation
    ? reservationToLegacy(reservation)
    : undefined;
}

export async function createReservation(
  data: CreateReservationData,
  db: any = prisma
) {
  return db.reservation.create({
    data: {
      reservationId: BigInt(data.reservationId),
      guestId: data.guestId,
      roomNumber: data.roomNumber,
      checkInDate: data.checkInDate,
      checkInTime: "15:00",
      checkOutDate: data.checkOutDate,
      totalPrice: data.totalPrice,
      reservStatus: ReservationStatus.CONFIRMED,
      specialRequest: data.specialRequest,
      paymentMode: paymentModeToPrisma(
        data.paymentMode
      ),
    },
  });
}

export async function addReservationGuest(
  reservationId: number,
  guestId: number,
  db: any = prisma
) {
  return db.reservationGuest.create({
    data: {
      reservationId: BigInt(reservationId),
      guestId,
    },
  });
}

export async function cancelReservation(
  reservationId: number
) {
  return prisma.reservation.update({
    where: {
      reservationId: BigInt(reservationId),
    },
    data: {
      reservStatus: ReservationStatus.CANCELLED,
    },
  });
}

export async function updateRoomStatus(
  roomNumber: number,
  status: string
) {
  let availStatus: RoomAvailability;

  switch (status) {
    case "Available":
      availStatus = RoomAvailability.AVAILABLE;
      break;
    case "Reserved":
      availStatus = RoomAvailability.RESERVED;
      break;
    case "Occupied":
      availStatus = RoomAvailability.OCCUPIED;
      break;
    case "Blocked":
      availStatus = RoomAvailability.BLOCKED;
      break;
    default:
      throw new Error(
        `Invalid room availability status: ${status}`
      );
  }

  return prisma.room.update({
    where: {
      roomNumber,
    },
    data: {
      availStatus,
    },
  });
}