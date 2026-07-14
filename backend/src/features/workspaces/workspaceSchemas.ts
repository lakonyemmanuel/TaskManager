import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(250).optional().nullable(),
});
