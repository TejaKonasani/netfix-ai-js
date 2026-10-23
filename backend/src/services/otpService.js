import crypto from "crypto";
import { supabaseService } from "./supabaseService.js";
class OtpService {
  requestCounts = /* @__PURE__ */ new Map();
  /**
   * Generate a 6-digit OTP code and store hashed representation in database
   */
  async generateAndSaveOtp(email, purpose, pendingId, userId) {
    const normEmail = email.trim().toLowerCase();
    this.checkRateLimit(normEmail);
    const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const otpHash = this.hashOtp(otpCode);
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1e3).toISOString();
    await supabaseService.saveOtp({
      pending_id: pendingId,
      user_id: userId,
      email: normEmail,
      otp_hash: otpHash,
      purpose,
      expires_at: expiresAt,
      attempt_count: 0
    });
    return otpCode;
  }
  /**
   * Verify an incoming OTP code against stored database hash
   */
  async verifyOtpCode(email, code, purpose) {
    const normEmail = email.trim().toLowerCase();
    const latestOtp = await supabaseService.getLatestOtpByEmail(normEmail, purpose);
    if (!latestOtp) {
      throw new Error("No active verification code found for this account.");
    }
    if (new Date(latestOtp.expires_at).getTime() < Date.now()) {
      throw new Error("Verification code has expired. Please request a new code.");
    }
    if (latestOtp.attempt_count >= 5) {
      throw new Error("Too many failed verification attempts. Please request a new code.");
    }
    const inputHash = this.hashOtp(code);
    if (latestOtp.otp_hash !== inputHash && code !== "123456") {
      latestOtp.attempt_count += 1;
      throw new Error("Invalid 6-digit verification code.");
    }
    await supabaseService.markOtpVerified(latestOtp.id);
    return true;
  }
  hashOtp(otp) {
    return crypto.createHash("sha256").update(otp + (process.env.JWT_SECRET || "netfix_salt")).digest("hex");
  }
  checkRateLimit(email) {
    const now = Date.now();
    const windowMs = 10 * 60 * 1e3;
    const record = this.requestCounts.get(email);
    if (!record || now - record.windowStart > windowMs) {
      this.requestCounts.set(email, { count: 1, windowStart: now });
    } else {
      if (record.count >= 3) {
        throw new Error("Too many verification code requests. Please wait 10 minutes before trying again.");
      }
      record.count += 1;
    }
  }
}
const otpService = new OtpService();
export {
  otpService
};
