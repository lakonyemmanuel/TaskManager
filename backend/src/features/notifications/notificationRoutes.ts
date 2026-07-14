import express from "express";
import { listNotifications, getUnreadCount, markAllRead, markAsRead } from "./notificationController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listNotifications);
router.get("/unread-count", authenticate, getUnreadCount);
router.patch("/:id/read", authenticate, markAsRead);
router.post("/read-all", authenticate, markAllRead);

export default router;
