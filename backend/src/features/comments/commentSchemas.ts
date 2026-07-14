import { z } from "zod";

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().trim().min(1).max(1000),
});
