import express from "express";
import { login, me, refresh, register } from "./authController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);

export default router;
