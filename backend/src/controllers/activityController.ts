import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const listActivity = async (req: Request, res: Response) => {
    try {
        const user = (req as Request & { user?: { id: string; email: string } }).user;

        if (!user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const activity = await prisma.activityLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        res.status(200).json({ activity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
