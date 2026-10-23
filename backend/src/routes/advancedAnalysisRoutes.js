import { Router } from "express";
import { AdvancedAnalysisController } from "../controllers/advancedAnalysisController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/case-facts/extract", AdvancedAnalysisController.extractFacts);
router.get("/case-facts/:case_id", AdvancedAnalysisController.getCaseFacts);
router.patch("/case-facts/:id/verify", AdvancedAnalysisController.verifyFact);
router.get("/cases/:id/chronology", AdvancedAnalysisController.getChronology);
router.post("/evidence", AdvancedAnalysisController.addEvidence);
router.get("/evidence/:case_id", AdvancedAnalysisController.getEvidence);
router.get("/contradictions/:case_id", AdvancedAnalysisController.getContradictions);
router.patch("/contradictions/:id/resolve", AdvancedAnalysisController.resolveContradiction);
router.get("/deadlines", AdvancedAnalysisController.getDeadlines);
router.post("/deadlines", AdvancedAnalysisController.createDeadline);
router.post("/adversarial-review/run", AdvancedAnalysisController.runAdversarialReview);
router.get("/adversarial-review/:draft_id", AdvancedAnalysisController.getAdversarialReviews);
router.get("/risk/:case_id", AdvancedAnalysisController.getRiskAssessment);
router.get("/citations/:source_content_id", AdvancedAnalysisController.getCitations);
router.get("/reports/case-summary", AdvancedAnalysisController.getCaseSummaryReport);
router.post("/reports/export", AdvancedAnalysisController.exportReport);
var advancedAnalysisRoutes_default = router;
export {
  advancedAnalysisRoutes_default as default
};
