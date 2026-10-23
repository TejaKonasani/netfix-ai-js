import { Router } from "express";
import { ocrController } from "../controllers/ocrController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/documents/:id/process", ocrController.processDocument);
var ocrRoutes_default = router;
export {
  ocrRoutes_default as default
};
