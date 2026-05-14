import { getDB } from "../db";

export async function findAllRooms() {
  const db = await getDB();
  return db.all("SELECT * FROM Room");
}

export async function findRoomByNumber(RoomNumber: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Room WHERE RoomNumber = ?", [RoomNumber]);
}

export async function updateRoomStatus(RoomNumber: number, status: string) {
  const db = await getDB();

  return db.run("UPDATE Room SET AvailStatus = ? WHERE RoomNumber = ?", [
    status,
    RoomNumber,
  ]);
}