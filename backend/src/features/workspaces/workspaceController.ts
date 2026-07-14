import crypto from "node:crypto";
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { createActivityLog } from "../../utils/activity.js";
import { sendWorkspaceInvitationEmail } from "../../utils/email.js";

type AuthUser = { id: string; email: string };

const inviteSchema = z.object({
    email: z.string().email(),
});

const acceptInviteSchema = z.object({
    token: z.string().min(1),
});

const INVITE_EXPIRY_HOURS = Number(process.env.WORKSPACE_INVITE_EXPIRY_HOURS || "72");

const getAuthUser = (req: Request) => (req as Request & { user?: AuthUser }).user;
const getParamValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const markExpiredInvitations = async (workspaceId?: string) => {
    await prisma.workspaceInvitation.updateMany({
        where: {
            status: "PENDING",
            expiresAt: { lt: new Date() },
            ...(workspaceId ? { workspaceId } : {}),
        },
        data: { status: "EXPIRED" },
    });
};

const getOwnerMembership = async (workspaceId: string, userId: string) =>
    prisma.workspaceMember.findFirst({
        where: {
            workspaceId,
            userId,
            role: "OWNER",
        },
        include: {
            workspace: true,
        },
    });

export const listWorkspaces = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaces = await prisma.workspace.findMany({
            where: { members: { some: { userId: authUser.id } } },
            include: { members: true },
        });

        return res.status(200).json({ workspaces });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createWorkspace = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Workspace name is required" });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                description,
                members: {
                    create: [{ userId: authUser.id, role: "OWNER" }],
                },
            },
            include: { members: true },
        });

        await createActivityLog({ userId: authUser.id, action: `Created workspace ${workspace.name}`, workspaceId: workspace.id });

        return res.status(201).json({ workspace });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const listWorkspaceInvitations = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceId = getParamValue(req.params.workspaceId);
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const ownerMembership = await getOwnerMembership(workspaceId, authUser.id);
        if (!ownerMembership) {
            return res.status(403).json({ message: "Only workspace owners can view invitations" });
        }

        await markExpiredInvitations(workspaceId);

        const invitations = await prisma.workspaceInvitation.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ invitations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createWorkspaceInvitation = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceId = getParamValue(req.params.workspaceId);
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const body = inviteSchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({ message: body.error.issues[0]?.message || "Invalid invitation payload" });
        }

        const ownerMembership = await getOwnerMembership(workspaceId, authUser.id);
        if (!ownerMembership) {
            return res.status(403).json({ message: "Only workspace owners can invite members" });
        }

        await markExpiredInvitations(workspaceId);

        const email = normalizeEmail(body.data.email);
        const existingWorkspaceMember = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                user: {
                    email: {
                        equals: email,
                        mode: "insensitive",
                    },
                },
            },
        });
        if (existingWorkspaceMember) {
            return res.status(409).json({ message: "User is already a workspace member" });
        }

        const existingActiveInvite = await prisma.workspaceInvitation.findFirst({
            where: {
                workspaceId,
                email,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
        });
        if (existingActiveInvite) {
            return res.status(409).json({ message: "An active invitation already exists for this email" });
        }

        const invitationToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(invitationToken).digest("hex");
        const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

        const invitation = await prisma.workspaceInvitation.create({
            data: {
                workspaceId,
                invitedById: authUser.id,
                email,
                tokenHash,
                expiresAt,
            },
        });

        await sendWorkspaceInvitationEmail({
            to: email,
            workspaceName: ownerMembership.workspace.name,
            invitedByEmail: authUser.email,
            invitationToken,
            expiresAt,
        });

        await createActivityLog({
            userId: authUser.id,
            workspaceId,
            action: `Invited ${email} to workspace ${ownerMembership.workspace.name}`,
        });

        return res.status(201).json({
            invitation,
            ...(process.env.NODE_ENV !== "production" ? { previewToken: invitationToken } : {}),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const resendWorkspaceInvitation = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceId = getParamValue(req.params.workspaceId);
        const invitationId = getParamValue(req.params.invitationId);
        if (!workspaceId || !invitationId) {
            return res.status(400).json({ message: "workspaceId and invitationId are required" });
        }

        const ownerMembership = await getOwnerMembership(workspaceId, authUser.id);
        if (!ownerMembership) {
            return res.status(403).json({ message: "Only workspace owners can resend invitations" });
        }

        await markExpiredInvitations(workspaceId);

        const invitation = await prisma.workspaceInvitation.findFirst({
            where: { id: invitationId, workspaceId },
        });
        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }
        if (invitation.status === "ACCEPTED") {
            return res.status(400).json({ message: "Accepted invitations cannot be resent" });
        }
        if (invitation.status === "REVOKED") {
            return res.status(400).json({ message: "Revoked invitations cannot be resent" });
        }

        const invitationToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(invitationToken).digest("hex");
        const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

        const updatedInvitation = await prisma.workspaceInvitation.update({
            where: { id: invitation.id },
            data: {
                tokenHash,
                expiresAt,
                status: "PENDING",
            },
        });

        await sendWorkspaceInvitationEmail({
            to: invitation.email,
            workspaceName: ownerMembership.workspace.name,
            invitedByEmail: authUser.email,
            invitationToken,
            expiresAt,
        });

        await createActivityLog({
            userId: authUser.id,
            workspaceId,
            action: `Resent workspace invitation to ${invitation.email}`,
        });

        return res.status(200).json({
            invitation: updatedInvitation,
            ...(process.env.NODE_ENV !== "production" ? { previewToken: invitationToken } : {}),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const revokeWorkspaceInvitation = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceId = getParamValue(req.params.workspaceId);
        const invitationId = getParamValue(req.params.invitationId);
        if (!workspaceId || !invitationId) {
            return res.status(400).json({ message: "workspaceId and invitationId are required" });
        }

        const ownerMembership = await getOwnerMembership(workspaceId, authUser.id);
        if (!ownerMembership) {
            return res.status(403).json({ message: "Only workspace owners can revoke invitations" });
        }

        const invitation = await prisma.workspaceInvitation.findFirst({
            where: { id: invitationId, workspaceId },
        });
        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }
        if (invitation.status === "ACCEPTED") {
            return res.status(400).json({ message: "Accepted invitations cannot be revoked" });
        }
        if (invitation.status === "REVOKED") {
            return res.status(200).json({ invitation });
        }

        const updatedInvitation = await prisma.workspaceInvitation.update({
            where: { id: invitation.id },
            data: { status: "REVOKED" },
        });

        await createActivityLog({
            userId: authUser.id,
            workspaceId,
            action: `Revoked workspace invitation for ${invitation.email}`,
        });

        return res.status(200).json({ invitation: updatedInvitation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const acceptWorkspaceInvitation = async (req: Request, res: Response) => {
    try {
        const authUser = getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const body = acceptInviteSchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({ message: body.error.issues[0]?.message || "Token is required" });
        }

        const tokenHash = crypto.createHash("sha256").update(body.data.token).digest("hex");
        const invitation = await prisma.workspaceInvitation.findUnique({
            where: { tokenHash },
            include: { workspace: true },
        });
        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }
        if (invitation.status === "REVOKED") {
            return res.status(400).json({ message: "Invitation has been revoked" });
        }
        if (invitation.status === "ACCEPTED") {
            return res.status(400).json({ message: "Invitation has already been accepted" });
        }
        if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
            if (invitation.status !== "EXPIRED") {
                await prisma.workspaceInvitation.update({
                    where: { id: invitation.id },
                    data: { status: "EXPIRED" },
                });
            }
            return res.status(400).json({ message: "Invitation has expired" });
        }

        if (normalizeEmail(authUser.email) !== normalizeEmail(invitation.email)) {
            return res.status(403).json({ message: "This invitation was sent to a different email" });
        }

        const existingMember = await prisma.workspaceMember.findFirst({
            where: { workspaceId: invitation.workspaceId, userId: authUser.id },
        });

        if (!existingMember) {
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: invitation.workspaceId,
                    userId: authUser.id,
                    role: "MEMBER",
                },
            });
        }

        const acceptedInvitation = await prisma.workspaceInvitation.update({
            where: { id: invitation.id },
            data: {
                status: "ACCEPTED",
                acceptedAt: new Date(),
                acceptedById: authUser.id,
            },
        });

        await createActivityLog({
            userId: authUser.id,
            workspaceId: invitation.workspaceId,
            action: `Accepted invitation to workspace ${invitation.workspace.name}`,
        });

        return res.status(200).json({ invitation: acceptedInvitation, joined: !existingMember });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
