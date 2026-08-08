import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDB() {
  return open({
    filename:
      process.env.DB_FILE ||
      "./database/hotel.db",
    driver: sqlite3.Database,
  });
}