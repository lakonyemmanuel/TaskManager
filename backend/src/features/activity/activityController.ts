import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const listActivity = async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id: string; email: string } }).user;

  if (!user) {
    return res.status(401).json({ error: { message: "Authentication required", code: "AUTH_REQUIRED" } });
  }

  const activity = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return res.status(200).json({ activity });
};
