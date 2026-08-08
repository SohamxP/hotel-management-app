import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const TEST_DB_FILE = path.resolve(
  process.cwd(),
  "database/test-hotel.db"
);

process.env.DB_FILE = TEST_DB_FILE;
process.env.JWT_SECRET = "test-jwt-secret";

export async function resetTestDatabase() {
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
}

export function removeTestDatabase() {
  if (fs.existsSync(TEST_DB_FILE)) {
    fs.unlinkSync(TEST_DB_FILE);
  }
}