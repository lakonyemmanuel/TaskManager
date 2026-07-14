import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { HttpError } from "../../shared/httpError.js";

export const getReports = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const tasks = await prisma.task.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: authUser.id,
          },
        },
      },
    },
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
};
