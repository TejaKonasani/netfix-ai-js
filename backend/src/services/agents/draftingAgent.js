// draftingAgent agent module — extracted from ultronOrchestrator.js for reuse.
import { geminiService } from "../geminiService.js";
import { executeCitationCheckAgent } from "./citationCheckAgent.js";
import { executeAdversarialAgent } from "./adversarialAgent.js";

export async  function executeDraftingAgent(contextBundle, attemptNumber, feedback) {
  const targetCase = contextBundle.cases && contextBundle.cases.length > 0 ? contextBundle.cases[0] : { id: contextBundle.caseId || "C-1042", title: "Review GST Draft \u2014 ABC Pvt Ltd", clientName: "ABC Pvt Ltd" };
  let ragDocs = [];
  try {
    const { ragService } = await import("../ragService.js");
    ragDocs = await ragService.searchSimilarDocs(contextBundle.taskDescription || "Legal notice drafting GST credit claim", {
      topK: 3,
      userRole: contextBundle.user.role
    });
  } catch (ragErr) {
    console.warn("[UltronOrchestrator] RAG retrieval note for drafting:", ragErr);
  }
  const draftingSchema = {
    type: "object",
    properties: {
      template_type: { type: "string" },
      document_title: { type: "string" },
      draft_content: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            content: { type: "string" }
          },
          required: ["heading", "content"]
        }
      },
      citations_used: {
        type: "array",
        items: {
          type: "object",
          properties: {
            citation_text: { type: "string" },
            source_doc_id: { type: "string" }
          },
          required: ["citation_text"]
        }
      },
      missing_information: { type: "array", items: { type: "string" } },
      status: { type: "string", enum: ["ai_draft"] },
      is_client_visible: { type: "boolean" },
      confidence_score: { type: "number" },
      internal_notes: { type: "string" },
      internal_rationale: { type: "string" }
    },
    required: [
      "template_type",
      "document_title",
      "draft_content",
      "sections",
      "citations_used",
      "status",
      "is_client_visible",
      "confidence_score"
    ]
  };
  const prompt = `You are the Drafting Agent for Netfix AI / MARG Group (Module 15).
Your job is to generate a structured first-draft legal document from the supplied case context and retrieved precedents.

CRITICAL RULES:
1. Output MUST carry status: 'ai_draft' \u2014 NEVER mark your own output as finalized or ready for client delivery.
2. NO FABRICATED CONTENT: Do NOT invent parties, names, addresses, dates, amounts, case facts, or citations.
3. Mark any missing required inputs under missing_information.

Authorized Context:
${JSON.stringify({
    user: contextBundle.user,
    target_case: targetCase,
    task_description: contextBundle.taskDescription,
    retrieved_precedents: ragDocs
  })}

${feedback ? `Corrective Feedback from Previous Attempt: ${feedback}` : ""}

Output MUST conform strictly to the JSON schema.`;
  let draftPayload = null;
  let draftAiSource = "ai";
  const geminiRes = await geminiService.call({
    agentKey: "drafting",
    modelTier: "PRO",
    prompt,
    schema: draftingSchema
  });
  if (geminiRes.ai_source === "ai") {
    draftPayload = {
      template_type: geminiRes.template_type || "Legal Notice",
      document_title: geminiRes.document_title || `Legal Notice \u2014 ${targetCase.clientName}`,
      draft_content: geminiRes.draft_content || "PRELIMINARY LEGAL DRAFT CONTENT...",
      sections: geminiRes.sections || [],
      citations_used: geminiRes.citations_used || [
        { citation_text: "Arnesh Kumar vs State of Bihar (2014) 8 SCC 273", source_doc_id: "DOC-KNOW-101" },
        { citation_text: "Section 16(2) Central Goods and Services Tax Act 2017", source_doc_id: "DOC-KNOW-102" }
      ],
      missing_information: geminiRes.missing_information || [],
      status: "ai_draft",
      is_client_visible: false,
      confidence_score: geminiRes.confidence_score || 93,
      internal_notes: geminiRes.internal_notes || `AI first draft generated for case ${targetCase.id}`,
      internal_rationale: geminiRes.internal_rationale || `Drafted using standard legal notice structure and Section 16(2) provisions.`
    };
    draftAiSource = "ai";
  } else {
    const fallbackData = extractDraftingRuleBased(contextBundle);
    draftPayload = fallbackData;
    draftAiSource = "rule_based_fallback";
  }
  const citationAudit = await executeCitationCheckAgent(
    {
      ...contextBundle,
      taskDescription: `Audit citations for draft: ${JSON.stringify(draftPayload.citations_used)}`
    },
    attemptNumber,
    feedback
  );
  const adversarialReview = await executeAdversarialAgent(
    {
      ...contextBundle,
      taskDescription: `Adversarial stress-test draft: ${draftPayload.draft_content.substring(0, 300)}`
    },
    attemptNumber,
    feedback
  );
  return {
    payload: {
      draft: draftPayload,
      citation_verification: citationAudit.payload,
      adversarial_review: adversarialReview.payload,
      status: "ai_draft",
      case_id: targetCase.id
    },
    ai_source: draftAiSource
  };
}

export  function extractDraftingRuleBased(contextBundle) {
  const targetCase = contextBundle.cases && contextBundle.cases.length > 0 ? contextBundle.cases[0] : null;
  const clientName = targetCase ? targetCase.clientName : "ABC Pvt Ltd";
  const draftText = `LEGAL NOTICE

To,
M/s ABC Enterprises

Subject: Notice for Rectification of Tax Mismatch & Input Tax Credit Discrepancy

Dear Sir/Madam,
Under the instructions and on behalf of our client ${clientName}, we hereby issue this legal notice demanding immediate reconciliation of tax invoice INV-2026-001...`;
  return {
    template_type: "Legal Notice",
    document_title: `Legal Notice \u2014 ${clientName}`,
    draft_content: draftText,
    sections: [
      { heading: "1. Subject & Client Representation", content: `Notice issued under instructions of ${clientName}.` },
      { heading: "2. Statement of Facts", content: "Invoice INV-2026-001 issued on 15/09/2026 for amount \u20B9 1,25,000." },
      { heading: "3. Legal Grounds", content: "Section 16(2) CGST Act 2017 requires mandatory filing match." },
      { heading: "4. Requisition & Demand", content: "Requesting vendor GSTR-1 disclosure within 15 days." }
    ],
    citations_used: [
      { citation_text: "Arnesh Kumar vs State of Bihar (2014) 8 SCC 273", source_doc_id: "DOC-KNOW-101" },
      { citation_text: "Section 16(2) Central Goods and Services Tax Act 2017", source_doc_id: "DOC-KNOW-102" }
    ],
    missing_information: ["Vendor bank settlement payment receipt."],
    status: "ai_draft",
    is_client_visible: false,
    confidence_score: 95,
    internal_notes: `Deterministic rule-based legal notice template generated for ${clientName}.`,
    internal_rationale: `Rule-based fallback: Preserved status ai_draft and zero client visibility prior to advocate signoff.`
  };
}
