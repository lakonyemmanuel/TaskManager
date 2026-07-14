import express from "express";
import { listNotifications } from "./notificationController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.get("/", authenticate, asyncHandler(listNotifications));

export default router;
