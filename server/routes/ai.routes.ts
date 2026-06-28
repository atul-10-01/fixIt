/**
 * Express router mapping AI-related proxy operations for visual scans and letter generation.
 */
import { Router } from "express";
import { aiController } from "../controllers/ai.controller";

const router = Router();

router.post("/analyze-image", aiController.analyzeImage);
router.post("/generate-complaint", aiController.generateComplaint);

export default router;
