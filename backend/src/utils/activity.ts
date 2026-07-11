import prisma from "../lib/prisma.js";

export const createActivityLog = async ({
    userId,
    action,
    workspaceId,
    taskId,
}: {
    userId: string;
    action: string;
    workspaceId?: string;
    taskId?: string;
}) => {
    return prisma.activityLog.create({
        data: {
            userId,
            action,
            workspaceId,
            taskId,
        },
    });
};
