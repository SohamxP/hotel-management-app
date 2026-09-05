import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../prismaClient";
import {
  findAllRooms,
  findRoomByNumber,
  updateRoomStatus,
} from "../repositories/roomRepository";

describe("roomRepository with Prisma", () => {
  beforeEach(async () => {
    await prisma.room.deleteMany();

    await prisma.room.createMany({
      data: [
        {
          roomNumber: 90101,
          roomType: "KING",
          ratePerNight: 199.99,
          availStatus: "AVAILABLE",
          maxOccupancy: 2,
          hasBalcony: "Y",
          isSmoking: "N",
          bedCount: 1,
          buildingNumber: 9,
          hasWifi: "Y",
          hasTv: "Y",
        },
        {
          roomNumber: 90106,
          roomType: "QUEEN",
          ratePerNight: 149.99,
          availStatus: "BLOCKED",
          maxOccupancy: 2,
          hasBalcony: "N",
          isSmoking: "N",
          bedCount: 2,
          buildingNumber: 9,
          hasWifi: "Y",
          hasTv: "Y",
        },
      ],
    });
  });

  it("returns all rooms", async () => {
    const rooms = await findAllRooms();

    expect(rooms).toHaveLength(2);

    expect(rooms[0]).toHaveProperty("RoomNumber");
    expect(rooms[0]).toHaveProperty("AvailStatus");
  });

  it("finds a room by room number", async () => {
    const room = await findRoomByNumber(90101);

    expect(room).toMatchObject({
      RoomNumber: 90101,
      RoomType: "KING",
      AvailStatus: "Available",
    });
  });

  it("returns undefined for a missing room", async () => {
    const room = await findRoomByNumber(99999);

    expect(room).toBeUndefined();
  });

  it("updates room status", async () => {
    await updateRoomStatus(90101, "Blocked");

    const room = await findRoomByNumber(90101);

    expect(room?.AvailStatus).toBe("Blocked");
  });
});