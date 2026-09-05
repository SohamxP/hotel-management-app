import { prisma } from "../prismaClient";
import { RoomAvailability } from "../generated/prisma/client";

function toLegacyAvailability(status: RoomAvailability) {
  switch (status) {
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

function toPrismaAvailability(status: string): RoomAvailability {
  switch (status) {
    case "Available":
      return RoomAvailability.AVAILABLE;
    case "Reserved":
      return RoomAvailability.RESERVED;
    case "Occupied":
      return RoomAvailability.OCCUPIED;
    case "Blocked":
      return RoomAvailability.BLOCKED;
    default:
      throw new Error(`Invalid room availability status: ${status}`);
  }
}

export async function findAllRooms() {
  const rooms = await prisma.room.findMany();

  return rooms.map((room) => ({
    RoomNumber: room.roomNumber,
    RoomType: room.roomType,
    RatePerNight: room.ratePerNight,
    AvailStatus: toLegacyAvailability(room.availStatus),
    MaxOccupancy: room.maxOccupancy,
    HasBalcony: room.hasBalcony,
    IsSmoking: room.isSmoking,
    BedCount: room.bedCount,
    BuildingNumber: room.buildingNumber,
    HasWifi: room.hasWifi,
    HasTv: room.hasTv,
  }));
}

export async function findRoomByNumber(RoomNumber: number) {
  const room = await prisma.room.findUnique({
    where: {
      roomNumber: RoomNumber,
    },
  });

  if (!room) {
    return undefined;
  }

  return {
    RoomNumber: room.roomNumber,
    RoomType: room.roomType,
    RatePerNight: room.ratePerNight,
    AvailStatus: toLegacyAvailability(room.availStatus),
    MaxOccupancy: room.maxOccupancy,
    HasBalcony: room.hasBalcony,
    IsSmoking: room.isSmoking,
    BedCount: room.bedCount,
    BuildingNumber: room.buildingNumber,
    HasWifi: room.hasWifi,
    HasTv: room.hasTv,
  };
}

export async function updateRoomStatus(
  RoomNumber: number,
  status: string
) {
  const updatedRoom = await prisma.room.update({
    where: {
      roomNumber: RoomNumber,
    },
    data: {
      availStatus: toPrismaAvailability(status),
    },
  });

  return {
    changes: 1,
    lastID: updatedRoom.roomNumber,
  };
}