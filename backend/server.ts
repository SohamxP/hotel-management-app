import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import roomsRoute from "./routes/rooms";
import reportsRoute from "./routes/reports";
import authRoute from "./routes/auth";
import reservationRoutes from "./routes/reservations";
import guestRoutes from "./routes/guests";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/rooms", roomsRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/reservations", reservationRoutes);
app.use("/api/guests", guestRoutes);

app.get("/", (req, res) => {
  res.send("Hotel Management API is running");
});

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});