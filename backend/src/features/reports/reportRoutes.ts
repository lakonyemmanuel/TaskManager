import express from "express";
import { getReports } from "./reportController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getReports);

export default router;
