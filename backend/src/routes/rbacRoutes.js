import { Router } from "express";
import { rbacController } from "../controllers/rbacController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/dashboard-data/:role?", rbacController.getDashboardData);
router.get("/cases/:id", requireUserAuth, rbacController.getCaseById);
router.get("/agent-activity", rbacController.getAgentActivity);
router.post("/test-idor-violation", rbacController.testIdorViolation);
var rbacRoutes_default = router;
export {
  rbacRoutes_default as default
};
