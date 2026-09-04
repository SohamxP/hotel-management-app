import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { prisma } from "../prismaClient";

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
   * Keep this temporarily because reservations, reports,
   * services, AI, etc. are still using SQLite.
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

  /*
   * SQLite auth users.
   *
   * We keep these temporarily because some old SQLite code
   * may still expect the UserAccount table to be populated.
   */

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
   * POSTGRESQL / PRISMA RESET
   * -------------------------------------------------------
   * authRepository now uses Prisma, so the same test
   * employees/users must also exist in PostgreSQL.
   */

  await prisma.userAccount.deleteMany({
    where: {
      username: {
        in: ["admin", "frontdesk"],
      },
    },
  });

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
}

export function removeTestDatabase() {
  if (fs.existsSync(TEST_DB_FILE)) {
    fs.unlinkSync(TEST_DB_FILE);
  }
}