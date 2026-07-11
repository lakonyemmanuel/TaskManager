import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const listTasks = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: number; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const workspaceId = req.query.workspaceId as string | undefined;

        const tasks = await prisma.task.findMany({
            where: workspaceId ? { workspaceId } : {},
            include: {
                workspace: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: number; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { title, description, priority, status, workspaceId } = req.body;

        if (!title || !workspaceId) {
            return res.status(400).json({ message: "Title and workspaceId are required" });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                status: status || "TODO",
                workspaceId,
            },
        });

        res.status(201).json({ task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status, priority } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Task id is required" });
        }

        const task = await prisma.task.update({
            where: { id },
            data: { status, priority },
        });

        res.status(200).json({ task });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
