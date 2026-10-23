import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const advocateController = {
  /**
   * GET /api/v1/advocate/cases
   */
  async getAssignedCases(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      if (req.user.role !== "advocate" && req.user.role !== "management" && req.user.role !== "employee") {
        return sendError(res, 403, "FORBIDDEN", "Access denied to Advocate Workspace.");
      }
      const cases = await supabaseService.getCasesForUser(req.user.id, "advocate");
      const safeCases = cases.map((c) => ({
        id: c.id,
        caseNumber: c.case_number,
        title: c.title,
        type: c.module_type,
        status: c.status,
        nextHearingDate: c.next_hearing_date || "2026-09-25",
        assignedTo: "Sanjay Prakash"
      }));
      return sendSuccess(res, safeCases);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/access-requests
   */
  async createAccessRequest(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const { requestedResource, reason, durationDays } = req.body;
      if (!requestedResource || !reason) {
        return sendError(res, 400, "VALIDATION_ERROR", "Requested resource and reason are required.");
      }
      const reqRecord = {
        requester_id: req.user.id,
        requester_name: req.user.email.split("@")[0],
        requester_role: req.user.role,
        requested_resource: requestedResource,
        reason,
        duration_days: durationDays || 30,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      await auditService.log("ACCESS_REQUESTED", req.user.email, requestedResource, "AccessControl", "user", req.user.id);
      return sendSuccess(res, {
          id: `req_${Date.now()}`,
          message: "Access request submitted for Administrator review.",
          status: "pending"
        }, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
export {
  advocateController
};
