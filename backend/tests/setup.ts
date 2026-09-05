import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { prisma } from "../prismaClient";
import {
  CardType,
  MembershipLevel,
  RoomAvailability,
  RoomType,
} from "../generated/prisma/client";

const TEST_DB_FILE = path.resolve(
  process.cwd(),
  "database/test-hotel.db"
);

process.env.DB_FILE = TEST_DB_FILE;

export async function resetTestDatabase() {
  /*
   * -------------------------------------------------------
   * SQLITE RESET
   * -------------------------------------------------------
   *
   * We still keep SQLite temporarily because reports,
   * services, billing, AI, and quality code have not all
   * been migrated to Prisma yet.
   */

  if (fs.existsSync(TEST_DB_FILE)) {
    fs.unlinkSync(TEST_DB_FILE);
  }

  const db = await open({
    filename: TEST_DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  const initSql = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "database/init.sql"
    ),
    "utf8"
  );

  await db.exec(initSql);

  const managerHash = await bcrypt.hash(
    "admin123",
    4
  );

  const frontDeskHash = await bcrypt.hash(
    "frontdesk123",
    4
  );

  await db.run(
    `
    INSERT INTO UserAccount (
      EmployeeID,
      Username,
      PasswordHash
    )
    VALUES (?, ?, ?)
    `,
    [94003, "admin", managerHash]
  );

  await db.run(
    `
    INSERT INTO UserAccount (
      EmployeeID,
      Username,
      PasswordHash
    )
    VALUES (?, ?, ?)
    `,
    [94001, "frontdesk", frontDeskHash]
  );

  await db.close();

  /*
   * -------------------------------------------------------
   * POSTGRESQL RESET
   * -------------------------------------------------------
   *
   * Delete child tables first because of foreign keys.
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
   * Keep employees because auth users reference them.
   * Upsert makes this reset safe across multiple test files.
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
   *
   * These are used by room tests and reservation tests.
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
   *
   * Reservation tests use guest IDs 91001 through 91006.
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

export function removeTestDatabase() {
  if (fs.existsSync(TEST_DB_FILE)) {
    fs.unlinkSync(TEST_DB_FILE);
  }
}