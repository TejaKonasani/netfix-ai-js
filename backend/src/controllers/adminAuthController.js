import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { jwtSecret, jwtExpiry } from "../config/index.js";
import { setAdminSessionCookie, clearAdminSessionCookie } from "../utils/cookies.js";
import { generateBase32Secret, verifyTotpCode } from "../utils/totp.js";
import { sendSuccess, sendError } from "../utils/http.js";
const tempAuthStore = /* @__PURE__ */ new Map();
const adminAuthController = {
  /**
   * POST /api/v1/admin/auth/login-step1
   * Step 1: Admin Password Verification
   */
  async loginStep1(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Enter a valid email address.");
      }
      if (!password) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Password is required.");
      }
      const normEmail = email.trim().toLowerCase();
      const admin = await supabaseService.getAdminByEmail(normEmail);
      if (!admin) {
        await auditService.log("ADMIN_LOGIN_FAILED_UNKNOWN_EMAIL", "Anonymous Admin", normEmail, "AdminAuth", "admin");
        return sendError(res, 401, "INVALID_CREDENTIALS", "Unable to verify administrator credentials.");
      }
      let isMatch = await bcrypt.compare(password, admin.password_hash).catch(() => false);
      if (!isMatch) {
        await auditService.log("ADMIN_LOGIN_FAILED_PASSWORD", admin.name, normEmail, "AdminAuth", "admin", admin.id);
        return sendError(res, 401, "INVALID_CREDENTIALS", "Unable to verify administrator credentials.");
      }
      const isFirstTimeMfa = !admin.mfa_enabled;
      let mfaSecret = admin.mfa_secret;
      let qrCodeDataUrl = void 0;
      let otpauthUrl = void 0;
      if (isFirstTimeMfa) {
        if (!mfaSecret || mfaSecret.length < 16) {
          mfaSecret = generateBase32Secret(20);
          await supabaseService.updateAdminMfaSecret(admin.id, mfaSecret);
        }
        otpauthUrl = `otpauth://totp/NETFIX%20AI:${encodeURIComponent(normEmail)}?secret=${mfaSecret}&issuer=NETFIX%20AI`;
        try {
          qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 300,
            color: {
              dark: "#000000",
              light: "#FFFFFF"
            }
          });
        } catch (qrErr) {
          console.error("[AdminAuth] Error generating QR code DataURL:", qrErr);
        }
      }
      const tempToken = `temp_pwd_verified_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      tempAuthStore.set(tempToken, {
        email: normEmail,
        mfaSecret,
        mfaVerified: false,
        expiresAt: Date.now() + 10 * 60 * 1e3
      });
      return sendSuccess(res, {
          tempToken,
          isFirstTimeMfa,
          ...isFirstTimeMfa ? { mfaSecret, otpauthUrl, qrCodeDataUrl } : {},
          message: isFirstTimeMfa ? "Password verified. Setup MFA authenticator app." : "Password verified. Proceed to TOTP MFA step."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "Login failed.");
    }
  },
  /**
   * POST /api/v1/admin/auth/verify-mfa
   * Step 2: Admin TOTP MFA Verification
   */
  async verifyMfa(req, res) {
    try {
      const { tempToken, code } = req.body;
      if (!tempToken) {
        return sendError(res, 400, "MFA_FAILED", "Password verification token missing.");
      }
      if (!code || code.length < 6) {
        return sendError(res, 400, "MFA_FAILED", "Enter the complete 6-digit TOTP code.");
      }
      const tempState = tempAuthStore.get(tempToken);
      if (!tempState || Date.now() > tempState.expiresAt) {
        return sendError(res, 401, "SESSION_EXPIRED", "Temporary authentication session expired. Please log in again.");
      }
      if (!/^\d{6}$/.test(code)) {
        await auditService.log("ADMIN_MFA_FAILED", "Administrator", tempState.email, "AdminAuth", "admin");
        return sendError(res, 401, "MFA_FAILED", "Invalid 6-digit TOTP code format.");
      }
      const admin = await supabaseService.getAdminByEmail(tempState.email);
      const secret = admin?.mfa_secret || tempState.mfaSecret;
      if (!secret) {
        await auditService.log("ADMIN_MFA_FAILED", "Administrator", tempState.email, "AdminAuth", "admin");
        return sendError(res, 401, "MFA_FAILED", "MFA secret not found. Please log in again.");
      }
      const isValid = verifyTotpCode(secret, code);
      if (!isValid) {
        await auditService.log("ADMIN_MFA_FAILED", "Administrator", tempState.email, "AdminAuth", "admin");
        return sendError(res, 401, "MFA_FAILED", "Invalid or expired TOTP verification code.");
      }
      if (admin && !admin.mfa_enabled) {
        await supabaseService.updateAdminMfaStatus(admin.id, true, secret);
      }
      tempState.mfaVerified = true;
      const mfaToken = `mfa_verified_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      tempAuthStore.set(mfaToken, {
        email: tempState.email,
        mfaVerified: true,
        expiresAt: Date.now() + 10 * 60 * 1e3
      });
      tempAuthStore.delete(tempToken);
      return sendSuccess(res, {
          mfaToken,
          message: "MFA verified successfully. Proceed to security check."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/admin/auth/verify-captcha
   * Step 3: CAPTCHA Verification & Final Admin Session JWT Issuance
   */
  async verifyCaptcha(req, res) {
    try {
      const { mfaToken, captchaToken } = req.body;
      if (!mfaToken) {
        return sendError(res, 400, "SECURITY_FAILED", "MFA verification token required.");
      }
      if (!captchaToken) {
        return sendError(res, 400, "SECURITY_FAILED", "CAPTCHA verification response token required.");
      }
      const mfaState = tempAuthStore.get(mfaToken);
      if (!mfaState || !mfaState.mfaVerified || Date.now() > mfaState.expiresAt) {
        return sendError(res, 401, "SECURITY_FAILED", "Out-of-order request or session expired.");
      }
      const admin = await supabaseService.getAdminByEmail(mfaState.email);
      const adminId = admin ? admin.id : "a0000000-0000-0000-0000-000000000001";
      const adminName = admin ? admin.name : "Administrator";
      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret) {
        try {
          const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              secret: turnstileSecret,
              response: captchaToken
            })
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            await auditService.log("ADMIN_CAPTCHA_FAILED", "Administrator", mfaState.email, "AdminAuth", "admin");
            return sendError(res, 401, "CAPTCHA_FAILED", "Cloudflare Turnstile CAPTCHA verification failed.");
          }
        } catch (turnstileErr) {
          console.warn("Cloudflare Turnstile server verification check warning:", turnstileErr?.message);
        }
      }
      tempAuthStore.delete(mfaToken);
      const adminJwt = jwt.sign(
        { sub: adminId, email: mfaState.email, adminLevel: "SuperAdministrator", type: "admin" },
        jwtSecret,
        { expiresIn: jwtExpiry }
      );
      setAdminSessionCookie(res, adminJwt);
      await auditService.log("ADMIN_LOGIN_SUCCESS", adminName, mfaState.email, "AdminAuth", "admin", adminId);
      return sendSuccess(res, {
          message: "Admin session authenticated successfully via secure cookie."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/admin/auth/session
   */
  async checkSession(req, res) {
    const token = req.cookies?.admin_session;
    if (!token) {
      return sendSuccess(res, { authenticated: false });
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded && decoded.type === "admin") {
        return sendSuccess(res, { authenticated: true, email: decoded.email });
      }
      return sendSuccess(res, { authenticated: false });
    } catch (err) {
      return sendSuccess(res, { authenticated: false });
    }
  },
  /**
   * POST /api/v1/admin/auth/logout
   */
  async logout(req, res) {
    if (req.admin) {
      await auditService.log("ADMIN_LOGOUT", req.admin.email, req.admin.email, "AdminAuth", "admin", req.admin.id);
    }
    res.clearCookie("admin_session", { path: "/" });
    return sendSuccess(res, { message: "Logged out of Admin Control Center." });
  }
};
export {
  adminAuthController
};
