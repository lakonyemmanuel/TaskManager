import assert from "node:assert/strict";
import test from "node:test";

import prisma from "../src/lib/prisma.ts";

test("Prisma can read the users table without schema errors", async () => {
    const users = await prisma.user.findMany({ take: 1 });
    assert.ok(Array.isArray(users));
});
