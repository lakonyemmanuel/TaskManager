import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
    acceptWorkspaceInvitation,
    createWorkspaceInvitation,
} from "../src/features/workspaces/workspaceController.ts";
import prisma from "../src/lib/prisma.ts";

type MockResponse = {
    statusCode: number;
    body: unknown;
    status: (code: number) => MockResponse;
    json: (payload: unknown) => MockResponse;
};

const restoreStack: Array<() => void> = [];

const stubMethod = <T extends Record<string, unknown>, K extends keyof T>(target: T, key: K, replacement: T[K]) => {
    const original = target[key];
    target[key] = replacement;
    restoreStack.push(() => {
        target[key] = original;
    });
};

const createMockResponse = (): MockResponse => {
    const response: MockResponse = {
        statusCode: 200,
        body: undefined,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
    };

    return response;
};

afterEach(() => {
    while (restoreStack.length) {
        const restore = restoreStack.pop();
        restore?.();
    }
});

test("createWorkspaceInvitation rejects non-owner users", async () => {
    stubMethod(prisma.workspaceMember as unknown as Record<string, unknown>, "findFirst", async () => null);

    const req = {
        params: { workspaceId: "workspace-1" },
        body: { email: "member@example.com" },
        user: { id: "user-1", email: "owner@example.com" },
    };
    const res = createMockResponse();

    await createWorkspaceInvitation(req as never, res as never);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: "Only workspace owners can invite members" });
});

test("createWorkspaceInvitation creates pending invitation for owner", async () => {
    let findFirstCalls = 0;
    stubMethod(prisma.workspaceMember as unknown as Record<string, unknown>, "findFirst", async () => {
        findFirstCalls += 1;
        if (findFirstCalls === 1) {
            return {
                id: "member-1",
                workspaceId: "workspace-1",
                userId: "owner-1",
                role: "OWNER",
                workspace: { id: "workspace-1", name: "Core Team", description: null },
            };
        }
        return null;
    });
    stubMethod(prisma.workspaceInvitation as unknown as Record<string, unknown>, "updateMany", async () => ({ count: 0 }));
    stubMethod(prisma.workspaceInvitation as unknown as Record<string, unknown>, "findFirst", async () => null);
    stubMethod(prisma.workspaceInvitation as unknown as Record<string, unknown>, "create", async () => ({
        id: "invite-1",
        workspaceId: "workspace-1",
        invitedById: "owner-1",
        acceptedById: null,
        email: "member@example.com",
        tokenHash: "hashed-token",
        status: "PENDING",
        expiresAt: new Date("2030-01-01T00:00:00Z"),
        acceptedAt: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
    }));
    stubMethod(prisma.activityLog as unknown as Record<string, unknown>, "create", async () => ({ id: "activity-1" }));

    const req = {
        params: { workspaceId: "workspace-1" },
        body: { email: "Member@Example.com" },
        user: { id: "owner-1", email: "owner@example.com" },
    };
    const res = createMockResponse();

    await createWorkspaceInvitation(req as never, res as never);

    assert.equal(res.statusCode, 201);
    assert.equal((res.body as { invitation: { status: string } }).invitation.status, "PENDING");
});

test("acceptWorkspaceInvitation creates membership and marks invitation accepted", async () => {
    stubMethod(prisma.workspaceInvitation as unknown as Record<string, unknown>, "findUnique", async () => ({
        id: "invite-2",
        workspaceId: "workspace-2",
        invitedById: "owner-1",
        acceptedById: null,
        email: "invitee@example.com",
        tokenHash: "hashed-token",
        status: "PENDING",
        expiresAt: new Date("2030-01-01T00:00:00Z"),
        acceptedAt: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
        workspace: { id: "workspace-2", name: "Marketing" },
    }));
    stubMethod(prisma.workspaceMember as unknown as Record<string, unknown>, "findFirst", async () => null);
    let membershipCreateCalls = 0;
    stubMethod(prisma.workspaceMember as unknown as Record<string, unknown>, "create", async () => {
        membershipCreateCalls += 1;
        return { id: "member-2" };
    });
    stubMethod(prisma.workspaceInvitation as unknown as Record<string, unknown>, "update", async () => ({ id: "invite-2", status: "ACCEPTED" }));
    stubMethod(prisma.activityLog as unknown as Record<string, unknown>, "create", async () => ({ id: "activity-2" }));

    const req = {
        body: { token: "plain-token" },
        user: { id: "invitee-1", email: "invitee@example.com" },
    };
    const res = createMockResponse();

    await acceptWorkspaceInvitation(req as never, res as never);

    assert.equal(res.statusCode, 200);
    assert.equal(membershipCreateCalls, 1);
    assert.equal((res.body as { joined: boolean }).joined, true);
});
