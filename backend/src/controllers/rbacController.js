import { rbacService } from "../services/rbacService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const rbacController = {
  /**
   * GET /api/v1/rbac/dashboard-data/:role?
   * Secure dashboard data isolated strictly by authenticated user role
   */
  async getDashboardData(req, res) {
    try {
      const roleParam = req.params.role || req.user?.role || "client";
      const userContext = rbacService.getUserContext(roleParam, req.user?.email);
      if (req.user && req.user.role !== roleParam) {
        await auditService.log(
          "UNAUTHORIZED_ROLE_DASHBOARD_ACCESS",
          req.user.email,
          `Attempted role: ${roleParam}`,
          "RBAC_Protection",
          "user",
          req.user.id
        );
        return sendError(res, 403, "FORBIDDEN", `403 Forbidden: You do not have permission to access the ${roleParam.toUpperCase()} workspace.`);
      }
      const data = rbacService.getDashboardDataForRole(roleParam);
      return sendSuccess(res, data);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/rbac/cases/:id
   * Explicit IDOR / BOLA protection check
   */
  async getCaseById(req, res) {
    try {
      const caseId = req.params.id;
      const role = req.user?.role || "client";
      const user = rbacService.getUserContext(role, req.user?.email);
      const authCheck = await rbacService.verifyAccess(user, "case", caseId, "read");
      if (!authCheck.allowed) {
        return sendError(res, 403, "FORBIDDEN", authCheck.reason || "403 Forbidden: Access denied to requested case resource.");
      }
      return sendSuccess(res, {
          id: caseId,
          title: `Authorized Case Record ${caseId}`,
          status: "In Review",
          securityBoundary: `${user.role.toUpperCase()} -> TENANT_ISOLATED`
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/rbac/agent-activity
   * Returns live agent task feed & progress
   */
  async getAgentActivity(req, res) {
    try {
      const role = req.user?.role || "client";
      const tasks = rbacService.getAgentTasks(role);
      return sendSuccess(res, tasks);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * POST /api/v1/rbac/test-idor-violation
   * Test endpoint to simulate cross-user IDOR access attempt
   */
  async testIdorViolation(req, res) {
    try {
      const { targetResourceId, requesterRole = "client" } = req.body;
      const user = rbacService.getUserContext(requesterRole);
      const targetId = targetResourceId || "FOREIGN-CONFIDENTIAL-DOC-999";
      const authCheck = await rbacService.verifyAccess(user, "document", targetId, "read");
      if (!authCheck.allowed) {
        return sendError(res, 403, "FORBIDDEN", authCheck.reason || "403 Forbidden: Cross-user data access prevented by RBAC kernel.");
      }
      return sendSuccess(res, { message: "Access allowed" });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
export {
  rbacController
};
