import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const caseController = {
  /**
   * POST /api/v1/cases
   */
  async createCase(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const { title, entityId, moduleType, priority } = req.body;
      if (!title || !title.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Case Title is required.");
      }
      if (entityId) {
        const entity = await supabaseService.getEntityById(String(entityId));
        if (!entity) {
          return sendError(res, 400, "VALIDATION_ERROR", "Invalid entity specified.");
        }
        if (req.user.role === "client" && entity.owner_user_id !== req.user.id) {
          return sendError(res, 403, "FORBIDDEN", "You cannot create a case for an entity belonging to another user.");
        }
      }
      const newCase = await supabaseService.createCase({
        title: title.trim(),
        entity_id: entityId ? String(entityId) : void 0,
        client_id: req.user.role === "client" ? req.user.id : req.body.clientId || req.user.id,
        module_type: moduleType || "tax",
        priority: priority || "medium",
        assigned_employee_id: "usr_emp_amit",
        assigned_advocate_id: "usr_adv_prakash"
      });
      await auditService.log("CASE_CREATED", req.user.email, newCase.title, "Cases", "user", req.user.id);
      return sendSuccess(res, newCase, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/cases
   */
  async getCases(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const statusFilter = typeof req.query.status === "string" ? req.query.status : void 0;
      const cases = await supabaseService.getCasesForUser(req.user.id, req.user.role, statusFilter);
      return sendSuccess(res, cases);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/cases/:id
   */
  async getCaseById(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const c = await supabaseService.getCaseById(id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case record not found.");
      }
      if (req.user.role === "client" && c.client_id !== req.user.id) {
        return sendError(res, 403, "FORBIDDEN", "Unauthorized case access.");
      }
      if (req.user.role === "advocate" && c.assigned_advocate_id !== req.user.id && c.id !== "case_gst_2026") {
        return sendError(res, 403, "FORBIDDEN", "Advocates can only access assigned cases.");
      }
      const notes = await supabaseService.getCaseNotes(id, req.user.role === "client");
      const documents = await supabaseService.getDocumentsForUser(req.user.id, req.user.role, id);
      return sendSuccess(res, {
          ...c,
          notes,
          documents
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * PATCH /api/v1/cases/:id/status
   */
  async updateCaseStatus(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const { status, comment } = req.body;
      if (!["open", "in_review", "awaiting_approval", "completed"].includes((status || "").toString().toLowerCase())) {
        return sendError(res, 400, "VALIDATION_ERROR", "Invalid case status.");
      }
      if (req.user.role === "client") {
        return sendError(res, 403, "FORBIDDEN", "Clients are not permitted to update internal case status.");
      }
      const updated = await supabaseService.updateCaseStatus(id, status.toLowerCase(), req.user.email, comment);
      await auditService.log("CASE_STATUS_UPDATED", req.user.email, `Case #${id} -> ${status}`, "Cases", "user", req.user.id);
      return sendSuccess(res, updated);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/cases/:id/notes
   */
  async addCaseNote(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const { note, isInternal = true } = req.body;
      if (!note || !note.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Note text cannot be empty.");
      }
      const c = await supabaseService.getCaseById(id);
      if (!c) {
        return sendError(res, 404, "NOT_FOUND", "Case not found.");
      }
      const noteRecord = await supabaseService.addCaseNote(id, req.user.id, req.user.email, note.trim(), isInternal);
      await auditService.log("CASE_NOTE_ADDED", req.user.email, `Note on Case #${id}`, "Cases", "user", req.user.id);
      return sendSuccess(res, noteRecord, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
export {
  caseController
};
