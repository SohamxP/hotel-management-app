import { Request, Response } from "express";
import Stripe from "stripe";
import * as billingRepository from "../repositories/billingRepository";

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || "";
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

function getStripeClient() {
  const key = getStripeSecretKey();

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(key);
}

export async function stripeWebhookController(
  req: Request,
  res: Response
) {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      error: "Missing Stripe signature",
    });
  }

  const webhookSecret = getWebhookSecret();

  if (!webhookSecret) {
    return res.status(500).json({
      error: "STRIPE_WEBHOOK_SECRET is not configured",
    });
  }

  const stripe = getStripeClient();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    return res.status(400).json({
      error: `Webhook signature verification failed: ${
        error.message || "Unknown error"
      }`,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        const reservationId = Number(
          session.metadata?.reservationId ||
            session.client_reference_id ||
            0
        );

        await billingRepository.syncBillingTransactionWithStripeSession({
          stripeSessionId: session.id,
          reservationId: reservationId || undefined,
          amountCents: session.amount_total || null,
          currency: session.currency || "usd",
          paymentStatus:
            session.payment_status === "paid"
              ? "paid"
              : "checkout_created",
          stripePaymentStatus:
            session.payment_status || null,
          stripeSessionStatus:
            session.status || null,
        });

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as any;

        const reservationId = Number(
          session.metadata?.reservationId ||
            session.client_reference_id ||
            0
        );

        await billingRepository.syncBillingTransactionWithStripeSession({
          stripeSessionId: session.id,
          reservationId: reservationId || undefined,
          amountCents: session.amount_total || null,
          currency: session.currency || "usd",
          paymentStatus: "cancelled",
          stripePaymentStatus:
            session.payment_status || null,
          stripeSessionStatus:
            session.status || null,
        });

        break;
      }

      default:
        break;
    }

    return res.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing failed:",
      error
    );

    return res.status(500).json({
      error: "Webhook processing failed",
    });
  }
}