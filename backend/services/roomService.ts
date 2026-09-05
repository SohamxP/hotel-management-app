import * as roomRepository from "../repositories/roomRepository";

export async function getAllRooms() {
  return roomRepository.findAllRooms();
}

export async function getAvailableRooms(
  checkIn: string,
  checkOut: string
) {
  if (!checkIn || !checkOut) {
    throw {
      status: 400,
      message:
        "checkIn and checkOut are required",
    };
  }

  const datePattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (
    !datePattern.test(checkIn) ||
    !datePattern.test(checkOut)
  ) {
    throw {
      status: 400,
      message:
        "Dates must use YYYY-MM-DD format",
    };
  }

  const checkInDate = new Date(
    `${checkIn}T00:00:00`
  );

  const checkOutDate = new Date(
    `${checkOut}T00:00:00`
  );

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime())
  ) {
    throw {
      status: 400,
      message: "Invalid reservation dates",
    };
  }

  if (checkOutDate <= checkInDate) {
    throw {
      status: 400,
      message:
        "Check-out date must be after check-in date",
    };
  }

  return roomRepository.findAvailableRooms(
    checkIn,
    checkOut
  );
}