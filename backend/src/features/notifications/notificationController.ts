import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const listNotifications = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: authUser.id },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
