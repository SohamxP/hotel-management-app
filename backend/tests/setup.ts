import bcrypt from "bcrypt";

import { prisma } from "../prismaClient";
import {
  CardType,
  MembershipLevel,
  RoomAvailability,
  RoomType,
} from "../generated/prisma/client";

export async function resetTestDatabase() {
  /*
   * -------------------------------------------------------
   * POSTGRESQL TEST DATABASE RESET
   * -------------------------------------------------------
   *
   * Delete child tables first because of foreign-key
   * relationships.
   */

  await prisma.billingTransaction.deleteMany();
  await prisma.feedback.deleteMany();

  await prisma.roomService.deleteMany();
  await prisma.spaService.deleteMany();
  await prisma.shuttleService.deleteMany();
  await prisma.service.deleteMany();

  await prisma.reservationGuest.deleteMany();
  await prisma.reservation.deleteMany();

  await prisma.paymentInfo.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.guest.deleteMany();

  await prisma.room.deleteMany();
  await prisma.userAccount.deleteMany();

  /*
   * -------------------------------------------------------
   * TEST EMPLOYEES
   * -------------------------------------------------------
   */

  await prisma.employee.upsert({
    where: {
      employeeId: 94003,
    },
    update: {
      firstName: "Carol",
      lastName: "Evans",
      dateOfBirth: "1980-01-01",
      ssn: "TEST-MANAGER-94003",
      salary: 90000,
      position: "Manager",
      hoursWorked: 0,
    },
    create: {
      employeeId: 94003,
      firstName: "Carol",
      lastName: "Evans",
      dateOfBirth: "1980-01-01",
      ssn: "TEST-MANAGER-94003",
      salary: 90000,
      position: "Manager",
      hoursWorked: 0,
    },
  });

  await prisma.employee.upsert({
    where: {
      employeeId: 94001,
    },
    update: {
      firstName: "Alice",
      lastName: "Turner",
      dateOfBirth: "1985-01-01",
      ssn: "TEST-FRONTDESK-94001",
      salary: 50000,
      position: "Front Desk",
      hoursWorked: 0,
    },
    create: {
      employeeId: 94001,
      firstName: "Alice",
      lastName: "Turner",
      dateOfBirth: "1985-01-01",
      ssn: "TEST-FRONTDESK-94001",
      salary: 50000,
      position: "Front Desk",
      hoursWorked: 0,
    },
  });

  /*
   * -------------------------------------------------------
   * AUTH USERS
   * -------------------------------------------------------
   */

  const managerHash = await bcrypt.hash(
    "admin123",
    4
  );

  const frontDeskHash = await bcrypt.hash(
    "frontdesk123",
    4
  );

  await prisma.userAccount.create({
    data: {
      employeeId: 94003,
      username: "admin",
      passwordHash: managerHash,
      isActive: true,
    },
  });

  await prisma.userAccount.create({
    data: {
      employeeId: 94001,
      username: "frontdesk",
      passwordHash: frontDeskHash,
      isActive: true,
    },
  });

  /*
   * -------------------------------------------------------
   * ROOMS
   * -------------------------------------------------------
   */

  await prisma.room.createMany({
    data: [
      {
        roomNumber: 90101,
        roomType: RoomType.KING,
        ratePerNight: 200,
        availStatus:
          RoomAvailability.AVAILABLE,
        maxOccupancy: 2,
        hasBalcony: "Y",
        isSmoking: "N",
        bedCount: 1,
        buildingNumber: 9,
        hasWifi: "Y",
        hasTv: "Y",
      },
      {
        roomNumber: 90102,
        roomType: RoomType.QUEEN,
        ratePerNight: 180,
        availStatus:
          RoomAvailability.AVAILABLE,
        maxOccupancy: 2,
        hasBalcony: "N",
        isSmoking: "N",
        bedCount: 2,
        buildingNumber: 9,
        hasWifi: "Y",
        hasTv: "Y",
      },
      {
        roomNumber: 90103,
        roomType: RoomType.DELUXE,
        ratePerNight: 250,
        availStatus:
          RoomAvailability.AVAILABLE,
        maxOccupancy: 4,
        hasBalcony: "Y",
        isSmoking: "N",
        bedCount: 2,
        buildingNumber: 9,
        hasWifi: "Y",
        hasTv: "Y",
      },
      {
        roomNumber: 90106,
        roomType: RoomType.QUEEN,
        ratePerNight: 150,
        availStatus:
          RoomAvailability.BLOCKED,
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

  /*
   * -------------------------------------------------------
   * GUESTS
   * -------------------------------------------------------
   */

  for (let i = 1; i <= 6; i++) {
    const guestId = 91000 + i;
    const membershipId = 92000 + i;
    const paymentId = 93000 + i;

    await prisma.guest.create({
      data: {
        guestId,
        firstName: `Test${i}`,
        lastName: "Guest",
        dateOfBirth: "2000-01-01",
        phoneNumber: `55500000${i}`,
        email: `guest${i}@example.com`,

        membership: {
          create: {
            membershipId,
            membershipLevel:
              MembershipLevel.BRONZE,
            preferredRoomType:
              RoomType.KING,
            purposeOfVisit: null,
          },
        },

        paymentInfo: {
          create: {
            paymentId,
            cardType: CardType.VISA,
            cardLastFour: "1234",
            billingAddress:
              "123 Test Street",
          },
        },
      },
    });
  }
}

/*
 * Kept temporarily so existing tests do not need to change
 * their afterAll() calls.
 *
 * There is no local database file to remove anymore.
 */
export function removeTestDatabase() {
  // PostgreSQL test data is reset by resetTestDatabase().
}