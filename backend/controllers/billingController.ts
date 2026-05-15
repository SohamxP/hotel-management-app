import { Request, Response } from "express";
import {
  createCheckoutSession,
  getBillingOverview,
  getReservationBill,
  handleStripeCancelledRedirect,
  handleStripeSuccessRedirect,
  markPaymentPaid,
  markPaymentRefunded,
  syncStripeCheckoutSession,
} from "../services/billingService";

function sendError(res: Response, error: any, fallbackMessage: string) {
  console.error(fallbackMessage, error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || fallbackMessage,
  });
}

function htmlPage({
  title,
  message,
  status,
  details,
}: {
  title: string;
  message: string;
  status: "success" | "warning" | "error";
  details?: string[];
}) {
  const color =
    status === "success" ? "#22c55e" : status === "warning" ? "#f59e0b" : "#ef4444";

  const detailHtml = details?.length
    ? `<div class="details">${details.map((item) => `<p>${item}</p>`).join("")}</div>`
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #07111f;
            color: #e5eefc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .card {
            width: min(680px, calc(100% - 32px));
            background: #101c2e;
            border: 1px solid #24344d;
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          }
          .badge {
            display: inline-flex;
            border: 1px solid ${color};
            color: ${color};
            border-radius: 999px;
            padding: 8px 12px;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          h1 {
            margin: 18px 0 10px;
            font-size: 32px;
          }
          p {
            color: #aab8cf;
            line-height: 1.55;
            font-size: 16px;
          }
          .details {
            margin-top: 18px;
            background: #0b1524;
            border: 1px solid #24344d;
            border-radius: 16px;
            padding: 14px;
          }
          .details p {
            margin: 6px 0;
            color: #e5eefc;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <span class="badge">${status}</span>
          <h1>${title}</h1>
          <p>${message}</p>
          ${detailHtml}
          <p>You can close this page and return to the Hotel Management app.</p>
        </main>
      </body>
    </html>
  `;
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

export async function syncStripeSessionController(req: Request, res: Response) {
  try {
    const stripeSessionId = String(req.body?.stripeSessionId || "");
    const result = await syncStripeCheckoutSession(stripeSessionId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendError(res, error, "Failed to sync Stripe session");
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

export async function stripeSuccessPageController(req: Request, res: Response) {
  try {
    const stripeSessionId = String(req.query.session_id || "");
    const result = await handleStripeSuccessRedirect(stripeSessionId);

    res.send(
      htmlPage({
        title: "Payment synced successfully",
        message:
          result.paymentStatus === "paid"
            ? "Stripe confirmed this checkout as paid, and the hotel billing record has been updated."
            : "The Stripe session was found, but Stripe has not marked the payment as paid yet.",
        status: result.paymentStatus === "paid" ? "success" : "warning",
        details: [
          `Stripe session: ${result.session.id}`,
          `Stripe payment status: ${result.session.paymentStatus}`,
          `Stripe session status: ${result.session.sessionStatus}`,
          `Reservation ID: ${result.session.reservationId || "N/A"}`,
        ],
      })
    );
  } catch (error: any) {
    res
      .status(error.status || 500)
      .send(
        htmlPage({
          title: "Payment sync failed",
          message: error.message || "The payment was completed, but the app could not sync it.",
          status: "error",
        })
      );
  }
}

export async function stripeCancelledPageController(req: Request, res: Response) {
  const result = await handleStripeCancelledRedirect();

  res.send(
    htmlPage({
      title: "Checkout cancelled",
      message: result.message,
      status: "warning",
    })
  );
}