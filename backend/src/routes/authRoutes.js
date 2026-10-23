import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { requireUserAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/demo-login", authController.demoLogin);
router.post("/verify-otp", authController.verifyOtp);
router.post("/register/verify-otp", authController.verifyOtp);
router.post("/login/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", requireUserAuth, authController.getMe);
router.patch("/me", requireUserAuth, authController.updateMe);
router.post("/logout", requireUserAuth, authController.logout);
router.get("/dashboard/:role", requireUserAuth, authController.getRoleDashboardData);
var authRoutes_default = router;
export {
  authRoutes_default as default
};
