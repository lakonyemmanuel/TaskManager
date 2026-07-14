import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import authRoutes from "./features/auth/authRoutes.js";
import workspaceRoutes from "./features/workspaces/workspaceRoutes.js";
import taskRoutes from "./features/tasks/taskRoutes.js";
import commentRoutes from "./features/comments/commentRoutes.js";
import notificationRoutes from "./features/notifications/notificationRoutes.js";
import reportRoutes from "./features/reports/reportRoutes.js";
import activityRoutes from "./features/activity/activityRoutes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./shared/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(helmet());
app.use(rateLimit);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TaskManager API is running",
    version: "1.0.0",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/activity", activityRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Route not found", code: "ROUTE_NOT_FOUND" } });
});

app.use(errorHandler);

export default app;
