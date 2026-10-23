import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseService } from "../services/supabaseService.js";
import { brevoService } from "../services/brevoService.js";
import { otpService } from "../services/otpService.js";
import { auditService } from "../services/auditService.js";
import { jwtSecret, jwtExpiry, sessionMaxAgeMs, demoModeEnabled, ALLOWED_ROLES } from "../config/index.js";
import { setUserSessionCookie, clearUserSessionCookie } from "../utils/cookies.js";
import { sendSuccess, sendError } from "../utils/http.js";
const authController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const {
        firstName,
        middleName,
        lastName,
        dob,
        email,
        phone,
        permanentAddress,
        temporaryAddress,
        password,
        confirmPassword,
        role
      } = req.body;
      if (!firstName || !firstName.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "First Name is required.");
      }
      if (!lastName || !lastName.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Last Name is required.");
      }
      if (!dob) {
        return sendError(res, 400, "VALIDATION_ERROR", "Date of Birth is required.");
      }
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "VALIDATION_ERROR", "Enter a valid email address.");
      }
      if (!phone || phone.trim().length < 7) {
        return sendError(res, 400, "VALIDATION_ERROR", "Enter a valid phone number.");
      }
      if (!permanentAddress || !permanentAddress.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Permanent Address is required.");
      }
      if (!temporaryAddress || !temporaryAddress.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Temporary Address is required.");
      }
      if (!password || password.length < 6) {
        return sendError(res, 400, "VALIDATION_ERROR", "Password must be at least 6 characters.");
      }
      if (password !== confirmPassword) {
        return sendError(res, 400, "VALIDATION_ERROR", "Passwords do not match.");
      }
      const normalizedRole = (role || "client").toString().toLowerCase();
      if (!ALLOWED_ROLES.includes(normalizedRole)) {
        return sendError(res, 400, "VALIDATION_ERROR", "Invalid platform user role.");
      }
      const normEmail = email.trim().toLowerCase();
      const existingUser = await supabaseService.getUserByEmail(normEmail);
      if (existingUser) {
        return sendError(res, 409, "USER_EXISTS", "An account with this email already exists.");
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const pendingRecord = await supabaseService.savePendingRegistration({
        email: normEmail,
        password_hash: passwordHash,
        role: normalizedRole,
        registration_data: {
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : void 0,
          lastName: lastName.trim(),
          dob,
          phone: phone.trim(),
          permanentAddress: permanentAddress.trim(),
          temporaryAddress: temporaryAddress.trim()
        },
        expires_at: new Date(Date.now() + 10 * 60 * 1e3).toISOString()
      });
      const otpCode = await otpService.generateAndSaveOtp(normEmail, "register", pendingRecord.id);
      try {
        await brevoService.sendOtpEmail(normEmail, `${firstName} ${lastName}`, otpCode, "registration");
      } catch (brevoErr) {
        console.warn(`[AuthController] Brevo email delivery note: ${brevoErr.message}`);
      }
      await auditService.log("USER_REGISTER_REQUESTED", `${firstName} ${lastName}`, normEmail, "Auth", "user");
      const maskedEmail = normEmail.charAt(0) + "***@" + normEmail.split("@")[1];
      return sendSuccess(res, {
          maskedContact: maskedEmail,
          message: "Verification code sent to your email address."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "Registration failed.");
    }
  },
  /**
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Invalid credentials.");
      }
      if (!password) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Invalid credentials.");
      }
      const normEmail = email.trim().toLowerCase();
      const user = await supabaseService.getUserByEmail(normEmail);
      if (!user) {
        return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials.");
      }
      if (user.status === "suspended" || user.status === "deactivated" || user.is_deactivated) {
        await auditService.log("USER_LOGIN_BLOCKED_SUSPENDED", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
        return sendError(res, 403, "ACCOUNT_SUSPENDED", "Your user account is suspended or deactivated. Please contact support.");
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await auditService.log("USER_LOGIN_FAILED_PASSWORD", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
        return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials.");
      }
      const otpCode = await otpService.generateAndSaveOtp(normEmail, "login", void 0, user.id);
      try {
        await brevoService.sendOtpEmail(normEmail, `${user.first_name} ${user.last_name}`, otpCode, "login");
      } catch (brevoErr) {
        console.warn(`[AuthController] Brevo email delivery note: ${brevoErr.message}`);
      }
      await auditService.log("USER_LOGIN_OTP_SENT", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      const maskedEmail = normEmail.charAt(0) + "***@" + normEmail.split("@")[1];
      return sendSuccess(res, {
          maskedContact: maskedEmail,
          message: "Login verification code sent to your registered contact."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "Login failed.");
    }
  },
  /**
   * POST /api/v1/auth/demo-login
   * Development Demo Login for 6 platform roles (bypasses OTP/MFA, establishes real JWT session and RBAC role)
   */
  async demoLogin(req, res) {
    try {
      if (!demoModeEnabled) {
        return sendError(res, 404, "NOT_FOUND", "The requested API endpoint does not exist.");
      }
      const { email, password, expectedRole } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Enter a valid demo email address.");
      }
      if (!password) {
        return sendError(res, 400, "INVALID_CREDENTIALS", "Password is required.");
      }
      const normEmail = email.trim().toLowerCase();
      const user = await supabaseService.getUserByEmail(normEmail);
      if (!user) {
        return sendError(res, 401, "INVALID_CREDENTIALS", "Demo account not found.");
      }
      const isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
      if (!isMatch) {
        return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid demo credentials.");
      }
      if (expectedRole) {
        const normExpected = expectedRole.toLowerCase().replace("-vendor", "");
        const normUserRole = user.role.toLowerCase();
        if (normExpected !== normUserRole && !normUserRole.includes(normExpected) && !normExpected.includes(normUserRole)) {
          return sendError(res, 403, "ROLE_MISMATCH", `Demo account is restricted to role '${user.role}'. Access denied.`);
        }
      }
      const jti = `jti_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role, type: "user", isDemo: true, jti },
        jwtSecret,
        { expiresIn: jwtExpiry }
      );
      await supabaseService.createSession({
        user_id: user.id,
        session_token: userToken,
        jti,
        device_info: req.headers["user-agent"] || "Demo Browser Session",
        ip_address: req.ip || "127.0.0.1",
        expires_at: new Date(Date.now() + sessionMaxAgeMs).toISOString()
      });
      setUserSessionCookie(res, userToken);
      await auditService.log("DEMO_USER_LOGIN_SUCCESS", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      return sendSuccess(res, {
          token: userToken,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
          },
          message: "Demo authentication successful."
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "Demo login failed.");
    }
  },
  /**
   * POST /api/v1/auth/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp, purpose = "login" } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "VALIDATION_ERROR", "Email address is required.");
      }
      if (!otp || otp.length < 6) {
        return sendError(res, 400, "VALIDATION_ERROR", "Enter the complete 6-digit verification code.");
      }
      const normEmail = email.trim().toLowerCase();
      await otpService.verifyOtpCode(normEmail, otp, purpose === "registration" ? "register" : "login");
      let user = null;
      if (purpose === "registration") {
        const pending = await supabaseService.getPendingRegistrationByEmail(normEmail);
        if (!pending) {
          return sendError(res, 400, "NO_PENDING_REGISTRATION", "Registration session expired or not found.");
        }
        const data = pending.registration_data || {};
        user = await supabaseService.createUser({
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          dob: data.dob,
          email: normEmail,
          phone: data.phone,
          permanent_address: data.permanentAddress,
          temporary_address: data.temporaryAddress,
          password_hash: pending.password_hash,
          role: pending.role,
          status: "active",
          last_login_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        await supabaseService.deletePendingRegistration(normEmail);
        await auditService.log("USER_REGISTER_COMPLETED", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      } else {
        user = await supabaseService.getUserByEmail(normEmail);
        if (!user) {
          return sendError(res, 404, "USER_NOT_FOUND", "User account not found.");
        }
        await auditService.log("USER_LOGIN_SUCCESS", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      }
      const jti = `jti_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userToken = jwt.sign(
        { sub: user.id, email: user.email, role: user.role, type: "user", jti },
        jwtSecret,
        { expiresIn: jwtExpiry }
      );
      await supabaseService.createSession({
        user_id: user.id,
        session_token: userToken,
        jti,
        device_info: req.headers["user-agent"] || "Unknown Device",
        ip_address: req.ip || "127.0.0.1",
        expires_at: new Date(Date.now() + sessionMaxAgeMs).toISOString()
      });
      setUserSessionCookie(res, userToken);
      return sendSuccess(res, {
          token: userToken,
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
          },
          message: "Authentication successful."
        });
    } catch (err) {
      return sendError(res, 400, "OTP_VERIFICATION_FAILED", err.message || "Verification failed.");
    }
  },
  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "VALIDATION_ERROR", "Valid email address required.");
      }
      const normEmail = email.trim().toLowerCase();
      const user = await supabaseService.getUserByEmail(normEmail);
      if (user) {
        const rawToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const tokenHash = await bcrypt.hash(rawToken, 8);
        await supabaseService.createPasswordResetToken(user.id, normEmail, tokenHash);
        try {
          await brevoService.sendOtpEmail(normEmail, `${user.first_name} ${user.last_name}`, rawToken.substring(0, 6), "login");
        } catch (err) {
        }
        await auditService.log("PASSWORD_RESET_REQUESTED", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      }
      return sendSuccess(res, { message: "If an account exists for this email, password reset instructions have been sent." });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { email, resetToken, newPassword, confirmPassword } = req.body;
      if (!email || !resetToken || !newPassword) {
        return sendError(res, 400, "VALIDATION_ERROR", "Missing required reset credentials.");
      }
      if (newPassword.length < 6) {
        return sendError(res, 400, "VALIDATION_ERROR", "Password must be at least 6 characters.");
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return sendError(res, 400, "VALIDATION_ERROR", "Passwords do not match.");
      }
      const normEmail = email.trim().toLowerCase();
      const user = await supabaseService.getUserByEmail(normEmail);
      if (!user) {
        return sendError(res, 400, "INVALID_RESET_TOKEN", "Invalid or expired reset token.");
      }
      const tokenRecord = await supabaseService.verifyPasswordResetTokenForEmail(normEmail, resetToken);
      if (!tokenRecord) {
        await auditService.log("PASSWORD_RESET_INVALID_TOKEN", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
        return sendError(res, 400, "INVALID_RESET_TOKEN", "Invalid or expired reset token.");
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await supabaseService.updateUserPassword(user.id, passwordHash);
      await supabaseService.markPasswordResetTokenUsed(tokenRecord.id);
      await supabaseService.revokeAllUserSessions(user.id);
      await auditService.log("PASSWORD_RESET_COMPLETED", `${user.first_name} ${user.last_name}`, normEmail, "Auth", "user", user.id);
      return sendSuccess(res, { message: "Password has been reset successfully. Please sign in with your new password." });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/users/me
   */
  async getMe(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated.");
      }
      const user = await supabaseService.getUserById(req.user.id);
      if (!user) {
        return sendError(res, 404, "USER_NOT_FOUND", "User record not found.");
      }
      return sendSuccess(res, {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          permanentAddress: user.permanent_address,
          temporaryAddress: user.temporary_address,
          role: user.role,
          status: user.status,
          createdAt: user.created_at
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * PATCH /api/v1/users/me
   */
  async updateMe(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated.");
      }
      const { firstName, middleName, lastName, phone, permanentAddress, temporaryAddress } = req.body;
      const updated = await supabaseService.updateUserProfile(req.user.id, {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone,
        permanent_address: permanentAddress,
        temporary_address: temporaryAddress
      });
      await auditService.log("USER_PROFILE_UPDATED", req.user.email, req.user.email, "Users", "user", req.user.id);
      return sendSuccess(res, { message: "Profile updated successfully.", user: updated });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/auth/resend-otp
   */
  async resendOtp(req, res) {
    try {
      const { email, purpose = "login" } = req.body;
      if (!email || !email.includes("@")) {
        return sendError(res, 400, "VALIDATION_ERROR", "Valid email is required.");
      }
      const normEmail = email.trim().toLowerCase();
      const otpPurpose = purpose === "registration" ? "register" : "login";
      const otpCode = await otpService.generateAndSaveOtp(normEmail, otpPurpose);
      try {
        await brevoService.sendOtpEmail(normEmail, "Platform User", otpCode, purpose === "registration" ? "registration" : "login");
      } catch (brevoErr) {
        console.warn(`[AuthController] Brevo resend note: ${brevoErr.message}`);
      }
      return sendSuccess(res, { message: "New verification code sent to registered contact." });
    } catch (err) {
      return sendError(res, 400, "RESEND_FAILED", err.message || "Failed to resend verification code.");
    }
  },
  /**
   * GET /api/v1/auth/dashboard/:role
   */
  async getRoleDashboardData(req, res) {
    try {
      const roleParam = req.params.role;
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated.");
      }
      return sendSuccess(res, {
          role: req.user.role,
          requestedRole: roleParam,
          userName: req.user.email,
          status: "Active",
          recentActivity: [
            { id: 1, action: "Document uploaded", time: "2 hours ago" },
            { id: 2, action: "AI Task completed", time: "5 hours ago" }
          ]
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    if (req.user?.jti) {
      await supabaseService.revokeSession(req.user.jti);
    }
    clearUserSessionCookie(res);
    return sendSuccess(res, { message: "Logged out successfully." });
  }
};
export {
  authController
};
