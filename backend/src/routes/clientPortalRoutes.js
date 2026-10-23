import { Router } from "express";
import { clientPortalController } from "../controllers/clientPortalController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.get("/dashboard", clientPortalController.getDashboard);
router.get("/cases", clientPortalController.getCases);
router.get("/documents", clientPortalController.getDocuments);
router.post("/requests", clientPortalController.createRequest);
router.post("/approvals/:approvalId/action", clientPortalController.handleApprovalAction);
router.get("/entities", clientPortalController.getEntities);
var clientPortalRoutes_default = router;
export {
  clientPortalRoutes_default as default
};
