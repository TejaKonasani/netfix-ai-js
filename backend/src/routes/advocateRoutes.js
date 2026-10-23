import { Router } from "express";
import { advocateController } from "../controllers/advocateController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.get("/cases", advocateController.getAssignedCases);
router.post("/access-requests", advocateController.createAccessRequest);
var advocateRoutes_default = router;
export {
  advocateRoutes_default as default
};
