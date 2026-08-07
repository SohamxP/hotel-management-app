import { getDB } from "../db";

export async function findUserByUsername(username: string) {
  const db = await getDB();

  try {
    return await db.get(
      `
      SELECT
        ua.UserID,
        ua.EmployeeID,
        ua.Username,
        ua.PasswordHash,
        ua.IsActive,
        e.FirstName,
        e.LastName,
        e.Position
      FROM UserAccount ua
      JOIN Employee e
        ON e.EmployeeID = ua.EmployeeID
      WHERE ua.Username = ?
      `,
      [username]
    );
  } finally {
    await db.close();
  }
}