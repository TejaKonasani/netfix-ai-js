import { Router } from "express";
import { adminAuthController } from "../controllers/adminAuthController.js";
import { adminController } from "../controllers/adminController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.post("/auth/login-step1", adminAuthController.loginStep1);
router.post("/auth/verify-mfa", adminAuthController.verifyMfa);
router.post("/auth/verify-captcha", adminAuthController.verifyCaptcha);
router.get("/auth/session", adminAuthController.checkSession);
router.post("/auth/logout", adminAuthController.logout);
router.use(requireAdminAuth);
router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserDetail);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.get("/agents", adminController.getAgents);
router.get("/agent-tasks", adminController.getAgentTasks);
router.get("/access-requests", adminController.getAccessRequests);
router.patch("/access-requests/:id", adminController.updateAccessRequest);
router.get("/audit-logs", adminController.getAuditLogs);
router.get("/tickets", adminController.getTickets);
router.patch("/tickets/:id", adminController.updateTicket);
router.get("/system-health", adminController.getSystemHealth);
var adminRoutes_default = router;
export {
  adminRoutes_default as default
};
