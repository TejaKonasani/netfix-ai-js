import "cookie-parser";
import jwt from "jsonwebtoken";
import { supabaseService } from "../services/supabaseService.js";
const requireUserAuth = async (req, res, next) => {
  const token = req.cookies?.user_session || extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Authentication required. Please sign in." }
    });
  }
  try {
    const secret = process.env.JWT_SECRET || "netfix_ai_super_secret_jwt_key_2026_dev";
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.type !== "user") {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired user session." }
      });
    }
    if (decoded.jti) {
      const isRevoked = await supabaseService.isSessionRevoked(decoded.jti);
      if (isRevoked) {
        res.clearCookie("user_session", { path: "/" });
        return res.status(401).json({
          success: false,
          error: { code: "SESSION_REVOKED", message: "Your session has been revoked. Please sign in again." }
        });
      }
    }
    const user = await supabaseService.getUserById(decoded.sub);
    if (user) {
      if (user.status === "suspended" || user.status === "deactivated" || user.is_deactivated) {
        return res.status(403).json({
          success: false,
          error: { code: "ACCOUNT_SUSPENDED", message: "Account status is inactive or suspended. Access denied." }
        });
      }
    }
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role, jti: decoded.jti };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid or expired user session." }
    });
  }
};
const requireAdminAuth = (req, res, next) => {
  const token = req.cookies?.admin_session || extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Administrator authorization required." }
    });
  }
  try {
    const secret = process.env.JWT_SECRET || "netfix_ai_super_secret_jwt_key_2026_dev";
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.type !== "admin") {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_ADMIN_TOKEN", message: "Invalid or expired admin session token." }
      });
    }
    req.admin = { id: decoded.sub, email: decoded.email, adminLevel: decoded.adminLevel || "SuperAdministrator" };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_ADMIN_TOKEN", message: "Invalid or expired admin session token." }
    });
  }
};
const requireUserRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required." }
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient role permissions to access this resource." }
      });
    }
    next();
  };
};
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}
export {
  requireAdminAuth,
  requireUserAuth,
  requireUserRole
};
