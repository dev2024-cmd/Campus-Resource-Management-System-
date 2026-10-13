import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format for parameter: ${err.path}`;
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "entered value";
    message = `Duplicate value: '${value}' is already in use for '${field}'. Please provide a unique value.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
    errors = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Zod Error
  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Request validation failed";
    errors = err.errors.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // Helmet / CORS / Rate-limit errors
  if (err.name === "CorsError") {
    statusCode = 403;
    message = "Blocked by CORS policy";
  }

  console.error(`[Error] ${req.method} ${req.url} [${statusCode}]: ${message}`, err.stack ? err.stack.split("\n")[1] : "");

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
