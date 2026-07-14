import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf-8");

test("Prisma schema contains required core models", () => {
  for (const modelName of ["User", "Workspace", "Task", "TaskComment", "ActivityLog"]) {
    assert.ok(schema.includes(`model ${modelName} `), `Expected model ${modelName} to exist in schema`);
  }
});

test("Prisma schema defines task and activity indexes", () => {
  assert.ok(schema.includes("@@index([workspaceId, status])"));
  assert.ok(schema.includes("@@index([userId, createdAt])"));
});
