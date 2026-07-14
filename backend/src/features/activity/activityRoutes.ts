import express from "express";
import { listActivity } from "./activityController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.get("/", authenticate, asyncHandler(listActivity));

export default router;
