// Shared helper functions extracted from ultronOrchestrator.js (verification, role-filtering, step-writer).

import { geminiService } from "../geminiService.js";
import { supabaseService } from "../supabaseService.js";
import { auditService } from "../auditService.js";

export async  function runVerificationPass(taskDescription, agentOutput, forceVerificationFailure) {
  if (forceVerificationFailure) {
    return {
      verdict: "FAIL",
      corrective_feedback: "Output structure is malformed or invalid.",
      ai_source: "ai"
    };
  }
  const verificationSchema = {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["PASS", "FAIL"] },
      corrective_feedback: { type: "string" }
    },
    required: ["verdict"]
  };
  const prompt = `You are Ultron running a verification pass on worker agent output.
Task Description: "${taskDescription}"
Agent Output JSON: ${JSON.stringify(agentOutput.payload)}

Determine if the agent output is structurally sound and satisfies the task request.
Return verdict 'PASS' or 'FAIL'.`;
  const res = await geminiService.call({
    agentKey: "ultron",
    modelTier: "PRO",
    prompt,
    schema: verificationSchema
  });
  if (res.ai_source === "rule_based_fallback") {
    return { verdict: "PASS", ai_source: "rule_based_fallback" };
  }
  return {
    verdict: res.verdict === "PASS" ? "PASS" : "FAIL",
    corrective_feedback: res.corrective_feedback || "Output failed verification check.",
    ai_source: "ai"
  };
}

export  function filterOutputByRole(output, role) {
  if (output === null || output === void 0) {
    return { result: null };
  }
  let targetObj = typeof output === "object" ? JSON.parse(JSON.stringify(output)) : { result: output };
  if (role === "client" || role === "tenant") {
    targetObj = stripInternalFields(targetObj);
  }
  return targetObj;
}

export  function stripInternalFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => stripInternalFields(item));
  }
  if (obj !== null && typeof obj === "object") {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (key === "internal_rationale" || key === "internal_notes") {
        continue;
      }
      if (obj["is_internal"] === true) {
        continue;
      }
      cleaned[key] = stripInternalFields(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

export  function getStrippedFieldNames(obj, role) {
  if (role !== "client" && role !== "tenant") return [];
  const stripped = [];
  if (obj && typeof obj === "object") {
    if ("internal_rationale" in obj) stripped.push("internal_rationale");
    if ("internal_notes" in obj) stripped.push("internal_notes");
  }
  return stripped;
}

export async  function safeStepWriterUpdate(taskId, update) {
  try {
    await supabaseService.createAgentTask({
      id: taskId,
      agent_name: "Ultron AI Orchestrator",
      input_summary: "Ultron Orchestration Task",
      output_summary: update.outputSummary || "",
      status: update.status === "processing" || update.status === "queued" ? "processing" : update.status === "awaiting_user_input" ? "awaiting_user_input" : update.status === "failed" ? "failed" : "completed",
      current_step: update.currentStep,
      human_review_status: update.humanReviewStatus,
      ai_source: update.aiSource
    });
  } catch (err) {
    await auditService.log(
      "STEP_WRITE_FAILED",
      "Ultron AI Orchestrator",
      `task:${taskId}`,
      "UltronOrchestrator",
      "system",
      "system",
      { task_id: taskId, error: err?.message || "Step write failed" }
    );
  }
}
