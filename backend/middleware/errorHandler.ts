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
  const status = error.status || 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    success: false,
    error:
      error.message ||
      "Internal server error",
  });
}