import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import roomsRoute from "./routes/rooms";
import reportsRoute from "./routes/reports";
import authRoute from "./routes/auth";
import reservationRoutes from "./routes/reservations";
import guestRoutes from "./routes/guests";
import serviceRoutes from "./routes/services";
import aiRoutes from "./routes/ai";
import qualityRoutes from "./routes/quality";
import billingRoutes from "./routes/billing";
import healthRoutes from "./routes/health";
import stripeWebhookRoute from "./routes/stripeWebhook";

import {
  stripeCancelledPageController,
  stripeSuccessPageController,
} from "./controllers/billingController";

import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  "/api/webhooks/stripe",
  stripeWebhookRoute
);

app.use(express.json());

app.get("/payment-success", stripeSuccessPageController);
app.get("/payment-cancelled", stripeCancelledPageController);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoute);
app.use("/api/rooms", roomsRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/billing", billingRoutes);

app.get("/", (req, res) => {
  res.send("Hotel Management API is running");
});

app.use(errorHandler);

export default app;