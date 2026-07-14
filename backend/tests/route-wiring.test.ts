import assert from "node:assert/strict";
import test from "node:test";

import authRoutes from "../src/features/auth/authRoutes.js";
import activityRoutes from "../src/routes/activityRoutes.js";

const getRoutePaths = (router: { stack?: Array<{ route?: { path?: string; methods?: Record<string, unknown> } }> }) =>
    (router.stack || [])
        .filter((layer) => layer.route)
        .map((layer) => ({
            path: layer.route?.path ?? "",
            methods: Object.keys(layer.route?.methods ?? {}),
        }));

test("auth routes expose refresh endpoint", () => {
    const routes = getRoutePaths(authRoutes);
    assert.ok(routes.some((route) => route.path === "/refresh" && route.methods.includes("post")));
});

test("activity routes expose list endpoint", () => {
    const routes = getRoutePaths(activityRoutes);
    assert.ok(routes.some((route) => route.path === "/" && route.methods.includes("get")));
});
