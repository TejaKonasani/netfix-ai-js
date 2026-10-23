import { Router } from "express";
import { entityController } from "../controllers/entityController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.post("/", entityController.createEntity);
router.get("/", entityController.getEntities);
router.get("/:id", entityController.getEntityById);
router.patch("/:id", entityController.updateEntity);
var entityRoutes_default = router;
export {
  entityRoutes_default as default
};
