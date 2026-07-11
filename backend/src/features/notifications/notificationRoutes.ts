import express from "express";
import { listNotifications } from "./notificationController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listNotifications);

export default router;
