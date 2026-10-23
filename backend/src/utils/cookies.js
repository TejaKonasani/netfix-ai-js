/**
 * NETFIX AI — Session cookie helpers
 *
 * Centralizes the cookie options that were copy-pasted across
 * authController and adminAuthController. Secure/HttpOnly flags come
 * from the central config, so production automatically gets secure cookies.
 */
import { cookieSecure, sessionMaxAgeMs } from "../config/index.js";

const baseOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: "strict",
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
  res.clearCookie("user_session", { path: "/" });
}

/** Clear the admin session cookie. */
export function clearAdminSessionCookie(res) {
  res.clearCookie("admin_session", { path: "/" });
}