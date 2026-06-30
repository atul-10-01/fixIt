/**
 * Express router mapping AI-related proxy operations for visual scans and letter generation.
 */
import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { aiRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();
const limitAiUsage = aiRateLimiter();

router.post("/analyze-image", limitAiUsage, aiController.analyzeImage);
router.post("/generate-complaint", limitAiUsage, aiController.generateComplaint);

export default router;
