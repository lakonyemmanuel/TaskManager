import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { createActivityLog } from "../../utils/activity.js";

export const listWorkspaces = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
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
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
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

export const listMembers = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceIdParam = req.params.workspaceId;
        const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;
        if (!workspaceId) {
            return res.status(400).json({ message: "Workspace id is required" });
        }

        const membership = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: authUser.id, workspaceId } },
        });
        if (!membership) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: {
                user: {
                    select: { id: true, firstname: true, lastName: true, email: true, avatarUrl: true },
                },
            },
        });

        return res.status(200).json({ members });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
