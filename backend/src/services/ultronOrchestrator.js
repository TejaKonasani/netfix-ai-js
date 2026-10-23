import { geminiService } from "./geminiService.js";
import { rbacService } from "./rbacService.js";
import { auditService } from "./auditService.js";
import { supabaseService } from "./supabaseService.js";
import { pdfGeneratorService } from "./pdfGeneratorService.js";
import { REGISTERED_AGENTS, GATED_AGENTS } from "../config/index.js";
// Shared helpers (verification, role-filtering, step-writer)
import {
  runVerificationPass,
  filterOutputByRole,
  getStrippedFieldNames,
  safeStepWriterUpdate
} from "./agents/helpers.js";
// Agent modules (each agent is a self-contained, reusable function)
import { executeDocIntakeAgent } from "./agents/docIntakeAgent.js";
import { executeCaseAnalysisAgent } from "./agents/caseAnalysisAgent.js";
import { executeCommsReportingAgent } from "./agents/commsReportingAgent.js";
import { executeRiskComplianceAgent } from "./agents/riskComplianceAgent.js";
import { executeLegalResearchAgent } from "./agents/legalResearchAgent.js";
import { executeCitationCheckAgent } from "./agents/citationCheckAgent.js";
import { executeDraftingAgent } from "./agents/draftingAgent.js";
import { executeAdversarialAgent } from "./agents/adversarialAgent.js";
import { executeTaxIntelligenceAgent } from "./agents/taxIntelligenceAgent.js";
import { executePortalAutomationAgent } from "./agents/portalAutomationAgent.js";

/**
 * Ultron Orchestrator — the primary coordination layer for the Netfix AI agent
 * platform. Each specialist agent lives in its own module under ./agents/ and is
 * dispatched here by key. Shared verification / role-filtering / step-writer
 * helpers live in ./agents/helpers.js.
 */
class UltronOrchestrator {

  async orchestrate(request) {
    const taskId = `TASK-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    let currentStep = 0;
    let stepsCompleted = 0;
    try {
      await safeStepWriterUpdate(taskId, {
        status: "queued",
        currentStep: 0,
        outputSummary: "",
        aiSource: null
      });
      let resolvedAgent = request.agentKey;
      let classificationAiSource = "ai";
      if (!resolvedAgent) {
        const classificationRes = await this.classifyAndRoute(request.taskDescription);
        resolvedAgent = classificationRes.next_agent;
        classificationAiSource = classificationRes.ai_source;
      }
      if (!REGISTERED_AGENTS.has(resolvedAgent)) {
        console.warn(`[UltronOrchestrator] Unknown agent '${resolvedAgent}', defaulting to 'comms_reporting'`);
        resolvedAgent = "comms_reporting";
      }
      await auditService.log(
        "TASK_CLASSIFIED",
        "Ultron AI Orchestrator",
        `agent:${resolvedAgent}`,
        "UltronOrchestrator",
        "user",
        request.requestingUserId,
        { next_agent: resolvedAgent, ai_source: classificationAiSource, task_id: taskId }
      );
      const contextBundle = await this.buildContextBundle(
        request.requestingUserId,
        request.taskDescription,
        taskId,
        request.documentId,
        request.caseId,
        resolvedAgent
      );
      const userContext = contextBundle.user;
      currentStep = 1;
      stepsCompleted++;
      await safeStepWriterUpdate(taskId, {
        status: "processing",
        currentStep,
        outputSummary: `Task classified for ${resolvedAgent}. Context bundle assembled.`
      });
      await auditService.log(
        "AGENT_ROUTED",
        "Ultron AI Orchestrator",
        `agent:${resolvedAgent}`,
        "UltronOrchestrator",
        "user",
        request.requestingUserId,
        { task_id: taskId, agent_key: resolvedAgent }
      );
      currentStep++;
      stepsCompleted++;
      await safeStepWriterUpdate(taskId, {
        status: "processing",
        currentStep,
        outputSummary: `Routed to agent ${resolvedAgent}.`
      });
      let attemptCount = 1;
      let agentOutput = await this.executeAgent(
        resolvedAgent,
        contextBundle,
        request.forceVerificationFailure,
        attemptCount
      );
      await auditService.log(
        "AGENT_RETURNED",
        "Ultron AI Orchestrator",
        `agent:${resolvedAgent}`,
        "UltronOrchestrator",
        "user",
        request.requestingUserId,
        { task_id: taskId, agent_key: resolvedAgent, ai_source: agentOutput.ai_source }
      );
      currentStep++;
      stepsCompleted++;
      await safeStepWriterUpdate(taskId, {
        status: "processing",
        currentStep,
        outputSummary: `Agent ${resolvedAgent} completed execution.`,
        aiSource: agentOutput.ai_source
      });
      let verificationRetries = 0;
      let verificationPassed = false;
      while (!verificationPassed && attemptCount <= 3) {
        const verificationRes = await runVerificationPass(
          request.taskDescription,
          agentOutput,
          request.forceVerificationFailure
        );
        if (verificationRes.verdict === "PASS") {
          verificationPassed = true;
          await auditService.log(
            "VERIFICATION_PASSED",
            "Ultron AI Orchestrator",
            `agent:${resolvedAgent}`,
            "UltronOrchestrator",
            "user",
            request.requestingUserId,
            {
              task_id: taskId,
              agent_key: resolvedAgent,
              attempt: attemptCount,
              ai_source: verificationRes.ai_source
            }
          );
        } else {
          await auditService.log(
            "VERIFICATION_FAILED",
            "Ultron AI Orchestrator",
            `agent:${resolvedAgent}`,
            "UltronOrchestrator",
            "user",
            request.requestingUserId,
            {
              task_id: taskId,
              agent_key: resolvedAgent,
              attempt: attemptCount,
              ai_source: verificationRes.ai_source,
              corrective_feedback: verificationRes.corrective_feedback
            }
          );
          if (attemptCount < 3) {
            attemptCount++;
            verificationRetries++;
            currentStep++;
            stepsCompleted++;
            await safeStepWriterUpdate(taskId, {
              status: "processing",
              currentStep,
              outputSummary: `Verification failed. Retry attempt ${verificationRetries} initiated.`
            });
            agentOutput = await this.executeAgent(
              resolvedAgent,
              contextBundle,
              request.forceVerificationFailure,
              attemptCount,
              verificationRes.corrective_feedback
            );
          } else {
            attemptCount++;
          }
        }
      }
      currentStep++;
      stepsCompleted++;
      let finalAiSource = agentOutput.ai_source;
      let finalResultData = agentOutput.payload;
      if (!verificationPassed) {
        await auditService.log(
          "VERIFICATION_EXHAUSTED",
          "Ultron AI Orchestrator",
          `agent:${resolvedAgent}`,
          "UltronOrchestrator",
          "user",
          request.requestingUserId,
          { task_id: taskId, agent_key: resolvedAgent, attempts: attemptCount - 1 }
        );
        finalAiSource = "rule_based_fallback";
        finalResultData = {
          result: "rule_based_fallback_output",
          ai_source: "rule_based_fallback",
          message: "Rule-based fallback activated following verification failure."
        };
      }
      let humanReviewStatus = void 0;
      let isBehindGate = GATED_AGENTS.has(resolvedAgent);
      if (isBehindGate && verificationPassed) {
        humanReviewStatus = "pending";
        await auditService.log(
          "HUMAN_REVIEW_GATE_TRIGGERED",
          "Ultron AI Orchestrator",
          `agent:${resolvedAgent}`,
          "UltronOrchestrator",
          "user",
          request.requestingUserId,
          { task_id: taskId, agent_key: resolvedAgent, role: userContext.role }
        );
      }
      let filteredResult;
      if (humanReviewStatus === "pending" && (userContext.role === "client" || userContext.role === "tenant")) {
        filteredResult = {
          status: "pending_review",
          message: "This result is awaiting human review before it can be shared with you.",
          draft: {
            status: "ai_draft",
            draft_content: "[CONTENT PENDING HUMAN REVIEW]",
            is_client_visible: false
          },
          draft_content: "[CONTENT PENDING HUMAN REVIEW]"
        };
      } else {
        filteredResult = filterOutputByRole(finalResultData, userContext.role);
      }
      await auditService.log(
        "OUTPUT_FILTERED",
        "Ultron AI Orchestrator",
        `agent:${resolvedAgent}`,
        "UltronOrchestrator",
        "user",
        request.requestingUserId,
        {
          task_id: taskId,
          role: userContext.role,
          agent_key: resolvedAgent,
          fields_removed: getStrippedFieldNames(finalResultData, userContext.role)
        }
      );
      const isFailedStatus = finalResultData?.status === "failed" || !verificationPassed;
      const isAwaitingUserInput = !isFailedStatus && (finalResultData?.status === "awaiting_user_input" || resolvedAgent === "portal_automation" && finalResultData?.requires_user_input === true);
      const finalTaskStatus = isFailedStatus ? "failed" : isAwaitingUserInput ? "awaiting_user_input" : "completed";
      const finalSummary = isAwaitingUserInput ? `Task paused at portal user input gate (${finalResultData?.user_input_type || "user verification required"}).` : humanReviewStatus === "pending" && (userContext.role === "client" || userContext.role === "tenant") ? "Result generated and held for human review." : isFailedStatus ? "Task execution failed." : "Task completed successfully.";
      await safeStepWriterUpdate(taskId, {
        status: finalTaskStatus,
        currentStep,
        outputSummary: finalSummary,
        aiSource: finalAiSource,
        humanReviewStatus
      });
      let pdfReportInfo = void 0;
      try {
        const reportEntity = await pdfGeneratorService.generateAndStoreReport({
          taskId,
          userId: request.requestingUserId,
          title: `Report for Task ${taskId} (${resolvedAgent})`,
          agentKey: resolvedAgent,
          aiSource: finalAiSource,
          data: filteredResult
        });
        pdfReportInfo = {
          report_id: reportEntity.id,
          download_url: reportEntity.download_url,
          title: reportEntity.title
        };
      } catch (pdfErr) {
        console.warn(`[UltronOrchestrator] PDF generation warning for task ${taskId}:`, pdfErr?.message);
      }
      return {
        task_id: taskId,
        status: finalTaskStatus,
        human_review_status: humanReviewStatus,
        ai_source: finalAiSource,
        result: filteredResult,
        steps_completed: stepsCompleted,
        verification_retries: verificationRetries,
        next_agent: resolvedAgent,
        pdf_report: pdfReportInfo
      };
    } catch (err) {
      const errorMessage = err?.message || "Unknown orchestration error";
      console.error(`[UltronOrchestrator] Orchestration failed for task ${taskId}:`, err);
      await safeStepWriterUpdate(taskId, {
        status: "failed",
        currentStep,
        outputSummary: `Orchestration error: ${errorMessage}`,
        aiSource: "rule_based_fallback"
      });
      return {
        task_id: taskId,
        status: "failed",
        ai_source: "rule_based_fallback",
        result: { error: errorMessage },
        steps_completed: stepsCompleted,
        message: errorMessage
      };
    }
  }

  async classifyAndRoute(taskDescription) {
    const classificationSchema = {
      type: "object",
      properties: {
        classification: { type: "string" },
        next_agent: { type: "string" }
      },
      required: ["classification", "next_agent"]
    };
    const prompt = `You are Ultron, the super-admin orchestrator for Netfix AI / MARG Group.
Classify the following user request and select the most appropriate specialized worker agent key.
Available agent keys:
- doc_intake (document upload, invoice processing, OCR)
- case_analysis (case facts, chronology, contradictions)
- tax_intelligence (GST, ITR calculation, tax mismatches)
- legal_research (RAG Q&A, statutory sections, case law)
- drafting (contract generation, legal notices, agreement drafts)
- risk_compliance (risk score, compliance analysis)
- comms_reporting (summaries, general queries, report narratives)
- portal_automation (portal filing, GST portal, ITR portal, OTP submission, CAPTCHA, DSC filing)

User Request: "${taskDescription}"`;
    const result = await geminiService.call({
      agentKey: "ultron",
      modelTier: "PRO",
      prompt,
      schema: classificationSchema
    });
    if (result.ai_source === "ai" && result.next_agent) {
      return {
        classification: result.classification || "General Query",
        next_agent: result.next_agent,
        ai_source: "ai"
      };
    }
    const lower = taskDescription.toLowerCase();
    let nextAgent = "comms_reporting";
    if (lower.match(/\b(portal|file now|tax portal|gst portal|itr portal|submit return|otp|captcha|dsc|evc)\b/)) {
      nextAgent = "portal_automation";
    } else if (lower.match(/\b(tax|gst|itr)\b/)) {
      nextAgent = "tax_intelligence";
    } else if (lower.match(/\b(draft|agreement|notice)\b/)) {
      nextAgent = "drafting";
    } else if (lower.match(/\b(case|fact|chronology)\b/)) {
      nextAgent = "case_analysis";
    } else if (lower.match(/\b(research|law|section)\b/)) {
      nextAgent = "legal_research";
    } else if (lower.match(/\b(document|invoice|upload)\b/)) {
      nextAgent = "doc_intake";
    } else if (lower.match(/\b(risk|compliance|score)\b/)) {
      nextAgent = "risk_compliance";
    } else if (lower.match(/\b(report|summary|query)\b/)) {
      nextAgent = "comms_reporting";
    }
    return {
      classification: "Rule-Based Fallback Classification",
      next_agent: nextAgent,
      ai_source: "rule_based_fallback"
    };
  }

  async buildContextBundle(requestingUserId, taskDescription, taskId, documentId, caseId, targetAgentKey) {
    try {
      const user = rbacService.getUserContext(requestingUserId);
      const candidateCases = [
        {
          id: "C-1042",
          title: "Review GST Draft \u2014 ABC Pvt Ltd",
          clientName: "ABC Pvt Ltd",
          clientId: "usr_cli_rajesh",
          module: "GST & Tax",
          status: "In Review",
          priority: "High",
          assignedEmployeeId: "usr_emp_amit",
          assignedEmployeeName: "Amit Sharma",
          tenantId: "tenant_abc_pvtltd",
          createdDate: "10 May 2025",
          dueDate: "26 May 2025",
          lastUpdated: "25 May 2025"
        },
        {
          id: "C-1039",
          title: "Upload Documents & Audit \u2014 Sharma Enterprises",
          clientName: "Sharma Enterprises",
          clientId: "usr_cli_sharma_b",
          module: "Corporate",
          status: "Open",
          priority: "Medium",
          assignedEmployeeId: "usr_emp_amit",
          assignedEmployeeName: "Amit Sharma",
          tenantId: "tenant_sharma_ent",
          createdDate: "12 May 2025",
          dueDate: "27 May 2025",
          lastUpdated: "24 May 2025"
        }
      ];
      let candidateCasesToVerify = [];
      if (caseId) {
        const foundCase = candidateCases.find((c) => c.id === caseId);
        if (foundCase) {
          candidateCasesToVerify = [foundCase];
        } else {
          candidateCasesToVerify = [
            {
              id: caseId,
              title: `Case_${caseId}`,
              clientName: "Sharma Enterprises",
              clientId: "usr_cli_sharma_b",
              module: "GST & Tax",
              status: "In Review",
              priority: "High",
              assignedEmployeeId: "usr_emp_vikram",
              assignedEmployeeName: "Vikram Rao",
              tenantId: "tenant_sharma_ent",
              createdDate: "10 May 2025",
              dueDate: "26 May 2025",
              lastUpdated: "25 May 2025"
            }
          ];
        }
      } else if (targetAgentKey === "case_analysis") {
        candidateCasesToVerify = [candidateCases[0]];
      } else {
        candidateCasesToVerify = candidateCases;
      }
      const allowedCases = [];
      for (const c of candidateCasesToVerify) {
        const access = await rbacService.verifyAccess(user, "case", c.id, "read");
        if (access.allowed) {
          allowedCases.push(c);
        } else if (caseId && c.id === caseId) {
          throw new Error(`Security Violation: User ${user.id} (${user.role}) is forbidden from accessing case ${c.id}`);
        }
      }
      if (user.role === "client" || user.role === "tenant") {
        const leaked = allowedCases.filter(
          (c) => c.clientId !== user.id && c.tenantId !== user.tenantId
        );
        if (leaked.length > 0) {
          throw new Error(`Security Violation: Context bundle contains cross-tenant cases for role ${user.role}`);
        }
      }
      const candidateDocs = [
        {
          id: "DOC-1001",
          name: "GST_Return_Q3_2025.pdf",
          type: "Tax Filing",
          caseId: "C-1042",
          ownerUserId: "usr_cli_rajesh",
          tenantId: "tenant_abc_pvtltd",
          uploadDate: "10 May 2025",
          aiProcessingStatus: "Completed"
        },
        {
          id: "DOC-1002",
          name: "Corporate_Audit_Report.pdf",
          type: "Audit",
          caseId: "C-1039",
          ownerUserId: "usr_cli_sharma_b",
          tenantId: "tenant_sharma_ent",
          uploadDate: "12 May 2025",
          aiProcessingStatus: "Completed"
        },
        {
          id: "DOC-2002",
          name: "Cross_Tenant_Audit_File.pdf",
          type: "Audit",
          caseId: "C-1039",
          ownerUserId: "usr_cli_sharma_b",
          tenantId: "tenant_sharma_ent",
          uploadDate: "12 May 2025",
          aiProcessingStatus: "Completed"
        }
      ];
      let docCandidatesToVerify = [];
      if (documentId) {
        const foundDoc = candidateDocs.find((d) => d.id === documentId);
        if (foundDoc) {
          docCandidatesToVerify = [foundDoc];
        } else {
          docCandidatesToVerify = [
            {
              id: documentId,
              name: `Document_${documentId}.pdf`,
              type: "tax_invoice",
              caseId: "C-1042",
              ownerUserId: requestingUserId.startsWith("usr_cli") ? requestingUserId : "usr_cli_rajesh",
              tenantId: "tenant_abc_pvtltd",
              uploadDate: (/* @__PURE__ */ new Date()).toLocaleDateString(),
              aiProcessingStatus: "Completed"
            }
          ];
        }
      } else if (targetAgentKey === "doc_intake") {
        docCandidatesToVerify = [candidateDocs[0]];
      } else if (allowedCases.length > 0) {
        const scopedCaseIds = new Set(allowedCases.map((ac) => ac.id));
        docCandidatesToVerify = candidateDocs.filter((d) => scopedCaseIds.has(d.caseId));
        if (docCandidatesToVerify.length === 0) {
          docCandidatesToVerify = [candidateDocs[0]];
        }
      } else {
        docCandidatesToVerify = candidateDocs;
      }
      const allowedDocs = [];
      for (const d of docCandidatesToVerify) {
        const access = await rbacService.verifyAccess(user, "document", d.id, "read");
        if (access.allowed) {
          allowedDocs.push(d);
        } else if (documentId && d.id === documentId) {
          throw new Error(`Security Violation: User ${user.id} (${user.role}) is forbidden from accessing document ${d.id}`);
        }
      }
      const agentTaskHistory = [];
      await auditService.log(
        "CONTEXT_BUNDLE_BUILT",
        "Ultron AI Orchestrator",
        `user:${requestingUserId}`,
        "UltronOrchestrator",
        "user",
        requestingUserId,
        {
          task_id: taskId,
          role: user.role,
          cases_included: allowedCases.length,
          documents_included: allowedDocs.length,
          task_history_included: agentTaskHistory.length,
          document_id_scoped: documentId || null,
          case_id_scoped: caseId || null
        }
      );
      return {
        user,
        cases: allowedCases,
        documents: allowedDocs,
        agentTaskHistory,
        taskDescription,
        documentId,
        caseId
      };
    } catch (err) {
      await auditService.log(
        "CONTEXT_BUNDLE_FAILED",
        "Ultron AI Orchestrator",
        `user:${requestingUserId}`,
        "UltronOrchestrator",
        "user",
        requestingUserId,
        { task_id: taskId, error: err?.message || "Bundle failure" }
      );
      throw err;
    }
  }

  async executeAgent(agentKey, contextBundle, forceVerificationFailure, attemptNumber = 1, feedback) {
    if (agentKey === "dummy") {
      if (forceVerificationFailure) {
        return {
          payload: { result: null, malformed: true },
          ai_source: "ai"
        };
      }
      return {
        payload: { result: "dummy_output" },
        ai_source: "ai"
      };
    }
    const agentFns = {
      doc_intake: executeDocIntakeAgent,
      case_analysis: executeCaseAnalysisAgent,
      comms_reporting: executeCommsReportingAgent,
      tax_intelligence: executeTaxIntelligenceAgent,
      risk_compliance: executeRiskComplianceAgent,
      legal_research: executeLegalResearchAgent,
      citation_check: executeCitationCheckAgent,
      drafting: executeDraftingAgent,
      adversarial: executeAdversarialAgent,
      portal_automation: executePortalAutomationAgent
    };
    const fn = agentFns[agentKey];
    if (fn) {
      return fn(contextBundle, attemptNumber, feedback);
    }
    return {
      payload: {
        summary: `Analysis produced by ${agentKey} (attempt ${attemptNumber})`,
        internal_rationale: `Internal reasoning details for ${agentKey}`,
        internal_notes: `Confidential note for employee view`,
        status: "success"
      },
      ai_source: "ai"
    };
  }

}

const ultronOrchestrator = new UltronOrchestrator();
export {
  UltronOrchestrator,
  ultronOrchestrator
};
