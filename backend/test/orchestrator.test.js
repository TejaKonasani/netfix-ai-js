import { test } from "node:test";
import assert from "node:assert/strict";

// Importing the orchestrator pulls in the full service graph (heavy).
const { ultronOrchestrator } = await import("../src/services/ultronOrchestrator.js");
const { filterOutputByRole } = await import("../src/services/agents/helpers.js");
const { computeTaxDeterministically } = await import("../src/services/agents/taxIntelligenceAgent.js");

test("orchestrator exposes the public entry points", () => {
  assert.equal(typeof ultronOrchestrator.orchestrate, "function");
  assert.equal(typeof ultronOrchestrator.executeAgent, "function");
});

test("executeAgent dispatches the dummy agent", async () => {
  const res = await ultronOrchestrator.executeAgent("dummy", {}, false, 1, undefined);
  assert.deepEqual(res.payload, { result: "dummy_output" });
  assert.equal(res.ai_source, "ai");
});

test("executeAgent returns a generic payload for unregistered agents", async () => {
  const res = await ultronOrchestrator.executeAgent("nonexistent_agent", {}, false, 1, undefined);
  assert.equal(res.payload.status, "success");
  assert.match(res.payload.summary, /nonexistent_agent/);
});

test("doc_intake agent runs its rule-based fallback without an API key", async () => {
  const cb = {
    taskDescription: "Invoice from ABC for 50000",
    documents: [{ id: "d1", name: "inv.pdf", text: "Invoice total 50000 date 2026-01-01 vendor ABC" }],
    cases: [],
    user: { role: "admin" },
  };
  const res = await ultronOrchestrator.executeAgent("doc_intake", cb, false, 1, undefined);
  assert.ok(res.payload, "expected a payload");
  assert.equal(res.ai_source, "rule_based_fallback");
  assert.ok("status" in res.payload);
});

test("drafting agent performs cross-module citation + adversarial checks", async () => {
  const cb = {
    taskDescription: "Draft a legal notice",
    cases: [{ id: "C1", title: "Test", client_name: "ABC" }],
    documents: [],
    user: { role: "admin" },
  };
  const res = await ultronOrchestrator.executeAgent("drafting", cb, false, 1, undefined);
  assert.ok(res.payload, "expected a payload");
  assert.ok("citation_verification" in res.payload, "drafting should include a citation audit");
  assert.ok("adversarial_review" in res.payload, "drafting should include an adversarial review");
});

test("computeTaxDeterministically produces a consistent regime comparison", () => {
  const calc = computeTaxDeterministically({ taskDescription: "compute tax new regime" });
  assert.equal(typeof calc.old_regime_tax, "number");
  assert.equal(typeof calc.new_regime_tax, "number");
  assert.equal(typeof calc.optimization_potential, "number");
  assert.ok(Array.isArray(calc.suggested_optimizations));
});

test("filterOutputByRole strips internal fields for a client role", () => {
  const output = {
    summary: "Public summary",
    internal_rationale: "Confidential reasoning",
    internal_notes: "Confidential note",
    status: "success",
  };
  const filtered = filterOutputByRole(output, "client");
  assert.equal(filtered.summary, "Public summary");
  assert.equal(filtered.internal_rationale, undefined, "internal_rationale must be stripped for clients");
  assert.equal(filtered.internal_notes, undefined, "internal_notes must be stripped for clients");
});