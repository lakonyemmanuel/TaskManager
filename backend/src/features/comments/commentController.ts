import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { createActivityLog } from "../../utils/activity.js";
import { HttpError } from "../../shared/httpError.js";

export const listComments = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const taskIdParam = req.params.taskId;
  const taskId = Array.isArray(taskIdParam) ? taskIdParam[0] : taskIdParam;
  if (!taskId) {
    throw new HttpError(400, "Task id is required");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: { include: { members: true } } },
  });

  if (!task || !task.workspace.members.some((member) => member.userId === authUser.id)) {
    throw new HttpError(403, "You are not allowed to view comments for this task");
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: { author: true },
  });

  return res.status(200).json({ comments });
};

export const createComment = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const { taskId, content } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: { include: { members: true } } },
  });

  if (!task || !task.workspace.members.some((member) => member.userId === authUser.id)) {
    throw new HttpError(403, "You are not allowed to comment on this task");
  }

  const comment = await prisma.taskComment.create({
    data: {
      content,
      taskId,
      authorId: authUser.id,
    },
    include: { author: true },
  });

  await createActivityLog({ userId: authUser.id, action: `Commented on task ${taskId}`, taskId });

  return res.status(201).json({ comment });
};
