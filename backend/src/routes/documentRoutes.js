import { Router } from "express";
import { documentController } from "../controllers/documentController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/upload", documentController.uploadDocument);
router.get("/", documentController.getDocuments);
router.get("/:id", documentController.getDocumentById);
router.get("/:id/download", documentController.downloadDocument);
var documentRoutes_default = router;
export {
  documentRoutes_default as default
};
