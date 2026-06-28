/**
 * Controller managing community incident reports, physical verifications, comments, adoptions, and resolutions.
 */
import { Response } from "express";
import { Issue } from "../models/issue.model";
import { User } from "../models/user.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { getClientIp } from "../middleware/rateLimit.middleware";
import { getHaversineDistance } from "../utils/geo";
import { sanitizeIssueForClient } from "./admin.controller";

export const issuesController = {
  // Fetch all issues sorted by report date
  getIssues: async (req: AuthRequest, res: Response) => {
    try {
      const list = await Issue.find().sort({ reportedAt: -1 });
      res.json(list.map(sanitizeIssueForClient));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch issues." });
    }
  },

  // Create new issue
  createIssue: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const issueData = req.body;
      const clientIp = getClientIp(req);
      const id = `issue_${Date.now()}`;
      
      const newIssue = await Issue.create({
        ...issueData,
        id,
        status: 'reported',
        reportedBy: user.uid,
        reporterIp: clientIp,
        reportedByName: issueData.anonymous ? 'Anonymous' : user.displayName,
        reportedByAvatar: issueData.anonymous ? null : user.photoURL,
        reportedAt: new Date(),
        verifications: [],
        verificationCount: 0,
        upvotes: [],
        comments: [],
        agentHistory: [
          {
            action: "reported",
            timestamp: new Date(),
            details: `Issue recorded${issueData.anonymous ? ' anonymously' : ` by citizen ${user.displayName}`}. AI pre-evaluated severity as ${issueData.severityScore}/10.`,
            automated: true
          }
        ],
        escalatedAt: null,
        resolvedAt: null,
        resolutionTimeHours: null,
        adoptedBy: null,
        adoptedDate: null,
        isFake: false,
        flagCount: 0,
        flags: [],
        resolvedPhoto: null,
        isChronic: false,
        tags: issueData.tags || ["danger", issueData.category]
      });

      user.points += 10;
      if (user.stats) {
        user.stats.reportsSubmitted = (user.stats.reportsSubmitted || 0) + 1;
        user.stats.helpfulnessScore = (user.stats.reportsVerified || 0) * 15 + (user.stats.issuesResolved || 0) * 25 + user.stats.reportsSubmitted * 10;
      }
      if (newIssue.location?.area) {
        user.area = newIssue.location.area;
      }
      let nextLevel = user.level;
      const nextPoints = user.points;
      if (nextPoints <= 50) nextLevel = 'Newcomer';
      else if (nextPoints <= 150) nextLevel = 'Observer';
      else if (nextPoints <= 350) nextLevel = 'Reporter';
      else if (nextPoints <= 700) nextLevel = 'Investigator';
      else if (nextPoints <= 1200) nextLevel = 'Guardian';
      else nextLevel = 'CivicHero';
      user.level = nextLevel;
      await user.save();

      res.json(newIssue);
    } catch (err) {
      console.error("Failed to create issue:", err);
      res.status(500).json({ error: "Failed to create issue." });
    }
  },

  // Submit physical geofence verification
  verifyIssue: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const { userLat, userLng } = req.body;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      if (issue.reportedBy === user.uid) {
        res.status(400).json({ error: "You cannot verify your own reported issue." });
        return;
      }

      if (issue.verifications.includes(user.uid)) {
        res.status(400).json({ error: "You have already verified this issue." });
        return;
      }

      const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
      if (dist > 500) {
        res.status(400).json({
          error: `You need to be near this location to verify it. Current distance: ${Math.round(dist)}m. Threshold is 500m.`
        });
        return;
      }

      issue.verifications.push(user.uid);
      issue.verificationCount = issue.verifications.length;
      let nextStatus = issue.status;
      
      issue.agentHistory.push({
        action: "verification_added",
        timestamp: new Date(),
        details: `${user.displayName} submitted verified physical validation (distance: ${Math.round(dist)}m).`,
        automated: false
      });

      if (issue.verificationCount >= 3 && issue.status === "reported") {
        nextStatus = "verified";
        issue.agentHistory.push({
          action: "verified",
          timestamp: new Date(),
          details: "🤖 System automatically upgraded status to VERIFIED after receiving 3+ citizen confirmations.",
          automated: true
        });
      }

      if (issue.verificationCount > 10 && issue.severity !== "critical") {
        nextStatus = "escalated";
        issue.agentHistory.push({
          action: "severity_upgraded",
          timestamp: new Date(),
          details: "🤖 System automatically upgraded issue to CRITICAL/ESCALATED due to high verification volume (>10 users).",
          automated: true
        });
      }

      issue.status = nextStatus as any;
      await issue.save();

      user.points += 5;
      if (user.stats) {
        user.stats.reportsVerified = (user.stats.reportsVerified || 0) + 1;
        user.stats.helpfulnessScore = user.stats.reportsVerified * 15 + (user.stats.issuesResolved || 0) * 25 + (user.stats.reportsSubmitted || 0) * 10;
      }
      if (issue.location?.area) {
        user.area = issue.location.area;
      }
      let nextLevel = user.level;
      if (user.points <= 50) nextLevel = 'Newcomer';
      else if (user.points <= 150) nextLevel = 'Observer';
      else if (user.points <= 350) nextLevel = 'Reporter';
      else if (user.points <= 700) nextLevel = 'Investigator';
      else if (user.points <= 1200) nextLevel = 'Guardian';
      else nextLevel = 'CivicHero';
      user.level = nextLevel;
      await user.save();

      const reporter = await User.findOne({ uid: issue.reportedBy });
      if (reporter) {
        reporter.points += 15;
        if (reporter.stats) {
          reporter.stats.helpfulnessScore = (reporter.stats.reportsVerified || 0) * 15 + (reporter.stats.issuesResolved || 0) * 25 + (reporter.stats.reportsSubmitted || 0) * 10;
        }
        let rLevel = reporter.level;
        if (reporter.points <= 50) rLevel = 'Newcomer';
        else if (reporter.points <= 150) rLevel = 'Observer';
        else if (reporter.points <= 350) rLevel = 'Reporter';
        else if (reporter.points <= 700) rLevel = 'Investigator';
        else if (reporter.points <= 1200) rLevel = 'Guardian';
        else rLevel = 'CivicHero';
        reporter.level = rLevel;
        await reporter.save();
      }

      res.json({ success: true, issue });
    } catch (err) {
      res.status(500).json({ error: "Failed to log verification." });
    }
  },

  // Toggle upvote
  upvoteIssue: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      const hasUpvoted = issue.upvotes.includes(user.uid);
      if (hasUpvoted) {
        issue.upvotes = issue.upvotes.filter(uid => uid !== user.uid);
        if (user.stats) {
          user.stats.upvotesGiven = Math.max(0, (user.stats.upvotesGiven || 0) - 1);
        }
      } else {
        issue.upvotes.push(user.uid);
        if (user.stats) {
          user.stats.upvotesGiven = (user.stats.upvotesGiven || 0) + 1;
        }
      }

      await user.save();
      await issue.save();
      res.json(issue);
    } catch (err) {
      res.status(500).json({ error: "Failed to log upvote." });
    }
  },

  // Flag issue as fake / CGI
  flagIssue: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      if (issue.flags.includes(user.uid)) {
        res.status(400).json({ error: "You have already flagged this issue." });
        return;
      }

      issue.flags.push(user.uid);
      issue.flagCount = issue.flags.length;

      if (issue.flagCount >= 3) {
        issue.status = "under_review" as any;
        issue.agentHistory.push({
          action: "flagged_under_review",
          timestamp: new Date(),
          details: "🤖 Issue moved to UNDER REVIEW status due to 3+ independent fraudulent report flags.",
          automated: true
        });
      }

      await issue.save();
      res.json(issue);
    } catch (err) {
      res.status(500).json({ error: "Failed to log flag." });
    }
  },

  // Add citizen comments
  addComment: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const { content } = req.body;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      const newComment = {
        id: `comment_${Date.now()}`,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        content,
        timestamp: new Date()
      };

      issue.comments.push(newComment);
      await issue.save();
      res.json(issue);
    } catch (err) {
      res.status(500).json({ error: "Failed to add comment." });
    }
  },

  // Direct action partner adoption
  adoptIssue: async (req: AuthRequest, res: Response) => {
    try {
      const { orgName } = req.body;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      issue.adoptedBy = orgName;
      issue.adoptedDate = new Date();
      issue.status = "in_progress" as any;
      issue.agentHistory.push({
        action: "adopted",
        timestamp: new Date(),
        details: `🤝 Issue adopted by local partner organization: "${orgName}". Pledged for direct action bypass.`,
        automated: false
      });

      await issue.save();
      res.json(issue);
    } catch (err) {
      res.status(500).json({ error: "Failed to adopt issue." });
    }
  },

  // Certify photo-based resolution on-site
  resolveIssue: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const { resolvedPhotoBase64, userLat, userLng } = req.body;
      const issue = await Issue.findOne({ id: req.params.id });
      if (!issue) {
        res.status(404).json({ error: "Issue not found." });
        return;
      }

      if (issue.status === "resolved") {
        res.status(400).json({ error: "Issue is already marked resolved." });
        return;
      }

      const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
      if (dist > 50) {
        res.status(400).json({
          error: `Resolution photo must be captured on-site (within 50m tolerance) to prevent fraud. You are currently ${Math.round(dist)}m away.`
        });
        return;
      }

      issue.status = "resolved" as any;
      issue.resolvedAt = new Date();
      issue.resolvedPhoto = resolvedPhotoBase64;
      issue.resolutionTimeHours = Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (3600 * 1000)));
      
      issue.agentHistory.push({
        action: "resolved",
        timestamp: new Date(),
        details: `✅ Verification of resolution submitted by ${user.displayName}. On-site GPS tolerance match certified (${Math.round(dist)}m). Side-by-side Before/After slider unlocked.`,
        automated: false
      });

      await issue.save();

      user.points += 15;
      if (user.stats) {
        user.stats.issuesResolved = (user.stats.issuesResolved || 0) + 1;
        user.stats.helpfulnessScore = (user.stats.reportsVerified || 0) * 15 + user.stats.issuesResolved * 25 + (user.stats.reportsSubmitted || 0) * 10;
      }
      if (issue.location?.area) {
        user.area = issue.location.area;
      }
      let nextLevel = user.level;
      if (user.points <= 50) nextLevel = 'Newcomer';
      else if (user.points <= 150) nextLevel = 'Observer';
      else if (user.points <= 350) nextLevel = 'Reporter';
      else if (user.points <= 700) nextLevel = 'Investigator';
      else if (user.points <= 1200) nextLevel = 'Guardian';
      else nextLevel = 'CivicHero';
      user.level = nextLevel;
      await user.save();

      const reporter = await User.findOne({ uid: issue.reportedBy });
      if (reporter) {
        reporter.points += 25;
        if (reporter.stats) {
          reporter.stats.helpfulnessScore = (reporter.stats.reportsVerified || 0) * 15 + (reporter.stats.issuesResolved || 0) * 25 + (reporter.stats.reportsSubmitted || 0) * 10;
        }
        let rLevel = reporter.level;
        if (reporter.points <= 50) rLevel = 'Newcomer';
        else if (reporter.points <= 150) rLevel = 'Observer';
        else if (reporter.points <= 350) rLevel = 'Reporter';
        else if (reporter.points <= 700) rLevel = 'Investigator';
        else if (reporter.points <= 1200) rLevel = 'Guardian';
        else rLevel = 'CivicHero';
        reporter.level = rLevel;
        await reporter.save();
      }

      res.json({ success: true, issue });
    } catch (err) {
      res.status(500).json({ error: "Failed to resolve issue." });
    }
  }
};
