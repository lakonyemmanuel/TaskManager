import express from "express";
import { createWorkspace, listWorkspaces } from "./workspaceController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listWorkspaces);
router.post("/", authenticate, createWorkspace);

export default router;
