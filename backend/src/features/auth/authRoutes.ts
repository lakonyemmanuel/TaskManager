import express from "express";
import { login, me, refresh, register } from "./authController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateBody } from "../../shared/validation.js";
import { loginSchema, refreshSchema, registerSchema } from "./authSchemas.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.post("/refresh", validateBody(refreshSchema), asyncHandler(refresh));
router.get("/me", authenticate, asyncHandler(me));

export default router;
