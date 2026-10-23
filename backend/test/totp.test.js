import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateBase32Secret,
  base32Decode,
  generateTotpCode,
  verifyTotpCode,
} from "../src/utils/totp.js";

test("generateBase32Secret returns a valid base32 string", () => {
  const secret = generateBase32Secret();
  assert.ok(/^[A-Z2-7]+$/.test(secret), `expected base32, got ${secret}`);
  assert.ok(secret.length >= 16);
});

test("base32Decode round-trips to a non-empty key", () => {
  const secret = generateBase32Secret();
  const key = base32Decode(secret);
  assert.ok(Buffer.isBuffer(key));
  assert.ok(key.length > 0);
});

test("generateTotpCode returns a 6-digit string", () => {
  const secret = generateBase32Secret();
  const code = generateTotpCode(secret, 1000);
  assert.match(code, /^\d{6}$/);
});

test("verifyTotpCode accepts a freshly generated code", () => {
  const secret = generateBase32Secret();
  const now = 1_700_000_000_000;
  const step = Math.floor(now / 1000 / 30);
  const code = generateTotpCode(secret, step);
  assert.equal(verifyTotpCode(secret, code, now), true);
});

test("verifyTotpCode tolerates one time-step of drift", () => {
  const secret = generateBase32Secret();
  const currentStep = 1000;
  // A code generated for the PREVIOUS step should still verify when "now" is at currentStep.
  const code = generateTotpCode(secret, currentStep - 1);
  const nowAtCurrentStep = currentStep * 30 * 1000 + 1000;
  assert.equal(verifyTotpCode(secret, code, nowAtCurrentStep), true);
});

test("verifyTotpCode rejects a wrong code", () => {
  const secret = generateBase32Secret();
  const now = 1_700_000_000_000;
  const step = Math.floor(now / 1000 / 30);
  const code = generateTotpCode(secret, step);
  const wrong = (parseInt(code, 10) + 1) % 1_000_000;
  const wrongCode = wrong.toString().padStart(6, "0");
  assert.equal(verifyTotpCode(secret, wrongCode, now), false);
});

test("verifyTotpCode rejects malformed input", () => {
  const secret = generateBase32Secret();
  assert.equal(verifyTotpCode(secret, "12345", 1_700_000_000_000), false);
  assert.equal(verifyTotpCode(secret, "abcdef", 1_700_000_000_000), false);
  assert.equal(verifyTotpCode("", "123456", 1_700_000_000_000), false);
});