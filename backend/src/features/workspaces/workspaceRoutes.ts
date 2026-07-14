import express from "express";
import {
    acceptWorkspaceInvitation,
    createWorkspace,
    createWorkspaceInvitation,
    listWorkspaceInvitations,
    listWorkspaces,
    resendWorkspaceInvitation,
    revokeWorkspaceInvitation,
} from "./workspaceController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listWorkspaces);
router.post("/", authenticate, createWorkspace);
router.get("/:workspaceId/invitations", authenticate, listWorkspaceInvitations);
router.post("/:workspaceId/invitations", authenticate, createWorkspaceInvitation);
router.post("/:workspaceId/invitations/:invitationId/resend", authenticate, resendWorkspaceInvitation);
router.post("/:workspaceId/invitations/:invitationId/revoke", authenticate, revokeWorkspaceInvitation);
router.post("/invitations/accept", authenticate, acceptWorkspaceInvitation);

export default router;
