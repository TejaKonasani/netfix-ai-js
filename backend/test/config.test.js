import { test } from "node:test";
import assert from "node:assert/strict";

// NOTE: config/index.js reads process.env at module load time, so the
// environment must be set BEFORE the dynamic import below.
process.env.NODE_ENV = "development";
process.env.DEMO_MODE = "true";

const cfg = await import("../src/config/index.js");

test("dev mode: demo mode is enabled by default", () => {
  assert.equal(cfg.isProduction, false);
  assert.equal(cfg.demoModeEnabled, true);
});

test("dev mode: a dev JWT secret is provided (no crash)", () => {
  assert.equal(typeof cfg.jwtSecret, "string");
  assert.ok(cfg.jwtSecret.length > 0);
});

test("JWT expiry defaults to 7 days", () => {
  assert.equal(cfg.jwtExpiry, "7d");
});

test("allowedOrigins includes the default frontend origin", () => {
  assert.ok(cfg.allowedOrigins.includes("http://localhost:3000"));
});

test("OTP settings are sane", () => {
  assert.equal(cfg.otpExpiryMinutes, 10);
  assert.equal(cfg.otpMaxAttempts, 5);
  assert.equal(cfg.otpRateLimit.maxRequests, 3);
});

test("ALLOWED_ROLES covers the six platform roles", () => {
  for (const role of ["employee", "management", "advocate", "client", "tenant", "regulator"]) {
    assert.ok(cfg.ALLOWED_ROLES.includes(role), `missing role ${role}`);
  }
});

test("agent registry contains the core agents", () => {
  for (const agent of ["ultron", "doc_intake", "case_analysis", "tax_intelligence", "legal_research", "drafting", "adversarial", "risk_compliance", "citation_check", "comms_reporting", "portal_automation"]) {
    assert.ok(cfg.REGISTERED_AGENTS.has(agent), `missing agent ${agent}`);
  }
});

test("gated agents are a subset of registered agents", () => {
  for (const agent of cfg.GATED_AGENTS) {
    assert.ok(cfg.REGISTERED_AGENTS.has(agent), `gated agent ${agent} not registered`);
  }
});