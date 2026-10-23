/**
 * NETFIX AI — Central configuration
 *
 * Single source of truth for every environment-derived setting.
 * All modules import from here instead of reading process.env directly,
 * so defaults, validation, and the demo-mode policy live in one place.
 */

const env = process.env;

/**
 * Demo mode is ON in development and OFF in production.
 * It gates the development-only conveniences (demo login endpoint,
 * seeded demo accounts). Production behavior is always strict.
 */
export const isProduction = env.NODE_ENV === "production";
// Demo mode: ON by default in development, OFF in production — but can be
// explicitly enabled in production with DEMO_MODE=true (used for demo
// deployments where the OTP email flow is not configured).
export const demoModeEnabled = isProduction
  ? env.DEMO_MODE === "true"
  : env.DEMO_MODE !== "false";

/**
 * JWT signing. In production a real JWT_SECRET is mandatory — the server
 * refuses to boot without one, so a hardcoded secret can never be used live.
 */
export const jwtSecret =
  env.JWT_SECRET || (isProduction ? "" : "netfix_ai_dev_only_secret_do_not_use_in_production");
export const jwtExpiry = env.JWT_EXPIRY || "7d";

if (isProduction && !env.JWT_SECRET) {
  console.error("[config] FATAL: JWT_SECRET must be set when NODE_ENV=production.");
  process.exit(1);
}

/** Session cookie flags — secure cookies in production, httpOnly everywhere. */
export const cookieSecure = isProduction;
export const sessionMaxAgeMs = 7 * 24 * 60 * 60 * 1e3; // 7 days

/** CORS allowlist (origins the frontend may call from). */
export const allowedOrigins = [
  env.FRONTEND_URL || "http://localhost:3000",
  env.ADMIN_URL || "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174"
];

/** OTP settings. */
export const otpExpiryMinutes = parseInt(env.OTP_EXPIRY_MINUTES || "10", 10);
export const otpMaxAttempts = 5;
export const otpRateLimit = { maxRequests: 3, windowMs: 10 * 60 * 1e3 };

/** Gemini model tiers. */
export const geminiModelFlash = env.GEMINI_MODEL_FLASH || "gemini-1.5-flash";
export const geminiModelPro = env.GEMINI_MODEL_PRO || "gemini-1.5-pro";

/** Platform user roles. */
export const ALLOWED_ROLES = ["employee", "management", "advocate", "client", "tenant", "regulator"];

/** Agent registry (kept here so orchestrator + routes share one definition). */
export const REGISTERED_AGENTS = new Set([
  "ultron",
  "doc_intake",
  "case_analysis",
  "tax_intelligence",
  "legal_research",
  "drafting",
  "adversarial",
  "risk_compliance",
  "citation_check",
  "comms_reporting",
  "property_project",
  "portal_automation",
  "dummy"
]);

/** Agents whose output is held for mandatory human review before client visibility. */
export const GATED_AGENTS = new Set([
  "drafting",
  "adversarial",
  "tax_intelligence",
  "risk_compliance",
  "case_analysis",
  "legal_research"
]);

export const config = {
  isProduction,
  demoModeEnabled,
  jwtSecret,
  jwtExpiry,
  cookieSecure,
  sessionMaxAgeMs,
  allowedOrigins,
  otpExpiryMinutes,
  otpMaxAttempts,
  otpRateLimit,
  geminiModelFlash,
  geminiModelPro,
  ALLOWED_ROLES,
  REGISTERED_AGENTS,
  GATED_AGENTS
};

export default config;