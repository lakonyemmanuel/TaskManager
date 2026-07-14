import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { HttpError } from "../../shared/httpError.js";

export const listNotifications = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ notifications });
};
