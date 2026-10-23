import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
class AdvancedAnalysisController {
  // ============================================================
  // MODULE 20: CASE FACT ENGINE
  // ============================================================
  static async extractFacts(req, res) {
    try {
      const user = req.user;
      const { case_id } = req.body;
      if (!case_id) {
        return sendError(res, 400, "INVALID_INPUT", "case_id is required");
      }
      const c = await supabaseService.getCaseById(String(case_id));
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client" && c.client_id !== user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied to case");
      }
      const facts = await supabaseService.extractCaseFacts(String(case_id), user.id);
      const agentTask = await supabaseService.createAgentTask({
        agent_name: "Case Fact Agent",
        user_id: user.id,
        case_id: String(case_id),
        input_summary: `Fact extraction for Case #${c.case_number}`,
        output_summary: `Extracted ${facts.length} candidate facts from case documents`,
        status: "completed",
        human_review_status: "pending"
      });
      await auditService.log(
        "FACT_EXTRACTION",
        user.first_name || user.email,
        String(case_id),
        "CaseFacts",
        "user",
        user.id,
        { count: facts.length }
      );
      return sendSuccess(res, { facts, agent_task: agentTask });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async getCaseFacts(req, res) {
    try {
      const user = req.user;
      const case_id = String(req.params.case_id);
      const c = await supabaseService.getCaseById(case_id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client" && c.client_id !== user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied");
      }
      let facts = await supabaseService.getCaseFacts(case_id);
      if (user.role === "client") {
        facts = facts.filter((f) => f.verified_by_human);
      }
      return sendSuccess(res, facts);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async verifyFact(req, res) {
    try {
      const user = req.user;
      const id = String(req.params.id);
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Clients cannot verify internal case facts");
      }
      const verified = await supabaseService.verifyCaseFact(id, user.id);
      if (!verified) {
        return sendError(res, 404, "NOT_FOUND", "Fact not found");
      }
      await auditService.log(
        "FACT_VERIFICATION",
        user.first_name || user.email,
        id,
        "CaseFacts",
        "user",
        user.id,
        { fact_id: id }
      );
      return sendSuccess(res, verified);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 21: CHRONOLOGY ENGINE
  // ============================================================
  static async getChronology(req, res) {
    try {
      const user = req.user;
      const case_id = String(req.params.id);
      const c = await supabaseService.getCaseById(case_id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client" && c.client_id !== user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied to case chronology");
      }
      const events = await supabaseService.getCaseChronology(case_id);
      return sendSuccess(res, events);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 22: EVIDENCE MANAGEMENT
  // ============================================================
  static async getEvidence(req, res) {
    try {
      const user = req.user;
      const case_id = String(req.params.case_id);
      const c = await supabaseService.getCaseById(case_id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client" && c.client_id !== user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied");
      }
      const items = await supabaseService.getEvidenceItems(case_id);
      return sendSuccess(res, items);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async addEvidence(req, res) {
    try {
      const user = req.user;
      const { case_id, document_id, evidence_type, linked_fact_id } = req.body;
      if (!case_id || !document_id) {
        return sendError(res, 400, "INVALID_INPUT", "case_id and document_id are required");
      }
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Clients cannot manage litigation evidence logs");
      }
      const item = await supabaseService.addEvidenceItem({
        case_id: String(case_id),
        document_id: String(document_id),
        evidence_type: evidence_type ? String(evidence_type) : "Contract",
        linked_fact_id: linked_fact_id ? String(linked_fact_id) : void 0,
        added_by: user.id
      });
      await auditService.log(
        "EVIDENCE_ADD",
        user.first_name || user.email,
        item.id,
        "Evidence",
        "user",
        user.id,
        { case_id, document_id }
      );
      return sendSuccess(res, item);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 23: CONTRADICTION ANALYSIS
  // ============================================================
  static async getContradictions(req, res) {
    try {
      const user = req.user;
      const case_id = String(req.params.case_id);
      const c = await supabaseService.getCaseById(case_id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Internal contradiction reasoning is confidential");
      }
      const list = await supabaseService.getContradictions(case_id);
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async resolveContradiction(req, res) {
    try {
      const user = req.user;
      const id = String(req.params.id);
      const { resolution_notes } = req.body;
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Clients cannot resolve internal contradictions");
      }
      const resolved = await supabaseService.resolveContradiction(id, String(resolution_notes || "Resolved"), user.id);
      if (!resolved) {
        return sendError(res, 404, "NOT_FOUND", "Contradiction not found");
      }
      await auditService.log(
        "CONTRADICTION_RESOLVE",
        user.first_name || user.email,
        id,
        "Contradictions",
        "user",
        user.id,
        { id }
      );
      return sendSuccess(res, resolved);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 24: LIMITATION & DEADLINE ENGINE
  // ============================================================
  static async getDeadlines(req, res) {
    try {
      const user = req.user;
      const case_id = req.query.case_id ? String(req.query.case_id) : void 0;
      if (case_id) {
        const c = await supabaseService.getCaseById(case_id);
        if (user.role === "client" && c?.client_id !== user.id) {
          return sendError(res, 403, "FORBIDDEN", "Access denied");
        }
      }
      const list = await supabaseService.getDeadlines(case_id);
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async createDeadline(req, res) {
    try {
      const user = req.user;
      const { case_id, title, deadline_type, due_date, days_remaining } = req.body;
      if (!title || !due_date) {
        return sendError(res, 400, "INVALID_INPUT", "title and due_date are required");
      }
      const deadline = await supabaseService.createDeadline({
        case_id: case_id ? String(case_id) : "case_gst_2026",
        title: String(title),
        deadline_type: deadline_type ? String(deadline_type) : "compliance",
        due_date: String(due_date),
        days_remaining: days_remaining !== void 0 ? Number(days_remaining) : 12,
        created_by: user.id
      });
      await auditService.log(
        "DEADLINE_CREATE",
        user.first_name || user.email,
        deadline.id,
        "Deadlines",
        "user",
        user.id,
        { title }
      );
      return sendSuccess(res, deadline);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 25: ADVERSARIAL AI ENGINE
  // ============================================================
  static async runAdversarialReview(req, res) {
    try {
      const user = req.user;
      const { draft_id, case_id } = req.body;
      if (!draft_id || !case_id) {
        return sendError(res, 400, "INVALID_INPUT", "draft_id and case_id are required");
      }
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Clients cannot execute internal adversarial legal stress-tests");
      }
      const review = await supabaseService.runAdversarialReview(String(draft_id), String(case_id), user.id);
      const agentTask = await supabaseService.createAgentTask({
        agent_name: "Adversarial Review Agent",
        user_id: user.id,
        case_id: String(case_id),
        input_summary: `Adversarial Check on Draft #${draft_id}`,
        output_summary: `Identified 3 potential counterarguments and 2 argument weaknesses`,
        status: "completed",
        human_review_status: "pending"
      });
      await auditService.log(
        "ADVERSARIAL_CHECK",
        user.first_name || user.email,
        review.id,
        "AdversarialAI",
        "user",
        user.id,
        { draft_id }
      );
      return sendSuccess(res, { review, agent_task: agentTask });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async getAdversarialReviews(req, res) {
    try {
      const user = req.user;
      const draft_id = String(req.params.draft_id);
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Access denied");
      }
      const reviews = await supabaseService.getAdversarialReviews(draft_id);
      return sendSuccess(res, reviews);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 26: RISK & EXPOSURE ANALYSIS
  // ============================================================
  static async getRiskAssessment(req, res) {
    try {
      const user = req.user;
      const case_id = String(req.params.case_id);
      const c = await supabaseService.getCaseById(case_id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found");
      }
      if (user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Internal risk exposure score is confidential");
      }
      const risk = await supabaseService.getRiskAssessment(case_id);
      return sendSuccess(res, risk);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 27: CITATION & SOURCE VERIFICATION
  // ============================================================
  static async getCitations(req, res) {
    try {
      const user = req.user;
      const source_content_id = String(req.params.source_content_id);
      const citations = await supabaseService.getCitationChecks(source_content_id);
      return sendSuccess(res, citations);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  // ============================================================
  // MODULE 28: REPORTING SYSTEM
  // ============================================================
  static async getCaseSummaryReport(req, res) {
    try {
      const user = req.user;
      const summary = await supabaseService.getCaseSummaryReport(user.id, user.role);
      return sendSuccess(res, summary);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
  static async exportReport(req, res) {
    try {
      const user = req.user;
      const { report_type, filters } = req.body;
      const report = await supabaseService.exportReport(String(report_type || "case_summary"), filters, user.id);
      await auditService.log(
        "REPORT_EXPORT",
        user.first_name || user.email,
        report.id,
        "Reporting",
        "user",
        user.id,
        { report_type }
      );
      return sendSuccess(res, report);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message || "SERVER_ERROR");
    }
  }
}
export {
  AdvancedAnalysisController
};
