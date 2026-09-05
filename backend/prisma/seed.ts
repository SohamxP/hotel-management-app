import "dotenv/config";

import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

import { prisma } from "../prismaClient";

const SQL_FILE = path.resolve(
  process.cwd(),
  "database/init.sql"
);

const TABLES = new Set([
  "Room",
  "Guest",
  "Membership",
  "PaymentInfo",
  "Employee",
  "Reservation",
  "ReservationGuest",
  "Service",
  "RoomService",
  "SpaService",
  "ShuttleService",
  "Feedback",
]);

async function clearDatabase() {
  console.log("Clearing existing seed data...");

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
  await prisma.employee.deleteMany();
}

function getInsertStatements() {
  const sql = fs.readFileSync(
    SQL_FILE,
    "utf8"
  );

  return sql
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      line.startsWith("INSERT INTO ")
    );
}

function convertInsertForPostgres(
  sql: string
) {
  const match = sql.match(
    /^INSERT INTO\s+([A-Za-z0-9_]+)\s+VALUES/
  );

  if (!match) {
    throw new Error(
      `Unable to parse INSERT statement:\n${sql}`
    );
  }

  const tableName = match[1];

  if (!TABLES.has(tableName)) {
    throw new Error(
      `Unexpected table in seed SQL: ${tableName}`
    );
  }

  return sql.replace(
    /^INSERT INTO\s+([A-Za-z0-9_]+)/,
    `INSERT INTO "${tableName}"`
  );
}

async function seedLegacyData() {
  const statements =
    getInsertStatements();

  console.log(
    `Found ${statements.length} seed rows.`
  );

  let inserted = 0;

  for (const statement of statements) {
    const postgresSql =
      convertInsertForPostgres(
        statement
      );

    await prisma.$executeRawUnsafe(
      postgresSql
    );

    inserted++;

    if (inserted % 100 === 0) {
      console.log(
        `Inserted ${inserted}/${statements.length} rows...`
      );
    }
  }

  console.log(
    `Inserted ${inserted} legacy seed rows.`
  );
}

async function seedUserAccounts() {
  console.log(
    "Creating application login accounts..."
  );

  const manager =
    await prisma.employee.findUnique({
      where: {
        employeeId: 94003,
      },
    });

  const frontDesk =
    await prisma.employee.findUnique({
      where: {
        employeeId: 94001,
      },
    });

  if (!manager) {
    throw new Error(
      "Employee 94003 not found. Cannot create Manager login."
    );
  }

  if (!frontDesk) {
    throw new Error(
      "Employee 94001 not found. Cannot create Front Desk login."
    );
  }

  const managerHash =
    await bcrypt.hash(
      "admin123",
      12
    );

  const frontDeskHash =
    await bcrypt.hash(
      "frontdesk123",
      12
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

  console.log(
    "Created admin and frontdesk accounts."
  );
}

async function printSummary() {
  const [
    rooms,
    guests,
    employees,
    reservations,
    services,
    feedback,
    accounts,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.guest.count(),
    prisma.employee.count(),
    prisma.reservation.count(),
    prisma.service.count(),
    prisma.feedback.count(),
    prisma.userAccount.count(),
  ]);

  console.log("");
  console.log("Seed complete:");
  console.log(`Rooms:         ${rooms}`);
  console.log(`Guests:        ${guests}`);
  console.log(`Employees:     ${employees}`);
  console.log(
    `Reservations:  ${reservations}`
  );
  console.log(`Services:      ${services}`);
  console.log(`Feedback:      ${feedback}`);
  console.log(`User accounts: ${accounts}`);
}

async function main() {
  if (!fs.existsSync(SQL_FILE)) {
    throw new Error(
      `Seed source not found: ${SQL_FILE}`
    );
  }

  console.log(
    "Seeding Hotel Management PostgreSQL database..."
  );

  await clearDatabase();
  await seedLegacyData();
  await seedUserAccounts();
  await printSummary();
}

main()
  .catch((error) => {
    console.error(
      "Database seed failed:"
    );
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });