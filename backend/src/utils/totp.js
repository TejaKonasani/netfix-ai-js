/**
 * NETFIX AI — TOTP (RFC 6238) utilities
 *
 * Extracted from adminAuthController.js so the MFA logic is reusable
 * and unit-testable in isolation.
 */
import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Generate a random base32 secret of the given byte length. */
export function generateBase32Secret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += ALPHABET[bytes[i] % 32];
  }
  return secret;
}

/** Decode a base32 string to a Buffer. */
export function base32Decode(base32) {
  const cleaned = base32.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const output = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      output.push(value >>> bits - 8 & 255);
      bits -= 8;
      value = value & (1 << bits) - 1;
    }
  }
  return Buffer.from(output);
}

/** Compute the 6-digit TOTP code for a given 30-second time step. */
export function generateTotpCode(secretBase32, timeStepWindow) {
  const key = base32Decode(secretBase32);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStepWindow), 0);
  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const codeInt =
    (hmac[offset] & 127) << 24 |
    (hmac[offset + 1] & 255) << 16 |
    (hmac[offset + 2] & 255) << 8 |
    hmac[offset + 3] & 255;
  return (codeInt % 1e6).toString().padStart(6, "0");
}

/**
 * Verify a 6-digit TOTP code, allowing one time step of drift on each side.
 * Returns true only when the code matches the expected window.
 */
export function verifyTotpCode(secretBase32, inputCode, now = Date.now()) {
  if (!secretBase32 || !inputCode || !/^\d{6}$/.test(inputCode)) {
    return false;
  }
  const currentStep = Math.floor(now / 1e3 / 30);
  for (let step = currentStep - 1; step <= currentStep + 1; step++) {
    if (generateTotpCode(secretBase32, step) === inputCode) {
      return true;
    }
  }
  return false;
}