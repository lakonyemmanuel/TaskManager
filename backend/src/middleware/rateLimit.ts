import { rateLimit as createRateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimit = createRateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
});
