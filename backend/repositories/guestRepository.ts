import { getDB } from "../db";

type CreateGuestData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  membershipLevel: string;
  preferredRoomType: string | null;
  purposeOfVisit: string | null;
  cardType: string;
  cardLastFour: string | null;
  billingAddress: string | null;
};

async function getNextId(
  db: any,
  tableName: string,
  columnName: string,
  startingValue: number
) {
  const row = await db.get(
    `SELECT COALESCE(MAX(${columnName}), ?) + 1 AS nextId FROM ${tableName}`,
    [startingValue]
  );

  return Number(row.nextId);
}

export async function findAllGuests() {
  const db = await getDB();

  return db.all(`
    SELECT
      g.GuestID,
      g.FirstName,
      g.LastName,
      g.DateOfBirth,
      g.PhoneNumber,
      g.Email,
      m.MembershipLevel,
      m.PreferredRoomType,
      m.PurposeOfVisit,
      p.CardType,
      p.CardLastFour,
      p.BillingAddress,
      COUNT(r.ReservationID) AS ReservationCount,
      COALESCE(SUM(r.TotalPrice), 0) AS TotalSpent
    FROM Guest g
    LEFT JOIN Membership m ON g.GuestID = m.GuestID
    LEFT JOIN PaymentInfo p ON g.GuestID = p.GuestID
    LEFT JOIN Reservation r ON g.GuestID = r.GuestID
    GROUP BY
      g.GuestID,
      g.FirstName,
      g.LastName,
      g.DateOfBirth,
      g.PhoneNumber,
      g.Email,
      m.MembershipLevel,
      m.PreferredRoomType,
      m.PurposeOfVisit,
      p.CardType,
      p.CardLastFour,
      p.BillingAddress
    ORDER BY g.LastName, g.FirstName
  `);
}

export async function findGuestById(guestId: number) {
  const db = await getDB();

  return db.get(
    `
    SELECT
      g.GuestID,
      g.FirstName,
      g.LastName,
      g.DateOfBirth,
      g.PhoneNumber,
      g.Email,
      m.MembershipID,
      m.MembershipLevel,
      m.PreferredRoomType,
      m.PurposeOfVisit,
      p.PaymentID,
      p.CardType,
      p.CardLastFour,
      p.BillingAddress
    FROM Guest g
    LEFT JOIN Membership m ON g.GuestID = m.GuestID
    LEFT JOIN PaymentInfo p ON g.GuestID = p.GuestID
    WHERE g.GuestID = ?
    `,
    [guestId]
  );
}

export async function createGuestWithDetails(data: CreateGuestData) {
  const db = await getDB();

  await db.exec("BEGIN");

  try {
    const guestId = await getNextId(db, "Guest", "GuestID", 91000);
    const membershipId = await getNextId(
      db,
      "Membership",
      "MembershipID",
      92000
    );
    const paymentId = await getNextId(db, "PaymentInfo", "PaymentID", 93000);

    await db.run(
      `
      INSERT INTO Guest (
        GuestID,
        FirstName,
        LastName,
        DateOfBirth,
        PhoneNumber,
        Email
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        guestId,
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.phoneNumber,
        data.email,
      ]
    );

    await db.run(
      `
      INSERT INTO Membership (
        MembershipID,
        GuestID,
        MembershipLevel,
        PreferredRoomType,
        PurposeOfVisit
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        membershipId,
        guestId,
        data.membershipLevel,
        data.preferredRoomType,
        data.purposeOfVisit,
      ]
    );

    await db.run(
      `
      INSERT INTO PaymentInfo (
        PaymentID,
        GuestID,
        CardType,
        CardLastFour,
        BillingAddress
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        paymentId,
        guestId,
        data.cardType,
        data.cardLastFour,
        data.billingAddress,
      ]
    );

    await db.exec("COMMIT");

    return findGuestById(guestId);
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}