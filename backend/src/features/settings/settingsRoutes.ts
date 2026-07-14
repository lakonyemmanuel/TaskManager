import express from "express";
import { getSettings, updateProfile } from "./settingsController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getSettings);
router.patch("/profile", authenticate, updateProfile);

export default router;
