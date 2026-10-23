import { Router } from "express";
import { caseController } from "../controllers/caseController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/", caseController.createCase);
router.get("/", caseController.getCases);
router.get("/:id", caseController.getCaseById);
router.patch("/:id/status", caseController.updateCaseStatus);
router.post("/:id/notes", caseController.addCaseNote);
var caseRoutes_default = router;
export {
  caseRoutes_default as default
};
