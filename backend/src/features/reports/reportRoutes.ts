import express from "express";
import { getReports } from "./reportController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

const router = express.Router();

router.get("/", authenticate, asyncHandler(getReports));

export default router;
