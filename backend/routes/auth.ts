import express from "express";
import * as authService from "../services/authService";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const result = await authService.login(req.body);

    return res.json(result);
  } catch (error: any) {
    return res
      .status(error.status || 500)
      .json({
        success: false,
        message:
          error.message || "Internal server error",
      });
  }
});

export default router;