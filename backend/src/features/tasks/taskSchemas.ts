import { z } from "zod";
import { TaskPriority, TaskStatus } from "../../../generated/prisma/enums.js";

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  workspaceId: z.string().min(1),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});
