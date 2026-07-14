import { NextFunction, Request, Response } from "express";
import { HttpError } from "./httpError.js";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;
  const message = isHttpError ? err.message : "Internal server error";

  if (!isHttpError) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      code: isHttpError ? "REQUEST_FAILED" : "INTERNAL_SERVER_ERROR",
      details: isHttpError ? err.details : undefined,
    },
  });
};
