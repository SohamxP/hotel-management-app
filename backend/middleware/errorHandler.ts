import {
  NextFunction,
  Request,
  Response,
} from "express";

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(error);

  const status = error.status || 500;

  res.status(status).json({
    success: false,
    error:
      error.message ||
      "Internal server error",
  });
}