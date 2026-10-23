import { test } from "node:test";
import assert from "node:assert/strict";
import { sendSuccess, sendError, ApiError, asyncHandler } from "../src/utils/http.js";

/** Minimal Express-style response mock that records status + JSON payload. */
function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

test("sendSuccess emits the standard success envelope", () => {
  const res = mockRes();
  sendSuccess(res, { id: 1 });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, data: { id: 1 } });
});

test("sendSuccess honours a custom status code and extra fields", () => {
  const res = mockRes();
  sendSuccess(res, { id: 2 }, 201, { location: "/cases/2" });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { success: true, location: "/cases/2", data: { id: 2 } });
});

test("sendError emits the standard error envelope", () => {
  const res = mockRes();
  sendError(res, 404, "NOT_FOUND", "Case not found");
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, error: { code: "NOT_FOUND", message: "Case not found" } });
});

test("ApiError carries status and code", () => {
  const err = new ApiError(403, "FORBIDDEN", "No access");
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, "FORBIDDEN");
  assert.equal(err.message, "No access");
  assert.ok(err instanceof Error);
});

test("asyncHandler forwards thrown errors to next()", async () => {
  const next = (e) => {
    thrown = e;
  };
  let thrown = null;
  const handler = asyncHandler(async (_req, _res) => {
    throw new ApiError(500, "SERVER_ERROR", "boom");
  });
  await handler({}, {}, next);
  assert.ok(thrown instanceof ApiError);
  assert.equal(thrown.code, "SERVER_ERROR");
});

test("asyncHandler lets successful handlers run to completion", async () => {
  let ran = false;
  const handler = asyncHandler(async (_req, res) => {
    ran = true;
  });
  await handler({}, mockRes(), () => {});
  assert.equal(ran, true);
});