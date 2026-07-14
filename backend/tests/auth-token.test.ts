import assert from "node:assert/strict";
import test from "node:test";

import { signAccessToken, signRefreshToken, verifyToken } from "../src/utils/auth.ts";

test("signAccessToken marks token as access", () => {
  const token = signAccessToken({ id: "user-1", email: "user@example.com" });
  const payload = verifyToken(token);
  assert.equal(payload.type, "access");
  assert.equal(payload.id, "user-1");
});

test("signRefreshToken marks token as refresh", () => {
  const token = signRefreshToken({ id: "user-1", email: "user@example.com" });
  const payload = verifyToken(token);
  assert.equal(payload.type, "refresh");
});
