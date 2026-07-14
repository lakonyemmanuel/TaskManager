import express from "express";
import { createWorkspace, listMembers, listWorkspaces } from "./workspaceController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listWorkspaces);
router.post("/", authenticate, createWorkspace);
router.get("/:workspaceId/members", authenticate, listMembers);

export default router;
