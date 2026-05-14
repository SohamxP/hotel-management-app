import { getDB } from "../db";

export type InsightSeverity = "critical" | "warning" | "info" | "success";
export type ActionPriority = "High" | "Medium" | "Low";

export type LocalInsight = {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  metricLabel: string;
  metricValue: string;
  recommendation: string;
};

export type ActionItem = {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  owner: string;
  due: string;
  impact: string;
  source: string;
};

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function money(value: unknown) {
  return `$${numberValue(value).toFixed(2)}`;
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getCount(rows: any[], key: string, value: string) {
  return numberValue(rows.find((row) => row[key] === value)?.count);
}

export async function getHotelOperationsSnapshot() {
  const db = await getDB();

  const [
    roomStatusSummary,
    roomTypePerformance,
    reservationStatusSummary,
    upcomingReservations,
    serviceQueueSummary,
    openServices,
    serviceRevenueByType,
    lowFeedback,
    topGuests,
    membershipRevenue,
    paymentModeSummary,
    blockedRooms,
  ] = await Promise.all([
    db.all(`
      SELECT
        AvailStatus AS status,
        COUNT(*) AS count
      FROM Room
      GROUP BY AvailStatus
      ORDER BY count DESC
    `),

    db.all(`
      SELECT
        RoomType,
        COUNT(*) AS roomCount,
        ROUND(AVG(RatePerNight), 2) AS avgRate,
        SUM(CASE WHEN AvailStatus = 'Available' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN AvailStatus = 'Reserved' THEN 1 ELSE 0 END) AS reserved,
        SUM(CASE WHEN AvailStatus = 'Occupied' THEN 1 ELSE 0 END) AS occupied,
        SUM(CASE WHEN AvailStatus = 'Blocked' THEN 1 ELSE 0 END) AS blocked
      FROM Room
      GROUP BY RoomType
      ORDER BY roomCount DESC
    `),

    db.all(`
      SELECT
        ReservStatus AS status,
        COUNT(*) AS count,
        ROUND(SUM(TotalPrice), 2) AS totalRevenue
      FROM Reservation
      GROUP BY ReservStatus
      ORDER BY count DESC
    `),

    db.all(`
      SELECT
        r.ReservationID,
        r.GuestID,
        g.FirstName,
        g.LastName,
        r.RoomNumber,
        ro.RoomType,
        r.CheckInDate,
        r.CheckOutDate,
        r.TotalPrice,
        r.ReservStatus,
        r.SpecialRequest
      FROM Reservation r
      JOIN Guest g ON g.GuestID = r.GuestID
      JOIN Room ro ON ro.RoomNumber = r.RoomNumber
      WHERE r.ReservStatus IN ('Confirmed', 'Pending')
      ORDER BY r.CheckInDate ASC
      LIMIT 10
    `),

    db.all(`
      SELECT
        RequestStatus AS status,
        COUNT(*) AS count,
        ROUND(SUM(ServicePrice), 2) AS totalValue
      FROM Service
      GROUP BY RequestStatus
      ORDER BY count DESC
    `),

    db.all(`
      SELECT
        s.ServiceID,
        s.ReservationID,
        s.ServiceType,
        s.RequestStatus,
        s.ServicePrice,
        s.RequestTime,
        s.EmployeeID,
        e.FirstName AS EmployeeFirstName,
        e.LastName AS EmployeeLastName,
        e.Position AS EmployeePosition,
        r.RoomNumber,
        g.FirstName AS GuestFirstName,
        g.LastName AS GuestLastName
      FROM Service s
      JOIN Reservation r ON r.ReservationID = s.ReservationID
      JOIN Guest g ON g.GuestID = r.GuestID
      LEFT JOIN Employee e ON e.EmployeeID = s.EmployeeID
      WHERE s.RequestStatus IN ('Pending', 'In Progress')
      ORDER BY
        CASE s.RequestStatus WHEN 'In Progress' THEN 0 ELSE 1 END,
        s.RequestTime ASC
      LIMIT 10
    `),

    db.all(`
      SELECT
        ServiceType,
        COUNT(*) AS serviceCount,
        ROUND(SUM(ServicePrice), 2) AS revenue,
        ROUND(AVG(ServicePrice), 2) AS avgPrice
      FROM Service
      WHERE RequestStatus = 'Completed'
      GROUP BY ServiceType
      ORDER BY revenue DESC
    `),

    db.all(`
      SELECT
        f.FeedbackID,
        f.ReservationID,
        g.FirstName,
        g.LastName,
        r.RoomNumber,
        ro.RoomType,
        ROUND((COALESCE(f.RoomRating, 0) + COALESCE(f.BreakfastRating, 0) + COALESCE(f.SafetyRating, 0) + COALESCE(f.CustSvcRating, 0)) / 4.0, 2) AS averageRating,
        f.RoomRating,
        f.BreakfastRating,
        f.SafetyRating,
        f.CustSvcRating,
        f.Comments,
        f.SubmissionDate
      FROM Feedback f
      JOIN Reservation r ON r.ReservationID = f.ReservationID
      JOIN Room ro ON ro.RoomNumber = r.RoomNumber
      JOIN Guest g ON g.GuestID = r.GuestID
      WHERE
        ((COALESCE(f.RoomRating, 0) + COALESCE(f.BreakfastRating, 0) + COALESCE(f.SafetyRating, 0) + COALESCE(f.CustSvcRating, 0)) / 4.0) <= 3.6
        OR LOWER(COALESCE(f.Comments, '')) LIKE '%slow%'
        OR LOWER(COALESCE(f.Comments, '')) LIKE '%noisy%'
        OR LOWER(COALESCE(f.Comments, '')) LIKE '%average%'
      ORDER BY averageRating ASC, f.SubmissionDate DESC
      LIMIT 8
    `),

    db.all(`
      SELECT
        g.GuestID,
        g.FirstName,
        g.LastName,
        g.Email,
        m.MembershipLevel,
        m.PreferredRoomType,
        COUNT(r.ReservationID) AS reservationCount,
        ROUND(SUM(r.TotalPrice), 2) AS totalSpent,
        ROUND(AVG(julianday(r.CheckOutDate) - julianday(r.CheckInDate)), 1) AS avgStayNights
      FROM Guest g
      JOIN Reservation r ON r.GuestID = g.GuestID
      LEFT JOIN Membership m ON m.GuestID = g.GuestID
      GROUP BY g.GuestID
      ORDER BY totalSpent DESC
      LIMIT 8
    `),

    db.all(`
      SELECT
        m.MembershipLevel,
        COUNT(DISTINCT g.GuestID) AS guestCount,
        COUNT(r.ReservationID) AS reservationCount,
        ROUND(SUM(r.TotalPrice), 2) AS totalRevenue
      FROM Membership m
      JOIN Guest g ON g.GuestID = m.GuestID
      LEFT JOIN Reservation r ON r.GuestID = g.GuestID
      GROUP BY m.MembershipLevel
      ORDER BY totalRevenue DESC
    `),

    db.all(`
      SELECT
        PaymentMode,
        COUNT(*) AS reservationCount,
        ROUND(SUM(TotalPrice), 2) AS totalRevenue
      FROM Reservation
      GROUP BY PaymentMode
      ORDER BY reservationCount DESC
    `),

    db.all(`
      SELECT
        RoomNumber,
        RoomType,
        RatePerNight,
        BuildingNumber,
        HasWifi,
        HasTv,
        HasBalcony
      FROM Room
      WHERE AvailStatus = 'Blocked'
      ORDER BY RatePerNight DESC
    `),
  ]);

  const totalRooms = roomStatusSummary.reduce(
    (sum: number, row: any) => sum + numberValue(row.count),
    0
  );
  const availableRooms = getCount(roomStatusSummary, "status", "Available");
  const reservedRooms = getCount(roomStatusSummary, "status", "Reserved");
  const occupiedRooms = getCount(roomStatusSummary, "status", "Occupied");
  const blockedRoomCount = getCount(roomStatusSummary, "status", "Blocked");
  const availabilityRate = totalRooms ? (availableRooms / totalRooms) * 100 : 0;

  const pendingReservations = getCount(
    reservationStatusSummary,
    "status",
    "Pending"
  );
  const confirmedReservations = getCount(
    reservationStatusSummary,
    "status",
    "Confirmed"
  );
  const pendingServices = getCount(serviceQueueSummary, "status", "Pending");
  const inProgressServices = getCount(
    serviceQueueSummary,
    "status",
    "In Progress"
  );
  const openServiceCount = pendingServices + inProgressServices;

  const completedServiceRevenue = serviceRevenueByType.reduce(
    (sum: number, row: any) => sum + numberValue(row.revenue),
    0
  );
  const reservationRevenue = reservationStatusSummary.reduce(
    (sum: number, row: any) => sum + numberValue(row.totalRevenue),
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRooms,
      availableRooms,
      reservedRooms,
      occupiedRooms,
      blockedRoomCount,
      availabilityRate: Number(availabilityRate.toFixed(1)),
      pendingReservations,
      confirmedReservations,
      openServiceCount,
      pendingServices,
      inProgressServices,
      lowFeedbackCount: lowFeedback.length,
      reservationRevenue: Number(reservationRevenue.toFixed(2)),
      completedServiceRevenue: Number(completedServiceRevenue.toFixed(2)),
    },
    roomStatusSummary,
    roomTypePerformance,
    reservationStatusSummary,
    upcomingReservations,
    serviceQueueSummary,
    openServices,
    serviceRevenueByType,
    lowFeedback,
    topGuests,
    membershipRevenue,
    paymentModeSummary,
    blockedRooms,
  };
}

export async function getLocalHotelInsights() {
  const snapshot = await getHotelOperationsSnapshot();
  const insights: LocalInsight[] = [];
  const summary = snapshot.summary;

  insights.push({
    id: "room-availability",
    title: "Room availability",
    description: `${summary.availableRooms} of ${summary.totalRooms} rooms are currently available.`,
    severity:
      summary.availabilityRate < 20
        ? "critical"
        : summary.availabilityRate < 40
          ? "warning"
          : "success",
    metricLabel: "Availability",
    metricValue: percent(summary.availabilityRate),
    recommendation:
      summary.availabilityRate < 40
        ? "Prioritize check-out cleanup, unblock rooms that are ready, and avoid over-promising same-day inventory."
        : "Availability is healthy. Use this window to promote higher-rate room types.",
  });

  if (summary.blockedRoomCount > 0) {
    const blockedValue = snapshot.blockedRooms.reduce(
      (sum: number, room: any) => sum + numberValue(room.RatePerNight),
      0
    );

    insights.push({
      id: "blocked-rooms",
      title: "Blocked rooms need follow-up",
      description: `${summary.blockedRoomCount} room(s) are blocked, representing about ${money(blockedValue)} in nightly room value.`,
      severity: "warning",
      metricLabel: "Blocked",
      metricValue: String(summary.blockedRoomCount),
      recommendation:
        "Ask housekeeping or maintenance to confirm whether each blocked room can be returned to Available today.",
    });
  }

  if (summary.openServiceCount > 0) {
    insights.push({
      id: "service-queue",
      title: "Open service queue",
      description: `${summary.openServiceCount} service request(s) are still pending or in progress.`,
      severity: summary.openServiceCount >= 5 ? "critical" : "warning",
      metricLabel: "Open services",
      metricValue: String(summary.openServiceCount),
      recommendation:
        "Clear in-progress guest requests first, then assign pending requests to available staff before they become complaints.",
    });
  }

  if (summary.lowFeedbackCount > 0) {
    insights.push({
      id: "guest-feedback",
      title: "Guest satisfaction risk",
      description: `${summary.lowFeedbackCount} feedback record(s) show low ratings or negative comments.`,
      severity: "warning",
      metricLabel: "Flagged feedback",
      metricValue: String(summary.lowFeedbackCount),
      recommendation:
        "Review low-rated stays and follow up with guests who mentioned slow service, noise, or average experiences.",
    });
  }

  const topService = snapshot.serviceRevenueByType[0];

  if (topService) {
    insights.push({
      id: "service-revenue",
      title: "Best service revenue driver",
      description: `${topService.ServiceType} is the strongest completed-service revenue category.`,
      severity: "info",
      metricLabel: "Revenue",
      metricValue: money(topService.revenue),
      recommendation:
        "Use this service category in check-in scripts and guest recommendations to increase add-on revenue.",
    });
  }

  const topGuest = snapshot.topGuests[0];

  if (topGuest) {
    insights.push({
      id: "top-guest",
      title: "High-value guest opportunity",
      description: `${topGuest.FirstName} ${topGuest.LastName} is one of the highest-value repeat guests in the database.`,
      severity: "info",
      metricLabel: "Spend",
      metricValue: money(topGuest.totalSpent),
      recommendation:
        "Use membership level and preferred room type to personalize future offers and improve retention.",
    });
  }

  const tightRoomTypes = snapshot.roomTypePerformance.filter((roomType: any) => {
    const roomCount = numberValue(roomType.roomCount);
    const available = numberValue(roomType.available);
    return roomCount > 0 && available / roomCount <= 0.25;
  });

  if (tightRoomTypes.length > 0) {
    insights.push({
      id: "room-type-pressure",
      title: "Room type pressure",
      description: `${tightRoomTypes
        .map((roomType: any) => roomType.RoomType)
        .join(", ")} room inventory is tight.`,
      severity: "warning",
      metricLabel: "Tight types",
      metricValue: String(tightRoomTypes.length),
      recommendation:
        "Avoid discounting tight room types and steer flexible guests toward room types with better availability.",
    });
  }

  return {
    generatedAt: snapshot.generatedAt,
    summary: snapshot.summary,
    insights,
    snapshot,
  };
}

export async function getAIActionCenter() {
  const result = await getLocalHotelInsights();
  const snapshot = result.snapshot;
  const summary = snapshot.summary;
  const actionItems: ActionItem[] = [];

  if (summary.openServiceCount > 0) {
    actionItems.push({
      id: "A-001",
      priority: summary.openServiceCount >= 5 ? "High" : "Medium",
      title: "Clear open service requests",
      description: `Resolve ${summary.openServiceCount} pending or in-progress service request(s), starting with in-progress items and high-price requests.`,
      owner: "Front Desk + Service Team",
      due: "Today",
      impact: "Reduces guest complaints and protects service ratings.",
      source: "Service queue",
    });
  }

  if (summary.blockedRoomCount > 0) {
    actionItems.push({
      id: "A-002",
      priority: "High",
      title: "Review blocked rooms",
      description: `Inspect ${summary.blockedRoomCount} blocked room(s) and return any fixed rooms to Available.`,
      owner: "Housekeeping / Maintenance",
      due: "Today",
      impact: "Increases sellable inventory and prevents lost nightly revenue.",
      source: "Room availability",
    });
  }

  if (summary.pendingReservations > 0) {
    actionItems.push({
      id: "A-003",
      priority: "Medium",
      title: "Convert pending reservations",
      description: `Follow up on ${summary.pendingReservations} pending reservation(s) and confirm payment or guest details.`,
      owner: "Front Desk",
      due: "Next 24 hours",
      impact: "Improves revenue certainty and reduces no-shows.",
      source: "Reservation status",
    });
  }

  if (summary.lowFeedbackCount > 0) {
    actionItems.push({
      id: "A-004",
      priority: "Medium",
      title: "Recover low feedback cases",
      description: `Review ${summary.lowFeedbackCount} low-feedback case(s) and identify service patterns such as slow service or noisy rooms.`,
      owner: "Manager",
      due: "This week",
      impact: "Improves guest retention and protects future ratings.",
      source: "Guest feedback",
    });
  }

  const topGuest = snapshot.topGuests[0];

  if (topGuest) {
    actionItems.push({
      id: "A-005",
      priority: "Low",
      title: "Personalize offer for top guest segment",
      description: `Use top guest patterns, starting with ${topGuest.FirstName} ${topGuest.LastName}, to create a repeat-guest upgrade or service offer.`,
      owner: "Manager / Marketing",
      due: "This week",
      impact: "Encourages repeat bookings and higher lifetime value.",
      source: "Top guests",
    });
  }

  const topService = snapshot.serviceRevenueByType[0];

  if (topService) {
    actionItems.push({
      id: "A-006",
      priority: "Low",
      title: `Promote ${topService.ServiceType}`,
      description: `${topService.ServiceType} produced ${money(topService.revenue)} in completed service revenue. Add it to check-in scripts or guest recommendations.`,
      owner: "Front Desk",
      due: "This week",
      impact: "Increases add-on revenue without changing room inventory.",
      source: "Service revenue",
    });
  }

  return {
    generatedAt: result.generatedAt,
    summary: result.summary,
    insights: result.insights,
    actionItems,
    snapshot,
  };
}