import express from "express";
import { listActivity } from "./activityController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

const router = express.Router();

router.get("/", authenticate, asyncHandler(listActivity));

export default router;
