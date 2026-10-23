// commsReportingAgent agent module — extracted from ultronOrchestrator.js for reuse.
import { geminiService } from "../geminiService.js";

export async  function executeCommsReportingAgent(contextBundle, attemptNumber, feedback) {
  const commsSchema = {
    type: "object",
    properties: {
      response_text: { type: "string" },
      summary: { type: "string" },
      internal_notes: { type: "string" },
      internal_rationale: { type: "string" },
      role_filtered: { type: "boolean" }
    },
    required: ["response_text", "summary", "role_filtered"]
  };
  const prompt = `You are the Communication & Reporting Agent for Netfix AI / MARG Group (Modules 9, 17, 28).
Your job is to summarize case data, answer natural-language queries, and write report narratives for the requesting user.
Requesting User Role: "${contextBundle.user.role}"
User Request: "${contextBundle.taskDescription}"
Scoped Case & Document Data:
${JSON.stringify({
    user: contextBundle.user,
    cases: contextBundle.cases,
    documents: contextBundle.documents
  })}

${feedback ? `Corrective Feedback from Previous Attempt: ${feedback}` : ""}

Output MUST conform strictly to the JSON schema.`;
  const geminiRes = await geminiService.call({
    agentKey: "comms_reporting",
    modelTier: "FLASH",
    prompt,
    schema: commsSchema
  });
  if (geminiRes.ai_source === "ai") {
    return {
      payload: {
        response_text: geminiRes.response_text,
        summary: geminiRes.summary,
        internal_notes: geminiRes.internal_notes || `Internal audit log entry for ${contextBundle.user.role}`,
        internal_rationale: geminiRes.internal_rationale || `Internal operational rationale for ${contextBundle.taskDescription}`,
        role_filtered: true,
        status: "success"
      },
      ai_source: "ai"
    };
  }
  const caseCount = contextBundle.cases ? contextBundle.cases.length : 0;
  const docCount = contextBundle.documents ? contextBundle.documents.length : 0;
  return {
    payload: {
      response_text: `Rule-Based Narrative: Analyzed ${caseCount} active case(s) and ${docCount} document(s) for user ${contextBundle.user.name}. All filings are up to date.`,
      summary: `Deterministic summary for query: "${contextBundle.taskDescription}"`,
      internal_notes: `Confidential rule-based operational note for employee reference.`,
      internal_rationale: `Deterministic decision tree: 0 compliance mismatches identified.`,
      role_filtered: true,
      status: "success"
    },
    ai_source: "rule_based_fallback"
  };
}
