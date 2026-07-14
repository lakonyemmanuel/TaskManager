import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { createActivityLog } from "../../utils/activity.js";
import { HttpError } from "../../shared/httpError.js";

export const listTasks = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const workspaceId = req.query.workspaceId as string | undefined;
  const workspaceFilter = workspaceId
    ? { workspaceId, workspace: { members: { some: { userId: authUser.id } } } }
    : { workspace: { members: { some: { userId: authUser.id } } } };

  const tasks = await prisma.task.findMany({
    where: workspaceFilter,
    include: { assignedTo: true, workspace: true },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ tasks });
};

export const createTask = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const { title, description, priority, status, workspaceId, assignedToId, dueDate } = req.body;

  const member = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId: authUser.id } });
  if (!member) {
    throw new HttpError(403, "You are not a member of this workspace");
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      status: status || "TODO",
      workspaceId,
      assignedToId: assignedToId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  await createActivityLog({ userId: authUser.id, action: `Created task ${task.title}`, workspaceId, taskId: task.id });

  return res.status(201).json({ task });
};

export const updateTask = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id) {
    throw new HttpError(400, "Task id is required");
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  });

  if (!existingTask) {
    throw new HttpError(404, "Task not found");
  }

  if (!existingTask.workspace.members.some((member) => member.userId === authUser.id)) {
    throw new HttpError(403, "You are not allowed to update this task");
  }

  const { title, description, priority, status, assignedToId, dueDate } = req.body;

  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      priority,
      status,
      assignedToId: assignedToId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  await createActivityLog({ userId: authUser.id, action: `Updated task ${task.title}`, workspaceId: task.workspaceId, taskId: task.id });

  return res.status(200).json({ task });
};

export const deleteTask = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id) {
    throw new HttpError(400, "Task id is required");
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  });

  if (!existingTask) {
    throw new HttpError(404, "Task not found");
  }

  if (!existingTask.workspace.members.some((member) => member.userId === authUser.id)) {
    throw new HttpError(403, "You are not allowed to delete this task");
  }

  const task = await prisma.task.delete({ where: { id } });

  await createActivityLog({ userId: authUser.id, action: `Deleted task ${task.title}`, workspaceId: task.workspaceId, taskId: task.id });

  return res.status(200).json({ message: "Task deleted" });
};
