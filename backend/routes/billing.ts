import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createCheckoutSessionController,
  getBillingOverviewController,
  getReservationBillController,
  markPaymentPaidController,
  markPaymentRefundedController,
  syncStripeSessionController,
} from "../controllers/billingController";

const router = express.Router();

router.get("/overview", verifyToken, getBillingOverviewController);
router.get("/reservations/:id", verifyToken, getReservationBillController);
router.post("/checkout", verifyToken, createCheckoutSessionController);
router.post("/sync-session", verifyToken, syncStripeSessionController);
router.post("/:id/mark-paid", verifyToken, markPaymentPaidController);
router.post("/:id/refund", verifyToken, markPaymentRefundedController);

export default router;