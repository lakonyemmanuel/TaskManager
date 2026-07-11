import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const getReports = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const tasks = await prisma.task.findMany({
            include: { workspace: true },
        });

        const completed = tasks.filter((task) => task.status === "COMPLETED").length;
        const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
        const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date()).length;

        return res.status(200).json({
            summary: {
                total: tasks.length,
                completed,
                inProgress,
                overdue,
            },
            tasks,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
