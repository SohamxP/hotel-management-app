import {
  Request,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  userId: number;
  employeeId: number;
  username: string;
  role: string;
};

export interface AuthenticatedRequest
  extends Request {
  user?: AuthUser;
}

export function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      error: "No authorization token provided",
    });
  }

  const token = authHeader.substring(7);

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: "JWT configuration error",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      secret
    ) as AuthUser;

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action",
      });
    }

    next();
  };
}