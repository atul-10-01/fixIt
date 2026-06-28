/**
 * Express router mapping administrator actions, database re-seeds, and autonomous sweeps.
 */
import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.put("/users/toggle-role", requireAuth, adminController.toggleRole);
router.post("/agent/sweep", requireAuth, adminController.runSweep);
router.post("/admin/reset", requireAuth, adminController.resetDatabase);
router.get("/users", adminController.getLeaderboard);

export default router;
