import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const requestTracker = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  const now = Date.now();
  const current = requestTracker.get(key);

  if (!current || now > current.resetAt) {
    requestTracker.set(key, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (current.count >= env.RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({
      error: {
        message: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
      },
    });
  }

  current.count += 1;
  requestTracker.set(key, current);
  return next();
};
