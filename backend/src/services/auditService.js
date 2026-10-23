import { supabaseService } from "./supabaseService.js";
class AuditService {
  async log(action, actorName, target, module = "General", actorType = "user", actorId, details, ipAddress) {
    try {
      await supabaseService.writeAuditLog({
        action,
        actor_name: actorName,
        target,
        module,
        actor_type: actorType,
        actor_id: actorId,
        details,
        ip_address: ipAddress || "127.0.0.1"
      });
    } catch (err) {
      console.error("[AuditService] Failed to record audit log:", err);
    }
  }
  async getLogs() {
    return supabaseService.getAuditLogs();
  }
}
const auditService = new AuditService();
export {
  auditService
};
