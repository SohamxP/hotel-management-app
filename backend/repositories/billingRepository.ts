import { prisma } from "../prismaClient";
import {
  BillingMode as PrismaBillingMode,
  BillingPaymentStatus as PrismaBillingPaymentStatus,
  PaymentMode,
  ReservationStatus,
  RoomType,
  ServiceRequestStatus,
  ServiceType,
} from "../generated/prisma/client";

export type BillingPaymentStatus =
  | "checkout_created"
  | "paid"
  | "refunded"
  | "cancelled";

export type BillingTransactionInput = {
  reservationId: number;
  stripeSessionId: string | null;
  checkoutUrl: string | null;
  amountCents: number;
  currency: string;
  paymentStatus: BillingPaymentStatus;
  billingMode: "stripe" | "simulation";
};

function billingStatusToPrisma(
  value: BillingPaymentStatus
): PrismaBillingPaymentStatus {
  switch (value) {
    case "checkout_created":
      return PrismaBillingPaymentStatus.CHECKOUT_CREATED;
    case "paid":
      return PrismaBillingPaymentStatus.PAID;
    case "refunded":
      return PrismaBillingPaymentStatus.REFUNDED;
    case "cancelled":
      return PrismaBillingPaymentStatus.CANCELLED;
  }
}

function billingStatusToLegacy(
  value: PrismaBillingPaymentStatus
): BillingPaymentStatus {
  switch (value) {
    case PrismaBillingPaymentStatus.CHECKOUT_CREATED:
      return "checkout_created";
    case PrismaBillingPaymentStatus.PAID:
      return "paid";
    case PrismaBillingPaymentStatus.REFUNDED:
      return "refunded";
    case PrismaBillingPaymentStatus.CANCELLED:
      return "cancelled";
  }
}

function billingModeToPrisma(
  value: "stripe" | "simulation"
): PrismaBillingMode {
  return value === "stripe"
    ? PrismaBillingMode.STRIPE
    : PrismaBillingMode.SIMULATION;
}

function billingModeToLegacy(
  value: PrismaBillingMode
): "stripe" | "simulation" {
  return value === PrismaBillingMode.STRIPE
    ? "stripe"
    : "simulation";
}

function reservationStatusToLegacy(
  value: ReservationStatus
) {
  switch (value) {
    case ReservationStatus.CONFIRMED:
      return "Confirmed";
    case ReservationStatus.PENDING:
      return "Pending";
    case ReservationStatus.CANCELLED:
      return "Cancelled";
    case ReservationStatus.COMPLETED:
      return "Completed";
    case ReservationStatus.NO_SHOW:
      return "No-Show";
  }
}

function paymentModeToLegacy(
  value: PaymentMode
) {
  switch (value) {
    case PaymentMode.CREDIT_CARD:
      return "Credit Card";
    case PaymentMode.DEBIT_CARD:
      return "Debit Card";
    case PaymentMode.CASH:
      return "Cash";
    case PaymentMode.BANK_TRANSFER:
      return "Bank Transfer";
    case PaymentMode.AMEX:
      return "Amex";
  }
}

function roomTypeToLegacy(
  value: RoomType
) {
  switch (value) {
    case RoomType.KING:
      return "King";
    case RoomType.QUEEN:
      return "Queen";
    case RoomType.DELUXE:
      return "Deluxe";
    case RoomType.ACCESSIBLE:
      return "Accessible";
  }
}

function serviceTypeToLegacy(
  value: ServiceType
) {
  switch (value) {
    case ServiceType.ROOM_SERVICE:
      return "Room Service";
    case ServiceType.SPA:
      return "Spa";
    case ServiceType.SHUTTLE:
      return "Shuttle";
  }
}

function serviceStatusToLegacy(
  value: ServiceRequestStatus
) {
  switch (value) {
    case ServiceRequestStatus.PENDING:
      return "Pending";
    case ServiceRequestStatus.IN_PROGRESS:
      return "In Progress";
    case ServiceRequestStatus.COMPLETED:
      return "Completed";
    case ServiceRequestStatus.CANCELLED:
      return "Cancelled";
  }
}

function mapBillingTransaction(
  transaction: any
) {
  if (!transaction) {
    return {
      billingTransactionId: null,
      stripeSessionId: null,
      checkoutUrl: null,
      amountCents: null,
      currency: null,
      paymentStatus: null,
      billingMode: null,
      billingCreatedAt: null,
      paidAt: null,
      refundedAt: null,
      lastSyncedAt: null,
      stripePaymentStatus: null,
      stripeSessionStatus: null,
    };
  }

  return {
    billingTransactionId:
      transaction.billingTransactionId,
    stripeSessionId:
      transaction.stripeSessionId,
    checkoutUrl:
      transaction.checkoutUrl,
    amountCents:
      transaction.amountCents,
    currency:
      transaction.currency,
    paymentStatus:
      billingStatusToLegacy(
        transaction.paymentStatus
      ),
    billingMode:
      billingModeToLegacy(
        transaction.billingMode
      ),
    billingCreatedAt:
      transaction.createdAt,
    paidAt:
      transaction.paidAt,
    refundedAt:
      transaction.refundedAt,
    lastSyncedAt:
      transaction.lastSyncedAt,
    stripePaymentStatus:
      transaction.stripePaymentStatus,
    stripeSessionStatus:
      transaction.stripeSessionStatus,
  };
}

function mapBill(
  reservation: any
) {
  const activeServices =
    reservation.services.filter(
      (service: any) =>
        service.requestStatus !==
        ServiceRequestStatus.CANCELLED
    );

  const serviceTotal =
    activeServices.reduce(
      (sum: number, service: any) =>
        sum + service.servicePrice,
      0
    );

  const latestBilling =
    reservation.billingTransactions?.[0] ??
    null;

  return {
    reservationId: Number(
      reservation.reservationId
    ),
    guestId: reservation.guestId,

    firstName:
      reservation.guest.firstName,
    lastName:
      reservation.guest.lastName,
    email:
      reservation.guest.email,

    roomNumber:
      reservation.roomNumber,
    roomType:
      roomTypeToLegacy(
        reservation.room.roomType
      ),

    checkInDate:
      reservation.checkInDate,
    checkOutDate:
      reservation.checkOutDate,

    roomTotal:
      reservation.totalPrice,

    serviceCount:
      reservation.services.length,

    serviceTotal,

    grandTotal: Number(
      (
        reservation.totalPrice +
        serviceTotal
      ).toFixed(2)
    ),

    reservationStatus:
      reservationStatusToLegacy(
        reservation.reservStatus
      ),

    originalPaymentMode:
      paymentModeToLegacy(
        reservation.paymentMode
      ),

    ...mapBillingTransaction(
      latestBilling
    ),
  };
}

export async function ensureBillingTable() {
  // No longer needed.
  // Prisma migrations create BillingTransaction.
  return true;
}

export async function findBillingOverview() {
  const reservations =
    await prisma.reservation.findMany({
      include: {
        guest: true,
        room: true,
        services: true,

        billingTransactions: {
          orderBy: {
            billingTransactionId:
              "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        {
          checkInDate: "desc",
        },
        {
          reservationId: "desc",
        },
      ],
    });

  const mapped =
    reservations.map(mapBill);

  const priority = (
    status: string
  ) => {
    if (
      status === "Confirmed" ||
      status === "Pending"
    ) {
      return 0;
    }

    if (status === "Completed") {
      return 1;
    }

    return 2;
  };

  return mapped.sort((a, b) => {
    const statusDiff =
      priority(
        a.reservationStatus
      ) -
      priority(
        b.reservationStatus
      );

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return (
      Number(b.reservationId) -
      Number(a.reservationId)
    );
  });
}

export async function findReservationBill(
  reservationId: number
) {
  const reservation =
    await prisma.reservation.findUnique({
      where: {
        reservationId: BigInt(
          reservationId
        ),
      },
      include: {
        guest: true,
        room: true,
        services: true,

        billingTransactions: {
          orderBy: {
            billingTransactionId:
              "desc",
          },
          take: 1,
        },
      },
    });

  if (!reservation) {
    return undefined;
  }

  return mapBill(reservation);
}

export async function findReservationServices(
  reservationId: number
) {
  const services =
    await prisma.service.findMany({
      where: {
        reservationId: BigInt(
          reservationId
        ),
      },

      include: {
        roomService: true,
        spaService: true,
        shuttleService: true,
      },

      orderBy: [
        {
          requestTime: "desc",
        },
        {
          serviceId: "desc",
        },
      ],
    });

  return services.map((service) => ({
    serviceId:
      service.serviceId,

    serviceType:
      serviceTypeToLegacy(
        service.serviceType
      ),

    requestTime:
      service.requestTime,

    requestStatus:
      serviceStatusToLegacy(
        service.requestStatus
      ),

    servicePrice:
      service.servicePrice,

    employeeId:
      service.employeeId,

    itemDescription:
      service.roomService
        ?.itemDescription ?? null,

    spaServiceType:
      service.spaService
        ?.spaServiceType ?? null,

    durationMinutes:
      service.spaService
        ?.durationMinutes ?? null,

    pickupTime:
      service.shuttleService
        ?.pickupTime ?? null,

    dropoffTime:
      service.shuttleService
        ?.dropoffTime ?? null,

    arrivalDestination:
      service.shuttleService
        ?.arrivalDestination ?? null,

    departureDestination:
      service.shuttleService
        ?.departureDestination ??
      null,

    numberOfPeople:
      service.shuttleService
        ?.numberOfPeople ?? null,
  }));
}

export async function createBillingTransaction(
  input: BillingTransactionInput
) {
  const transaction =
    await prisma.billingTransaction.create({
      data: {
        reservationId: BigInt(
          input.reservationId
        ),
        stripeSessionId:
          input.stripeSessionId,
        checkoutUrl:
          input.checkoutUrl,
        amountCents:
          input.amountCents,
        currency:
          input.currency,
        paymentStatus:
          billingStatusToPrisma(
            input.paymentStatus
          ),
        billingMode:
          billingModeToPrisma(
            input.billingMode
          ),
      },
    });

  return {
    billingTransactionId:
      transaction.billingTransactionId,

    reservationId: Number(
      transaction.reservationId
    ),

    stripeSessionId:
      transaction.stripeSessionId,

    checkoutUrl:
      transaction.checkoutUrl,

    amountCents:
      transaction.amountCents,

    currency:
      transaction.currency,

    paymentStatus:
      billingStatusToLegacy(
        transaction.paymentStatus
      ),

    billingMode:
      billingModeToLegacy(
        transaction.billingMode
      ),

    createdAt:
      transaction.createdAt,

    paidAt:
      transaction.paidAt,

    refundedAt:
      transaction.refundedAt,

    lastSyncedAt:
      transaction.lastSyncedAt,

    stripePaymentStatus:
      transaction.stripePaymentStatus,

    stripeSessionStatus:
      transaction.stripeSessionStatus,
  };
}

export async function findBillingTransactionByStripeSessionId(
  stripeSessionId: string
) {
  const transaction =
    await prisma.billingTransaction.findFirst({
      where: {
        stripeSessionId,
      },
      orderBy: {
        billingTransactionId:
          "desc",
      },
    });

  if (!transaction) {
    return undefined;
  }

  return {
    billingTransactionId:
      transaction.billingTransactionId,

    reservationId: Number(
      transaction.reservationId
    ),

    stripeSessionId:
      transaction.stripeSessionId,

    checkoutUrl:
      transaction.checkoutUrl,

    amountCents:
      transaction.amountCents,

    currency:
      transaction.currency,

    paymentStatus:
      billingStatusToLegacy(
        transaction.paymentStatus
      ),

    billingMode:
      billingModeToLegacy(
        transaction.billingMode
      ),

    createdAt:
      transaction.createdAt,

    paidAt:
      transaction.paidAt,

    refundedAt:
      transaction.refundedAt,

    lastSyncedAt:
      transaction.lastSyncedAt,

    stripePaymentStatus:
      transaction.stripePaymentStatus,

    stripeSessionStatus:
      transaction.stripeSessionStatus,
  };
}

export async function syncBillingTransactionWithStripeSession(
  input: {
    stripeSessionId: string;
    reservationId?: number;
    amountCents?: number | null;
    currency?: string | null;
    paymentStatus: BillingPaymentStatus;
    stripePaymentStatus?: string | null;
    stripeSessionStatus?: string | null;
  }
) {
  let transaction =
    await findBillingTransactionByStripeSessionId(
      input.stripeSessionId
    );

  if (
    !transaction &&
    input.reservationId
  ) {
    const bill =
      await findReservationBill(
        input.reservationId
      );

    if (!bill) {
      throw {
        status: 404,
        message:
          "Reservation from Stripe metadata was not found",
      };
    }

    transaction =
      await createBillingTransaction({
        reservationId:
          input.reservationId,

        stripeSessionId:
          input.stripeSessionId,

        checkoutUrl: null,

        amountCents:
          input.amountCents ??
          Math.max(
            Math.round(
              Number(
                bill.grandTotal || 0
              ) * 100
            ),
            50
          ),

        currency:
          input.currency || "usd",

        paymentStatus:
          input.paymentStatus,

        billingMode: "stripe",
      });
  }

  if (!transaction) {
    throw {
      status: 404,
      message:
        "No billing transaction found for this Stripe session",
    };
  }

  const now = new Date();

  await prisma.billingTransaction.update(
    {
      where: {
        billingTransactionId:
          transaction.billingTransactionId,
      },

      data: {
        paymentStatus:
          billingStatusToPrisma(
            input.paymentStatus
          ),

        amountCents:
          input.amountCents ??
          undefined,

        currency:
          input.currency ??
          undefined,

        stripePaymentStatus:
          input.stripePaymentStatus ??
          null,

        stripeSessionStatus:
          input.stripeSessionStatus ??
          null,

        lastSyncedAt: now,

        paidAt:
          input.paymentStatus ===
          "paid"
            ? transaction.paidAt ??
              now
            : undefined,

        refundedAt:
          input.paymentStatus ===
          "refunded"
            ? transaction.refundedAt ??
              now
            : undefined,
      },
    }
  );

  return findReservationBill(
    transaction.reservationId ||
      input.reservationId ||
      0
  );
}

export async function markLatestBillingPaid(
  reservationId: number
) {
  const latest =
    await prisma.billingTransaction.findFirst(
      {
        where: {
          reservationId:
            BigInt(reservationId),
        },

        orderBy: {
          billingTransactionId:
            "desc",
        },
      }
    );

  if (!latest) {
    const bill =
      await findReservationBill(
        reservationId
      );

    if (!bill) {
      throw {
        status: 404,
        message:
          "Reservation not found",
      };
    }

    await createBillingTransaction({
      reservationId,
      stripeSessionId: null,
      checkoutUrl: null,

      amountCents: Math.max(
        Math.round(
          Number(
            bill.grandTotal || 0
          ) * 100
        ),
        50
      ),

      currency: "usd",
      paymentStatus: "paid",
      billingMode: "simulation",
    });

    return findReservationBill(
      reservationId
    );
  }

  await prisma.billingTransaction.update(
    {
      where: {
        billingTransactionId:
          latest.billingTransactionId,
      },

      data: {
        paymentStatus:
          PrismaBillingPaymentStatus.PAID,

        paidAt:
          latest.paidAt ??
          new Date(),
      },
    }
  );

  return findReservationBill(
    reservationId
  );
}

export async function markLatestBillingRefunded(
  reservationId: number
) {
  const latest =
    await prisma.billingTransaction.findFirst(
      {
        where: {
          reservationId:
            BigInt(reservationId),
        },

        orderBy: {
          billingTransactionId:
            "desc",
        },
      }
    );

  if (!latest) {
    throw {
      status: 404,
      message:
        "No billing transaction found for this reservation",
    };
  }

  await prisma.billingTransaction.update(
    {
      where: {
        billingTransactionId:
          latest.billingTransactionId,
      },

      data: {
        paymentStatus:
          PrismaBillingPaymentStatus.REFUNDED,

        refundedAt:
          latest.refundedAt ??
          new Date(),
      },
    }
  );

  return findReservationBill(
    reservationId
  );
}