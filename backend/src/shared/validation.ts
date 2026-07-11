import { Request, Response, NextFunction } from "express";

export const validateBody = (schema: { safeParse: (value: unknown) => { success: boolean; error?: { issues?: Array<{ message: string }> }; data?: unknown } }) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body) as { success: boolean; error?: { issues?: Array<{ message: string }> }; data?: unknown };

        if (!result.success) {
            return res.status(400).json({ message: result.error?.issues?.[0]?.message || "Validation failed" });
        }

        req.body = result.data as Record<string, unknown>;
        next();
    };
