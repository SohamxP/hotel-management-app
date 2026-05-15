import { getDB } from "../db";

export type BillingTransactionInput = {
  reservationId: number;
  stripeSessionId: string | null;
  checkoutUrl: string | null;
  amountCents: number;
  currency: string;
  paymentStatus: "checkout_created" | "paid" | "refunded" | "cancelled";
  billingMode: "stripe" | "simulation";
};

export async function ensureBillingTable() {
  const db = await getDB();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS BillingTransaction (
      BillingTransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
      ReservationID INTEGER NOT NULL,
      StripeSessionID TEXT,
      CheckoutURL TEXT,
      AmountCents INTEGER NOT NULL,
      Currency TEXT NOT NULL DEFAULT 'usd',
      PaymentStatus TEXT NOT NULL DEFAULT 'checkout_created',
      BillingMode TEXT NOT NULL DEFAULT 'simulation',
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      PaidAt TEXT,
      RefundedAt TEXT,
      FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID)
    )
  `);
}

export async function findBillingOverview() {
  await ensureBillingTable();

  const db = await getDB();

  return db.all(`
    WITH ServiceTotals AS (
      SELECT
        ReservationID,
        COUNT(ServiceID) AS serviceCount,
        COALESCE(SUM(
          CASE
            WHEN RequestStatus != 'Cancelled' THEN ServicePrice
            ELSE 0
          END
        ), 0) AS serviceTotal
      FROM Service
      GROUP BY ReservationID
    ),
    LatestBilling AS (
      SELECT bt.*
      FROM BillingTransaction bt
      JOIN (
        SELECT
          ReservationID,
          MAX(BillingTransactionID) AS LatestBillingID
        FROM BillingTransaction
        GROUP BY ReservationID
      ) latest
        ON latest.LatestBillingID = bt.BillingTransactionID
    )
    SELECT
      r.ReservationID AS reservationId,
      r.GuestID AS guestId,
      g.FirstName AS firstName,
      g.LastName AS lastName,
      g.Email AS email,
      r.RoomNumber AS roomNumber,
      ro.RoomType AS roomType,
      r.CheckInDate AS checkInDate,
      r.CheckOutDate AS checkOutDate,
      r.TotalPrice AS roomTotal,
      COALESCE(st.serviceCount, 0) AS serviceCount,
      COALESCE(st.serviceTotal, 0) AS serviceTotal,
      ROUND(r.TotalPrice + COALESCE(st.serviceTotal, 0), 2) AS grandTotal,
      r.ReservStatus AS reservationStatus,
      r.PaymentMode AS originalPaymentMode,
      lb.BillingTransactionID AS billingTransactionId,
      lb.StripeSessionID AS stripeSessionId,
      lb.CheckoutURL AS checkoutUrl,
      lb.AmountCents AS amountCents,
      lb.Currency AS currency,
      lb.PaymentStatus AS paymentStatus,
      lb.BillingMode AS billingMode,
      lb.CreatedAt AS billingCreatedAt,
      lb.PaidAt AS paidAt,
      lb.RefundedAt AS refundedAt
    FROM Reservation r
    JOIN Guest g ON g.GuestID = r.GuestID
    JOIN Room ro ON ro.RoomNumber = r.RoomNumber
    LEFT JOIN ServiceTotals st ON st.ReservationID = r.ReservationID
    LEFT JOIN LatestBilling lb ON lb.ReservationID = r.ReservationID
    ORDER BY
      CASE
        WHEN r.ReservStatus IN ('Confirmed', 'Pending') THEN 0
        WHEN r.ReservStatus = 'Completed' THEN 1
        ELSE 2
      END,
      r.CheckInDate DESC,
      r.ReservationID DESC
  `);
}

export async function findReservationBill(reservationId: number) {
  await ensureBillingTable();

  const db = await getDB();

  return db.get(
    `
    WITH ServiceTotals AS (
      SELECT
        ReservationID,
        COUNT(ServiceID) AS serviceCount,
        COALESCE(SUM(
          CASE
            WHEN RequestStatus != 'Cancelled' THEN ServicePrice
            ELSE 0
          END
        ), 0) AS serviceTotal
      FROM Service
      WHERE ReservationID = ?
      GROUP BY ReservationID
    ),
    LatestBilling AS (
      SELECT bt.*
      FROM BillingTransaction bt
      JOIN (
        SELECT
          ReservationID,
          MAX(BillingTransactionID) AS LatestBillingID
        FROM BillingTransaction
        GROUP BY ReservationID
      ) latest
        ON latest.LatestBillingID = bt.BillingTransactionID
    )
    SELECT
      r.ReservationID AS reservationId,
      r.GuestID AS guestId,
      g.FirstName AS firstName,
      g.LastName AS lastName,
      g.Email AS email,
      r.RoomNumber AS roomNumber,
      ro.RoomType AS roomType,
      r.CheckInDate AS checkInDate,
      r.CheckOutDate AS checkOutDate,
      r.TotalPrice AS roomTotal,
      COALESCE(st.serviceCount, 0) AS serviceCount,
      COALESCE(st.serviceTotal, 0) AS serviceTotal,
      ROUND(r.TotalPrice + COALESCE(st.serviceTotal, 0), 2) AS grandTotal,
      r.ReservStatus AS reservationStatus,
      r.PaymentMode AS originalPaymentMode,
      lb.BillingTransactionID AS billingTransactionId,
      lb.StripeSessionID AS stripeSessionId,
      lb.CheckoutURL AS checkoutUrl,
      lb.AmountCents AS amountCents,
      lb.Currency AS currency,
      lb.PaymentStatus AS paymentStatus,
      lb.BillingMode AS billingMode,
      lb.CreatedAt AS billingCreatedAt,
      lb.PaidAt AS paidAt,
      lb.RefundedAt AS refundedAt
    FROM Reservation r
    JOIN Guest g ON g.GuestID = r.GuestID
    JOIN Room ro ON ro.RoomNumber = r.RoomNumber
    LEFT JOIN ServiceTotals st ON st.ReservationID = r.ReservationID
    LEFT JOIN LatestBilling lb ON lb.ReservationID = r.ReservationID
    WHERE r.ReservationID = ?
    `,
    [reservationId, reservationId]
  );
}

export async function findReservationServices(reservationId: number) {
  const db = await getDB();

  return db.all(
    `
    SELECT
      s.ServiceID AS serviceId,
      s.ServiceType AS serviceType,
      s.RequestTime AS requestTime,
      s.RequestStatus AS requestStatus,
      s.ServicePrice AS servicePrice,
      s.EmployeeID AS employeeId,
      rs.ItemDescription AS itemDescription,
      spa.SpaServiceType AS spaServiceType,
      spa.DurationMinutes AS durationMinutes,
      sh.PickupTime AS pickupTime,
      sh.DropoffTime AS dropoffTime,
      sh.ArrivalDestination AS arrivalDestination,
      sh.DepartureDestination AS departureDestination,
      sh.NumberOfPeople AS numberOfPeople
    FROM Service s
    LEFT JOIN RoomService rs ON rs.ServiceID = s.ServiceID
    LEFT JOIN SpaService spa ON spa.ServiceID = s.ServiceID
    LEFT JOIN ShuttleService sh ON sh.ServiceID = s.ServiceID
    WHERE s.ReservationID = ?
    ORDER BY s.RequestTime DESC, s.ServiceID DESC
    `,
    [reservationId]
  );
}

export async function createBillingTransaction(input: BillingTransactionInput) {
  await ensureBillingTable();

  const db = await getDB();

  const result = await db.run(
    `
    INSERT INTO BillingTransaction (
      ReservationID,
      StripeSessionID,
      CheckoutURL,
      AmountCents,
      Currency,
      PaymentStatus,
      BillingMode
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.reservationId,
      input.stripeSessionId,
      input.checkoutUrl,
      input.amountCents,
      input.currency,
      input.paymentStatus,
      input.billingMode,
    ]
  );

  return db.get(
    `
    SELECT
      BillingTransactionID AS billingTransactionId,
      ReservationID AS reservationId,
      StripeSessionID AS stripeSessionId,
      CheckoutURL AS checkoutUrl,
      AmountCents AS amountCents,
      Currency AS currency,
      PaymentStatus AS paymentStatus,
      BillingMode AS billingMode,
      CreatedAt AS createdAt,
      PaidAt AS paidAt,
      RefundedAt AS refundedAt
    FROM BillingTransaction
    WHERE BillingTransactionID = ?
    `,
    [result.lastID]
  );
}

export async function markLatestBillingPaid(reservationId: number) {
  await ensureBillingTable();

  const db = await getDB();

  const latest = await db.get(
    `
    SELECT BillingTransactionID
    FROM BillingTransaction
    WHERE ReservationID = ?
    ORDER BY BillingTransactionID DESC
    LIMIT 1
    `,
    [reservationId]
  );

  if (!latest) {
    const bill = await findReservationBill(reservationId);

    if (!bill) {
      throw {
        status: 404,
        message: "Reservation not found",
      };
    }

    await createBillingTransaction({
      reservationId,
      stripeSessionId: null,
      checkoutUrl: null,
      amountCents: Math.max(Math.round(Number(bill.grandTotal || 0) * 100), 50),
      currency: "usd",
      paymentStatus: "paid",
      billingMode: "simulation",
    });

    return findReservationBill(reservationId);
  }

  await db.run(
    `
    UPDATE BillingTransaction
    SET PaymentStatus = 'paid',
        PaidAt = datetime('now')
    WHERE BillingTransactionID = ?
    `,
    [latest.BillingTransactionID]
  );

  return findReservationBill(reservationId);
}

export async function markLatestBillingRefunded(reservationId: number) {
  await ensureBillingTable();

  const db = await getDB();

  const latest = await db.get(
    `
    SELECT BillingTransactionID
    FROM BillingTransaction
    WHERE ReservationID = ?
    ORDER BY BillingTransactionID DESC
    LIMIT 1
    `,
    [reservationId]
  );

  if (!latest) {
    throw {
      status: 404,
      message: "No billing transaction found for this reservation",
    };
  }

  await db.run(
    `
    UPDATE BillingTransaction
    SET PaymentStatus = 'refunded',
        RefundedAt = datetime('now')
    WHERE BillingTransactionID = ?
    `,
    [latest.BillingTransactionID]
  );

  return findReservationBill(reservationId);
}