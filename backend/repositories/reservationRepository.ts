import { getDB } from "../db";

type CreateReservationData = {
  reservationId: number;
  guestId: number;
  roomNumber: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  paymentMode: string;
  specialRequest: string | null;
};

export async function findAllReservations() {
  const db = await getDB();

  return db.all(`
    SELECT 
      r.*,
      g.FirstName,
      g.LastName,
      ro.RoomType,
      ro.RatePerNight
    FROM Reservation r
    JOIN Guest g ON r.GuestID = g.GuestID
    JOIN Room ro ON r.RoomNumber = ro.RoomNumber
    ORDER BY r.CheckInDate DESC
  `);
}

export async function findGuestById(guestId: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Guest WHERE GuestID = ?", [guestId]);
}

export async function findRoomByNumber(roomNumber: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Room WHERE RoomNumber = ?", [roomNumber]);
}

export async function findReservationById(reservationId: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Reservation WHERE ReservationID = ?", [
    reservationId,
  ]);
}

export async function createReservation(data: CreateReservationData) {
  const db = await getDB();

  return db.run(
    `
    INSERT INTO Reservation (
      ReservationID,
      GuestID,
      RoomNumber,
      CheckInDate,
      CheckInTime,
      CheckOutDate,
      TotalPrice,
      ReservStatus,
      SpecialRequest,
      PaymentMode
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.reservationId,
      data.guestId,
      data.roomNumber,
      data.checkInDate,
      "15:00",
      data.checkOutDate,
      data.totalPrice,
      "Confirmed",
      data.specialRequest,
      data.paymentMode,
    ]
  );
}

export async function addReservationGuest(
  reservationId: number,
  guestId: number
) {
  const db = await getDB();

  return db.run(
    `
    INSERT INTO ReservationGuest (
      ReservationID,
      GuestID
    )
    VALUES (?, ?)
    `,
    [reservationId, guestId]
  );
}

export async function cancelReservation(reservationId: number) {
  const db = await getDB();

  return db.run(
    `
    UPDATE Reservation
    SET ReservStatus = 'Cancelled'
    WHERE ReservationID = ?
    `,
    [reservationId]
  );
}

export async function updateRoomStatus(roomNumber: number, status: string) {
  const db = await getDB();

  return db.run(
    `
    UPDATE Room
    SET AvailStatus = ?
    WHERE RoomNumber = ?
    `,
    [status, roomNumber]
  );
}