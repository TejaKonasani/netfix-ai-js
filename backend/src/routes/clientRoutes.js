import { Router } from "express";
import { clientController } from "../controllers/clientController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.use(requireUserAuth);
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);
router.post("/:id/assign", clientController.assignClient);
var clientRoutes_default = router;
export {
  clientRoutes_default as default
};
