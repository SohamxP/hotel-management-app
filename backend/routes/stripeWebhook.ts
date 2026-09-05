import express from "express";
import { stripeWebhookController } from "../controllers/stripeWebhookController";

const router = express.Router();

router.post(
  "/",
  express.raw({
    type: "application/json",
  }),
  stripeWebhookController
);

export default router;