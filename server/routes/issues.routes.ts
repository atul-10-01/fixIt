/**
 * Express router mapping incident stream REST actions, proximity verifications, and comment threads.
 */
import { Router } from "express";
import { issuesController } from "../controllers/issues.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { CreateIssueSchema, VerifyIssueSchema, CommentSchema, ResolveIssueSchema, AdoptIssueSchema } from "../schemas/issue.schema";
import { incidentUploadSpamLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.get("/", issuesController.getIssues);
router.post("/", requireAuth, incidentUploadSpamLimiter(), validateBody(CreateIssueSchema), issuesController.createIssue);
router.put("/:id/verify", requireAuth, validateBody(VerifyIssueSchema), issuesController.verifyIssue);
router.put("/:id/upvote", requireAuth, issuesController.upvoteIssue);
router.put("/:id/flag", requireAuth, issuesController.flagIssue);
router.post("/:id/comments", requireAuth, validateBody(CommentSchema), issuesController.addComment);
router.put("/:id/adopt", requireAuth, validateBody(AdoptIssueSchema), issuesController.adoptIssue);
router.put("/:id/resolve", requireAuth, validateBody(ResolveIssueSchema), issuesController.resolveIssue);

export default router;
