import { getDB } from "../db";

type CreateServiceData = {
  reservationId: number;
  roomNumber: number;
  serviceType: string;
  requestStatus: string;
  servicePrice: number;
  employeeId: number | null;

  itemDescription: string | null;

  spaServiceType: string | null;
  durationMinutes: number | null;

  pickupTime: string | null;
  dropoffTime: string | null;
  arrivalDestination: string | null;
  departureDestination: string | null;
  numberOfPeople: number | null;
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

export async function findAllServices() {
  const db = await getDB();

  return db.all(`
    SELECT
      s.ServiceID,
      s.ReservationID,
      s.ServiceType,
      s.RequestTime,
      s.RequestStatus,
      s.ServicePrice,
      s.EmployeeID,

      r.RoomNumber,
      r.CheckInDate,
      r.CheckOutDate,
      r.ReservStatus,

      ro.RoomType,

      g.GuestID,
      g.FirstName AS GuestFirstName,
      g.LastName AS GuestLastName,

      e.FirstName AS EmployeeFirstName,
      e.LastName AS EmployeeLastName,
      e.Position AS EmployeePosition,

      rs.ItemDescription,

      spa.SpaServiceType,
      spa.DurationMinutes,

      sh.PickupTime,
      sh.DropoffTime,
      sh.ArrivalDestination,
      sh.DepartureDestination,
      sh.NumberOfPeople

    FROM Service s
    JOIN Reservation r ON s.ReservationID = r.ReservationID
    JOIN Guest g ON r.GuestID = g.GuestID
    JOIN Room ro ON r.RoomNumber = ro.RoomNumber
    LEFT JOIN Employee e ON s.EmployeeID = e.EmployeeID
    LEFT JOIN RoomService rs ON s.ServiceID = rs.ServiceID
    LEFT JOIN SpaService spa ON s.ServiceID = spa.ServiceID
    LEFT JOIN ShuttleService sh ON s.ServiceID = sh.ServiceID
    ORDER BY s.RequestTime DESC, s.ServiceID DESC
  `);
}

export async function findServiceById(serviceId: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Service WHERE ServiceID = ?", [serviceId]);
}

export async function findReservationById(reservationId: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Reservation WHERE ReservationID = ?", [
    reservationId,
  ]);
}

export async function findEmployeeById(employeeId: number) {
  const db = await getDB();

  return db.get("SELECT * FROM Employee WHERE EmployeeID = ?", [employeeId]);
}

export async function createServiceWithSubtype(data: CreateServiceData) {
  const db = await getDB();

  await db.exec("BEGIN");

  try {
    const serviceId = await getNextId(db, "Service", "ServiceID", 96000);

    await db.run(
      `
      INSERT INTO Service (
        ServiceID,
        ReservationID,
        ServiceType,
        RequestTime,
        RequestStatus,
        ServicePrice,
        EmployeeID
      )
      VALUES (?, ?, ?, datetime('now'), ?, ?, ?)
      `,
      [
        serviceId,
        data.reservationId,
        data.serviceType,
        data.requestStatus,
        data.servicePrice,
        data.employeeId,
      ]
    );

    if (data.serviceType === "Room Service") {
      await db.run(
        `
        INSERT INTO RoomService (
          ServiceID,
          RoomNumber,
          ItemDescription
        )
        VALUES (?, ?, ?)
        `,
        [serviceId, data.roomNumber, data.itemDescription]
      );
    }

    if (data.serviceType === "Spa") {
      await db.run(
        `
        INSERT INTO SpaService (
          ServiceID,
          SpaServiceType,
          DurationMinutes
        )
        VALUES (?, ?, ?)
        `,
        [serviceId, data.spaServiceType, data.durationMinutes]
      );
    }

    if (data.serviceType === "Shuttle") {
      await db.run(
        `
        INSERT INTO ShuttleService (
          ServiceID,
          PickupTime,
          DropoffTime,
          ArrivalDestination,
          DepartureDestination,
          NumberOfPeople
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          serviceId,
          data.pickupTime,
          data.dropoffTime,
          data.arrivalDestination,
          data.departureDestination,
          data.numberOfPeople,
        ]
      );
    }

    await db.exec("COMMIT");

    return findServiceById(serviceId);
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function updateServiceStatus(
  serviceId: number,
  requestStatus: string
) {
  const db = await getDB();

  return db.run(
    `
    UPDATE Service
    SET RequestStatus = ?
    WHERE ServiceID = ?
    `,
    [requestStatus, serviceId]
  );
}