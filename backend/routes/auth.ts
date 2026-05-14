import express from "express";
import { DEMO_TOKEN } from "../middleware/auth";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      success: true,
      token: DEMO_TOKEN,
      user: {
        username: "admin",
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

export default router;