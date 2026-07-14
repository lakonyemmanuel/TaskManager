import express from "express";
import { createWorkspace, listWorkspaces } from "./workspaceController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateBody } from "../../shared/validation.js";
import { createWorkspaceSchema } from "./workspaceSchemas.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.get("/", authenticate, asyncHandler(listWorkspaces));
router.post("/", authenticate, validateBody(createWorkspaceSchema), asyncHandler(createWorkspace));

export default router;
