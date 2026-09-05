import express from "express";
import { verifyToken, authorize } from "../middleware/auth";
import {
  createCheckoutSessionController,
  getBillingOverviewController,
  getReservationBillController,
  markPaymentPaidController,
  markPaymentRefundedController,
  syncStripeSessionController,
} from "../controllers/billingController";

const router = express.Router();

router.get(
  "/overview",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getBillingOverviewController
);

router.get(
  "/reservations/:id",
  verifyToken,
  authorize("Manager", "Front Desk"),
  getReservationBillController
);

router.post(
  "/checkout",
  verifyToken,
  authorize("Manager", "Front Desk"),
  createCheckoutSessionController
);

router.post(
  "/sync-session",
  verifyToken,
  authorize("Manager", "Front Desk"),
  syncStripeSessionController
);

router.post(
  "/:id/mark-paid",
  verifyToken,
  authorize("Manager", "Front Desk"),
  markPaymentPaidController
);

router.post(
  "/:id/refund",
  verifyToken,
  authorize("Manager"),
  markPaymentRefundedController
);

export default router;