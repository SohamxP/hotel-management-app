import * as roomRepository from "../repositories/roomRepository";

export async function getAllRooms() {
  return roomRepository.findAllRooms();
}

export async function reserveRoom(RoomNumber: number) {
  if (!RoomNumber) {
    throw {
      status: 400,
      message: "RoomNumber is required",
    };
  }

  const room = await roomRepository.findRoomByNumber(RoomNumber);

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

  await roomRepository.updateRoomStatus(RoomNumber, "Reserved");

  return {
    success: true,
    message: "Room reserved successfully",
    RoomNumber,
  };
}