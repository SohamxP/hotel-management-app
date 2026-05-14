import { getDB } from "../db";

export async function findAllGuests() {
  const db = await getDB();

  return db.all(`
    SELECT
      GuestID,
      FirstName,
      LastName,
      PhoneNumber,
      Email
    FROM Guest
    ORDER BY LastName, FirstName
  `);
}

export async function findGuestById(guestId: number) {
  const db = await getDB();

  return db.get(
    `
    SELECT
      GuestID,
      FirstName,
      LastName,
      DateOfBirth,
      PhoneNumber,
      Email
    FROM Guest
    WHERE GuestID = ?
    `,
    [guestId]
  );
}