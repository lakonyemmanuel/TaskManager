import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { createActivityLog } from "../utils/activity.js";

export const listComments = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: string; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const taskIdParam = req.params.taskId;
        const taskId = Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam;

        if (!taskId) {
            return res.status(400).json({ message: "Task id is required" });
        }

        const comments = await prisma.taskComment.findMany({
            where: { taskId },
            orderBy: { createdAt: "asc" },
        });

        res.status(200).json({ comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: string; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { taskId, content } = req.body;

        if (!taskId || !content) {
            return res.status(400).json({ message: "Task id and content are required" });
        }

        const comment = await prisma.taskComment.create({
            data: {
                content,
                taskId,
                authorId: user.id,
            },
        });

        await createActivityLog({
            userId: user.id,
            action: `Commented on task ${taskId}`,
        });

        res.status(201).json({ comment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
