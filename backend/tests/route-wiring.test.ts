import assert from "node:assert/strict";
import test from "node:test";

import authRoutes from "../src/features/auth/authRoutes.ts";
import workspaceRoutes from "../src/features/workspaces/workspaceRoutes.ts";

const getRoutePaths = (router: { stack?: Array<{ route?: { path?: string; methods?: Record<string, unknown> } }> }) =>
    (router.stack || [])
        .filter((layer) => layer.route)
        .map((layer) => ({
            path: layer.route?.path ?? "",
            methods: Object.keys(layer.route?.methods ?? {}),
        }));

test("auth routes expose me endpoint", () => {
    const routes = getRoutePaths(authRoutes);
    assert.ok(routes.some((route) => route.path === "/me" && route.methods.includes("get")));
});

test("workspace routes expose invitation endpoints", () => {
    const routes = getRoutePaths(workspaceRoutes);
    assert.ok(routes.some((route) => route.path === "/:workspaceId/invitations" && route.methods.includes("post")));
    assert.ok(routes.some((route) => route.path === "/invitations/accept" && route.methods.includes("post")));
});
