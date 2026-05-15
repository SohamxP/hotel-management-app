import { Request, Response } from "express";
import {
  createCheckoutSession,
  getBillingOverview,
  getReservationBill,
  markPaymentPaid,
  markPaymentRefunded,
} from "../services/billingService";

function sendError(res: Response, error: any, fallbackMessage: string) {
  console.error(fallbackMessage, error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || fallbackMessage,
  });
}

export async function getBillingOverviewController(req: Request, res: Response) {
  try {
    const result = await getBillingOverview();

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to load billing overview");
  }
}

export async function getReservationBillController(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id);
    const result = await getReservationBill(reservationId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to load reservation bill");
  }
}

export async function createCheckoutSessionController(req: Request, res: Response) {
  try {
    const reservationId = Number(req.body?.reservationId);
    const result = await createCheckoutSession(reservationId);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to create checkout session");
  }
}

export async function markPaymentPaidController(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id);
    const result = await markPaymentPaid(reservationId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to mark payment as paid");
  }
}

export async function markPaymentRefundedController(req: Request, res: Response) {
  try {
    const reservationId = Number(req.params.id);
    const result = await markPaymentRefunded(reservationId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to mark payment as refunded");
  }
}