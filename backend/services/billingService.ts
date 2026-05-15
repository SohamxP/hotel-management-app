import Stripe from "stripe";
import * as billingRepository from "../repositories/billingRepository";

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || "";
}

function getCurrency() {
  return (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
}

function getSuccessUrl() {
  return (
    process.env.STRIPE_SUCCESS_URL ||
    "https://example.com/hotel-payment-success?session_id={CHECKOUT_SESSION_ID}"
  );
}

function getCancelUrl() {
  return process.env.STRIPE_CANCEL_URL || "https://example.com/hotel-payment-cancelled";
}

function isStripeReady() {
  const key = getStripeSecretKey();
  return key.startsWith("sk_test_") || key.startsWith("sk_live_");
}

function safeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusLabel(value: unknown) {
  return String(value || "not_started");
}

function guestName(bill: any) {
  return `${bill.firstName || ""} ${bill.lastName || ""}`.trim();
}

function canBillReservation(bill: any) {
  return !["Cancelled", "No-Show"].includes(String(bill.reservationStatus || ""));
}

export async function getBillingOverview() {
  const reservations = await billingRepository.findBillingOverview();

  const activeBills = reservations.filter(canBillReservation);

  const outstandingAmount = activeBills.reduce((sum: number, bill: any) => {
    const paymentStatus = statusLabel(bill.paymentStatus);

    if (paymentStatus === "paid" || paymentStatus === "refunded") {
      return sum;
    }

    return sum + safeNumber(bill.grandTotal);
  }, 0);

  const paidAmount = activeBills.reduce((sum: number, bill: any) => {
    if (bill.paymentStatus === "paid") {
      return sum + safeNumber(bill.grandTotal);
    }

    return sum;
  }, 0);

  const refundedAmount = activeBills.reduce((sum: number, bill: any) => {
    if (bill.paymentStatus === "refunded") {
      return sum + safeNumber(bill.grandTotal);
    }

    return sum;
  }, 0);

  return {
    stripeReady: isStripeReady(),
    mode: isStripeReady() ? "stripe" : "simulation",
    currency: getCurrency(),
    totals: {
      reservations: reservations.length,
      activeBills: activeBills.length,
      outstandingAmount: Number(outstandingAmount.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      refundedAmount: Number(refundedAmount.toFixed(2)),
      paidCount: reservations.filter((bill: any) => bill.paymentStatus === "paid")
        .length,
      checkoutCreatedCount: reservations.filter(
        (bill: any) => bill.paymentStatus === "checkout_created"
      ).length,
      refundedCount: reservations.filter(
        (bill: any) => bill.paymentStatus === "refunded"
      ).length,
    },
    reservations,
  };
}

export async function getReservationBill(reservationId: number) {
  if (!reservationId) {
    throw {
      status: 400,
      message: "Reservation ID is required",
    };
  }

  const bill = await billingRepository.findReservationBill(reservationId);

  if (!bill) {
    throw {
      status: 404,
      message: "Reservation not found",
    };
  }

  const services = await billingRepository.findReservationServices(reservationId);

  return {
    bill,
    services,
  };
}

export async function createCheckoutSession(reservationId: number) {
  if (!reservationId) {
    throw {
      status: 400,
      message: "Reservation ID is required",
    };
  }

  const bill = await billingRepository.findReservationBill(reservationId);

  if (!bill) {
    throw {
      status: 404,
      message: "Reservation not found",
    };
  }

  if (!canBillReservation(bill)) {
    throw {
      status: 400,
      message: "Cannot create checkout for a cancelled or no-show reservation",
    };
  }

  const currency = getCurrency();
  const amountCents = Math.max(Math.round(safeNumber(bill.grandTotal) * 100), 50);

  if (!isStripeReady()) {
    const transaction = await billingRepository.createBillingTransaction({
      reservationId,
      stripeSessionId: null,
      checkoutUrl: null,
      amountCents,
      currency,
      paymentStatus: "checkout_created",
      billingMode: "simulation",
    });

    return {
      mode: "simulation",
      stripeReady: false,
      message:
        "Stripe secret key is not configured, so a simulated checkout was created.",
      checkoutUrl: null,
      amount: Number((amountCents / 100).toFixed(2)),
      currency,
      transaction,
    };
  }

  const stripe = new Stripe(getStripeSecretKey());

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: bill.email || undefined,
    success_url: getSuccessUrl(),
    cancel_url: getCancelUrl(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: {
            name: `Hotel Reservation #${bill.reservationId}`,
            description: `${guestName(bill)} • Room ${bill.roomNumber} • ${bill.roomType}`,
          },
        },
      },
    ],
    metadata: {
      reservationId: String(bill.reservationId),
      guestId: String(bill.guestId),
      roomNumber: String(bill.roomNumber),
      app: "hotel-management-app",
    },
  });

  const transaction = await billingRepository.createBillingTransaction({
    reservationId,
    stripeSessionId: session.id,
    checkoutUrl: session.url || null,
    amountCents,
    currency,
    paymentStatus: "checkout_created",
    billingMode: "stripe",
  });

  return {
    mode: "stripe",
    stripeReady: true,
    message: "Stripe checkout session created.",
    checkoutUrl: session.url,
    stripeSessionId: session.id,
    amount: Number((amountCents / 100).toFixed(2)),
    currency,
    transaction,
  };
}

export async function markPaymentPaid(reservationId: number) {
  if (!reservationId) {
    throw {
      status: 400,
      message: "Reservation ID is required",
    };
  }

  const bill = await billingRepository.markLatestBillingPaid(reservationId);

  return {
    message: "Payment marked as paid for demo/testing.",
    bill,
  };
}

export async function markPaymentRefunded(reservationId: number) {
  if (!reservationId) {
    throw {
      status: 400,
      message: "Reservation ID is required",
    };
  }

  const bill = await billingRepository.markLatestBillingRefunded(reservationId);

  return {
    message: "Payment marked as refunded for demo/testing.",
    bill,
  };
}