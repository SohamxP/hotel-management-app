import { Request, Response, NextFunction } from "express";

export const DEMO_TOKEN = "hotel-management-demo-token";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== DEMO_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }

  next();
}