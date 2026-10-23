import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const queryController = {
  /**
   * POST /api/v1/query/ask
   */
  async askQuery(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const { queryText, entityId, caseId } = req.body;
      if (!queryText || !queryText.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Query text cannot be empty.");
      }
      if (entityId) {
        const entity = await supabaseService.getEntityById(String(entityId));
        if (!entity) {
          return sendError(res, 400, "VALIDATION_ERROR", "Selected entity does not exist.");
        }
        if (req.user.role === "client" && entity.owner_user_id !== req.user.id) {
          return sendError(res, 403, "FORBIDDEN", "Unauthorized entity scope for query submission.");
        }
      }
      const task = await supabaseService.createAgentQueryTask({
        agent_name: "Ultron AI Orchestrator",
        user_id: req.user.id,
        entity_id: entityId ? String(entityId) : "ent_marg_tech",
        case_id: caseId ? String(caseId) : "case_gst_2026",
        input_summary: queryText.trim(),
        output_summary: "Query received and task pipeline initialized.",
        status: "processing",
        current_step: 1
      });
      await auditService.log("QUERY_SUBMITTED", req.user.email, queryText.substring(0, 50), "QuerySystem", "user", req.user.id);
      return sendSuccess(res, {
          taskId: task.id,
          status: task.status,
          currentStep: task.current_step,
          stepName: "Request received",
          totalSteps: 7,
          queryText: task.input_summary,
          message: "Query submitted successfully. Agent pipeline processing."
        }, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/query/:task_id/status
   */
  async getTaskStatus(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const taskId = String(req.params.task_id);
      const task = await supabaseService.getAgentTaskById(taskId);
      if (!task) {
        return sendError(res, 404, "NOT_FOUND", "Task ID not found.");
      }
      if (req.user.role === "client" && task.user_id && task.user_id !== req.user.id) {
        await auditService.log("UNAUTHORIZED_TASK_ACCESS_ATTEMPT", req.user.email, `Task #${taskId}`, "QuerySystem", "user", req.user.id);
        return sendError(res, 403, "FORBIDDEN", "Unauthorized access to agent task record.");
      }
      const stepsList = [
        { id: 1, name: "Request received", status: "Completed" },
        { id: 2, name: "Reading documents...", status: (task.current_step || 1) >= 2 ? "Completed" : "Processing" },
        { id: 3, name: "Analyzing information", status: (task.current_step || 1) >= 3 ? "Completed" : task.current_step === 2 ? "Processing" : "Pending" },
        { id: 4, name: "Processing", status: (task.current_step || 1) >= 4 ? "Completed" : task.current_step === 3 ? "Processing" : "Pending" },
        { id: 5, name: "Generating result", status: (task.current_step || 1) >= 5 ? "Completed" : task.current_step === 4 ? "Processing" : "Pending" },
        { id: 6, name: "Human review", status: (task.current_step || 1) >= 6 ? "Completed" : task.current_step === 5 ? "Processing" : "Pending" },
        { id: 7, name: "Completed", status: (task.current_step || 1) >= 7 ? "Completed" : "Pending" }
      ];
      return sendSuccess(res, {
          taskId: task.id,
          agentName: task.agent_name,
          status: task.status,
          currentStep: task.current_step || 2,
          steps: stepsList,
          inputSummary: task.input_summary,
          outputSummary: task.output_summary
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
export {
  queryController
};
