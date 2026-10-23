/**
 * NETFIX AI — Session cookie helpers
 *
 * Centralizes the cookie options that were copy-pasted across
 * authController and adminAuthController. Secure/HttpOnly flags come
 * from the central config, so production automatically gets secure cookies.
 */
import { cookieSecure, sessionMaxAgeMs, isProduction } from "../config/index.js";

// Cross-origin (frontend on a different *.vercel.app subdomain than the API)
// requires SameSite=None + Secure so the browser sends the session cookie.
// Same-site local dev keeps SameSite=strict for the stronger guarantee.
const baseOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: isProduction ? "none" : "strict",
  maxAge: sessionMaxAgeMs,
  path: "/"
};

/** Set the user session JWT cookie. */
export function setUserSessionCookie(res, token) {
  res.cookie("user_session", token, baseOptions);
}

/** Set the admin session JWT cookie. */
export function setAdminSessionCookie(res, token) {
  res.cookie("admin_session", token, baseOptions);
}

/** Clear the user session cookie. */
export function clearUserSessionCookie(res) {
  res.clearCookie("user_session", { ...baseOptions });
}

/** Clear the admin session cookie. */
export function clearAdminSessionCookie(res) {
  res.clearCookie("admin_session", { ...baseOptions });
}