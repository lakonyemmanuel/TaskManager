import express from "express";
import { getReports } from "./reportController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.get("/", authenticate, asyncHandler(getReports));

export default router;
