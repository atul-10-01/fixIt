/**
 * Express router mapping authentication routes for sessions and Google logins.
 */
import { Router } from "express";
import { authController } from "../controllers/auth.controller";

const router = Router();

router.get("/google", authController.initiateGoogleAuth);
router.get("/google/callback", authController.handleGoogleCallback);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);

export default router;
