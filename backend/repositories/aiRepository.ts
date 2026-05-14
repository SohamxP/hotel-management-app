import { getDB } from "../db";

export async function getOperationalSummary() {
  const db = await getDB();

  return db.get(`
    SELECT
      (SELECT COUNT(*) FROM Room) AS totalRooms,
      (SELECT COUNT(*) FROM Room WHERE AvailStatus = 'Available') AS availableRooms,
      (SELECT COUNT(*) FROM Room WHERE AvailStatus = 'Reserved') AS reservedRooms,
      (SELECT COUNT(*) FROM Room WHERE AvailStatus = 'Occupied') AS occupiedRooms,
      (SELECT COUNT(*) FROM Room WHERE AvailStatus = 'Blocked') AS blockedRooms,
      (SELECT COUNT(*) FROM Guest) AS totalGuests,
      (SELECT COUNT(*) FROM Reservation) AS totalReservations,
      (SELECT COUNT(*) FROM Reservation WHERE ReservStatus IN ('Confirmed', 'Pending')) AS activeReservations,
      (SELECT COUNT(*) FROM Reservation WHERE ReservStatus = 'Cancelled') AS cancelledReservations,
      (SELECT COUNT(*) FROM Service WHERE RequestStatus = 'Pending') AS pendingServices,
      (SELECT COUNT(*) FROM Service WHERE RequestStatus = 'In Progress') AS inProgressServices,
      (SELECT COALESCE(SUM(ServicePrice), 0) FROM Service WHERE RequestStatus = 'Completed') AS completedServiceRevenue,
      (SELECT COALESCE(SUM(TotalPrice), 0) FROM Reservation WHERE ReservStatus != 'Cancelled') AS reservationRevenue,
      (SELECT ROUND(AVG(RoomRating), 2) FROM Feedback) AS avgRoomRating,
      (SELECT ROUND(AVG(CustSvcRating), 2) FROM Feedback) AS avgCustomerServiceRating,
      (SELECT ROUND(AVG(SafetyRating), 2) FROM Feedback) AS avgSafetyRating,
      (SELECT ROUND(AVG(BreakfastRating), 2) FROM Feedback) AS avgBreakfastRating
  `);
}

export async function getRoomTypePerformance() {
  const db = await getDB();

  return db.all(`
    SELECT
      RoomType,
      COUNT(*) AS totalRooms,
      SUM(CASE WHEN AvailStatus = 'Available' THEN 1 ELSE 0 END) AS availableRooms,
      SUM(CASE WHEN AvailStatus = 'Reserved' THEN 1 ELSE 0 END) AS reservedRooms,
      SUM(CASE WHEN AvailStatus = 'Occupied' THEN 1 ELSE 0 END) AS occupiedRooms,
      SUM(CASE WHEN AvailStatus = 'Blocked' THEN 1 ELSE 0 END) AS blockedRooms,
      ROUND(AVG(RatePerNight), 2) AS avgRate
    FROM Room
    GROUP BY RoomType
    ORDER BY totalRooms DESC, avgRate DESC
  `);
}

export async function getReservationStatusBreakdown() {
  const db = await getDB();

  return db.all(`
    SELECT
      ReservStatus,
      COUNT(*) AS count,
      COALESCE(SUM(TotalPrice), 0) AS revenue
    FROM Reservation
    GROUP BY ReservStatus
    ORDER BY count DESC
  `);
}

export async function getServiceStatusBreakdown() {
  const db = await getDB();

  return db.all(`
    SELECT
      RequestStatus,
      COUNT(*) AS count,
      COALESCE(SUM(ServicePrice), 0) AS revenue
    FROM Service
    GROUP BY RequestStatus
    ORDER BY count DESC
  `);
}

export async function getServiceRevenueByType() {
  const db = await getDB();

  return db.all(`
    SELECT
      ServiceType,
      COUNT(*) AS serviceCount,
      COALESCE(SUM(ServicePrice), 0) AS totalRevenue,
      ROUND(AVG(ServicePrice), 2) AS avgPrice
    FROM Service
    WHERE RequestStatus != 'Cancelled'
    GROUP BY ServiceType
    ORDER BY totalRevenue DESC
  `);
}

export async function getTopGuests() {
  const db = await getDB();

  return db.all(`
    SELECT
      g.GuestID,
      g.FirstName || ' ' || g.LastName AS guestName,
      m.MembershipLevel,
      COUNT(r.ReservationID) AS reservationCount,
      COALESCE(SUM(r.TotalPrice), 0) AS totalSpent
    FROM Guest g
    JOIN Reservation r ON g.GuestID = r.GuestID
    LEFT JOIN Membership m ON g.GuestID = m.GuestID
    WHERE r.ReservStatus != 'Cancelled'
    GROUP BY g.GuestID, g.FirstName, g.LastName, m.MembershipLevel
    ORDER BY totalSpent DESC
    LIMIT 5
  `);
}

export async function getRecentLowFeedback() {
  const db = await getDB();

  return db.all(`
    SELECT
      f.FeedbackID,
      f.ReservationID,
      g.FirstName || ' ' || g.LastName AS guestName,
      ro.RoomType,
      f.RoomRating,
      f.BreakfastRating,
      f.SafetyRating,
      f.CustSvcRating,
      f.Comments,
      f.SubmissionDate
    FROM Feedback f
    JOIN Reservation r ON f.ReservationID = r.ReservationID
    JOIN Guest g ON r.GuestID = g.GuestID
    JOIN Room ro ON r.RoomNumber = ro.RoomNumber
    WHERE
      f.RoomRating <= 3
      OR f.BreakfastRating <= 3
      OR f.CustSvcRating <= 3
      OR f.SafetyRating <= 3
    ORDER BY f.SubmissionDate DESC
    LIMIT 5
  `);
}