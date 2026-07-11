import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./features/auth/authRoutes.js";
import workspaceRoutes from "./features/workspaces/workspaceRoutes.js";
import taskRoutes from "./features/tasks/taskRoutes.js";
import commentRoutes from "./features/comments/commentRoutes.js";
import notificationRoutes from "./features/notifications/notificationRoutes.js";
import reportRoutes from "./features/reports/reportRoutes.js";
import { errorHandler } from "./shared/errorHandler.js";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "TaskManager API is running",
        endpoints: {
            authRegister: "/api/auth/register",
            authLogin: "/api/auth/login",
            workspaces: "/api/workspaces",
            tasks: "/api/tasks",
            notifications: "/api/notifications",
            reports: "/api/reports",
        },
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});