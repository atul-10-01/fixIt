/**
 * Combined API root router exporting all sub-routers to the main Express server instance.
 */
import { Router } from "express";
import authRoutes from "./auth.routes";
import aiRoutes from "./ai.routes";
import adminRoutes from "./admin.routes";
import issuesRoutes from "./issues.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/issues", issuesRoutes);
router.use("/", aiRoutes);
router.use("/", adminRoutes);

export default router;
