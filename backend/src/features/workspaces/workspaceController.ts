import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { createActivityLog } from "../../utils/activity.js";
import { HttpError } from "../../shared/httpError.js";

export const listWorkspaces = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: authUser.id } } },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({ workspaces });
};

export const createWorkspace = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const { name, description } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      members: {
        create: [{ userId: authUser.id, role: "OWNER" }],
      },
    },
    include: { members: true },
  });

  await createActivityLog({ userId: authUser.id, action: `Created workspace ${workspace.name}`, workspaceId: workspace.id });

  return res.status(201).json({ workspace });
};
