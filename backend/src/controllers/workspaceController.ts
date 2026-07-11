import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const listWorkspaces = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: string; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                members: true,
            },
        });

        res.status(200).json({ workspaces });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createWorkspace = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: string; email: string } }).user;

        if (!user) {
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
                    create: [{ userId: user.id, role: "OWNER" }],
                },
            },
            include: {
                members: true,
            },
        });

        res.status(201).json({ workspace });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
