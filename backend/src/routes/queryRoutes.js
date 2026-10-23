import { Router } from "express";
import { queryController } from "../controllers/queryController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/ask", queryController.askQuery);
router.get("/:task_id/status", queryController.getTaskStatus);
var queryRoutes_default = router;
export {
  queryRoutes_default as default
};
