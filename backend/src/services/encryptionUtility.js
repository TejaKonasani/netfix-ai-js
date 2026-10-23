import crypto from "crypto";
class EncryptionUtility {
  keyBuffer;
  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required but not set");
    }
    if (key.length !== 64) {
      throw new Error(
        `ENCRYPTION_KEY must be a 64-character hex string (32 bytes), got ${key.length} characters`
      );
    }
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(
        "ENCRYPTION_KEY contains non-hex characters \u2014 must be a valid lowercase hex string"
      );
    }
    this.keyBuffer = Buffer.from(key, "hex");
  }
  /**
   * AES-256-GCM encrypt.
   * Returns base64url string encoding: IV(12 bytes) || AuthTag(16 bytes) || Ciphertext(N bytes)
   * Generates a fresh 12-byte random IV on every call.
   * Throws TypeError if plaintext is not a string.
   */
  encrypt(plaintext) {
    if (typeof plaintext !== "string") {
      throw new TypeError(`plaintext must be a string, received: ${typeof plaintext}`);
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.keyBuffer, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString("base64url");
  }
  /**
   * AES-256-GCM decrypt.
   * Accepts the base64url output of encrypt().
   * Returns original plaintext with byte-for-byte fidelity.
   * Throws descriptive error if payload is tampered, truncated, or structurally invalid.
   * Never returns corrupt or partial plaintext.
   */
  decrypt(payload) {
    if (typeof payload !== "string") {
      throw new Error("Decryption failed: invalid payload encoding");
    }
    let combined;
    try {
      combined = Buffer.from(payload, "base64url");
    } catch {
      throw new Error("Decryption failed: invalid payload encoding");
    }
    if (combined.length < 28) {
      throw new Error("Decryption failed: payload too short to contain IV and auth tag");
    }
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const ciphertext = combined.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.keyBuffer, iv);
    decipher.setAuthTag(authTag);
    try {
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      return decrypted.toString("utf8");
    } catch {
      throw new Error("Decryption failed: authentication tag mismatch");
    }
  }
}
function createEncryptionUtility() {
  if (!process.env.ENCRYPTION_KEY) {
    return null;
  }
  try {
    return new EncryptionUtility();
  } catch {
    return null;
  }
}
const encryptionUtility = createEncryptionUtility();
export {
  EncryptionUtility,
  encryptionUtility
};
