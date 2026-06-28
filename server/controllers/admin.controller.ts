/**
 * Controller managing administrative actions, agent sweeps, database resets, and role state updates.
 */
import { Response } from "express";
import { User } from "../models/user.model";
import { Issue } from "../models/issue.model";
import { Session } from "../models/session.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { getHaversineDistance } from "../utils/geo";
import { generateSeedIssues, SEED_USERS } from "../../src/utils/seedData";

export const PUBLIC_USER_FIELDS = 'uid displayName photoURL points level badges area joinedAt stats role';

// Strip reportedBy/reportedByName/reportedByAvatar from anonymous issues before sending to client
export function sanitizeIssueForClient(issue: any) {
  const obj = issue.toObject ? issue.toObject() : { ...issue };
  if (obj.anonymous) {
    obj.reportedBy = null;
    obj.reportedByName = 'Anonymous';
    obj.reportedByAvatar = null;
  }
  return obj;
}

export const adminController = {
  // Toggles the role of currently logged-in user (citizen <-> admin)
  toggleRole: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      const nextRole = user.role === 'admin' ? 'citizen' : 'admin';
      user.role = nextRole;
      await user.save();
      
      console.log(`User ${user.displayName} toggled role to ${nextRole}`);
      res.json(user);
    } catch (err) {
      console.error("Failed to toggle role:", err);
      res.status(500).json({ error: "Failed to toggle role." });
    }
  },

  // Performs backend-level sweeps on reported issues
  runSweep: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        res.status(403).json({ error: "Access denied. Administrator privileges required." });
        return;
      }

      const issues = await Issue.find();
      const activeIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'rejected' && i.status !== 'under_review');
      const logs: any[] = [];
      const now = new Date();

      // Rule 1: Auto-Escalation (High/Critical priority unresolved after 48 hours)
      for (const issue of activeIssues) {
        if (issue.severityScore >= 7 && issue.status !== 'escalated') {
          const timeDiff = now.getTime() - new Date(issue.reportedAt).getTime();
          const fortyEightHours = 48 * 60 * 60 * 1000;
          if (timeDiff > fortyEightHours) {
            issue.status = 'escalated';
            issue.severity = 'critical';
            issue.severityScore = 10;
            issue.escalatedAt = now;
            
            const details = "🤖 Autonomous Agent escalated report: No repair work initiated within 48 hours. Legal notification generated for municipal ward commissioner.";
            issue.agentHistory.push({
              action: "auto_escalated",
              timestamp: now,
              details,
              automated: true
            });
            
            await issue.save();

            logs.push({
              id: `log_esc_${issue.id}_${Date.now()}`,
              timestamp: now.toISOString(),
              action: "auto_escalated",
              issueId: issue.id,
              issueTitle: issue.title,
              details,
              automated: true
            });
          }
        }
      }

      // Rule 2: Duplicate Merge (same category within 100m)
      const sortedActive = [...activeIssues].sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
      const mergedIds = new Set<string>();

      for (let i = 0; i < sortedActive.length; i++) {
        const parent = sortedActive[i];
        if (mergedIds.has(parent.id)) continue;

        for (let j = i + 1; j < sortedActive.length; j++) {
          const child = sortedActive[j];
          if (mergedIds.has(child.id) || parent.category !== child.category) continue;

          const dist = getHaversineDistance(parent.location.lat, parent.location.lng, child.location.lat, child.location.lng);
          if (dist <= 100) {
            mergedIds.add(child.id);
            child.status = 'rejected';

            // Combine upvotes
            const combinedUpvotes = Array.from(new Set([...parent.upvotes, ...child.upvotes]));
            parent.upvotes = combinedUpvotes;

            // Merge comments
            const combinedComments = [...parent.comments, ...child.comments].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            parent.comments = combinedComments as any;

            // Merge images
            if (child.images && child.images.length > 0) {
              for (const img of child.images) {
                if (!parent.images.includes(img)) {
                  parent.images.push(img);
                }
              }
            }

            const parentDetails = `🤖 Identified duplicate report submitted within ${Math.round(dist)} meters. Combined upvotes and merged comments.`;
            parent.agentHistory.push({
              action: "duplicate_merged",
              timestamp: now,
              details: parentDetails,
              automated: true
            });

            child.agentHistory.push({
              action: "rejected",
              timestamp: now,
              details: "🤖 Marked as duplicate. Merged with active issue.",
              automated: true
            });

            await parent.save();
            await child.save();

            logs.push({
              id: `log_merge_${parent.id}_${child.id}_${Date.now()}`,
              timestamp: now.toISOString(),
              action: "duplicate_merged",
              issueId: parent.id,
              issueTitle: parent.title,
              details: `🤖 Identified duplicate ${parent.category} report submitted within ${Math.round(dist)}m of active issue #${parent.id}. Combined upvotes and merged images/comments.`,
              automated: true
            });
          }
        }
      }

      // Rule 3: Chronic Zone Sweep (3+ recurring reports in same 200m in past 90 days)
      const updatedIssues = await Issue.find();
      const activeAndResolved = updatedIssues.filter(i => i.status !== 'rejected' && i.status !== 'under_review');

      for (const issue of activeAndResolved) {
        if (issue.status === 'resolved' || issue.isChronic) continue;

        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const matches = activeAndResolved.filter(other => {
          if (other.category !== issue.category) return false;
          if (new Date(other.reportedAt) < ninetyDaysAgo) return false;
          const dist = getHaversineDistance(issue.location.lat, issue.location.lng, other.location.lat, other.location.lng);
          return dist <= 200;
        });

        if (matches.length >= 3) {
          issue.isChronic = true;
          issue.severity = 'critical';
          issue.severityScore = 10;
          
          const details = `🤖 Detected 3+ recurring ${issue.category.replace('_', ' ')}s in same 200m radius within 90 days. System auto-tagged zone '🔴 Chronic Zone' and upgraded priority to CRITICAL.`;
          issue.agentHistory.push({
            action: "chronic_zone_tagged",
            timestamp: now,
            details,
            automated: true
          });

          await issue.save();

          logs.push({
            id: `log_chr_${issue.id}_${Date.now()}`,
            timestamp: now.toISOString(),
            action: "chronic_zone_tagged",
            issueId: issue.id,
            issueTitle: issue.title,
            details,
            automated: true
          });
        }
      }

      if (logs.length === 0) {
        logs.push({
          id: `log_heartbeat_${Date.now()}`,
          timestamp: now.toISOString(),
          action: "duplicate_merged",
          issueId: "system_sweep",
          issueTitle: "AGENT SWEEP HEARTBEAT",
          details: "🤖 Sweep cycle completed. No outstanding delays detected in remaining categories.",
          automated: true
        });
      }

      const finalIssuesList = await Issue.find().sort({ reportedAt: -1 });
      res.json({
        success: true,
        logs,
        issues: finalIssuesList.map(sanitizeIssueForClient)
      });
    } catch (err) {
      console.error("Backend agent sweep loop failed:", err);
      res.status(500).json({ error: "Agent sweep loop execution failed." });
    }
  },

  // Full database re-seed, preserving current user and session
  resetDatabase: async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        res.status(403).json({ error: "Access denied. Administrator privileges required." });
        return;
      }

      const sessionId = req.cookies?.fixit_sid;

      // Store user data to restore
      const currentUid = user.uid;
      const currentDisplayName = user.displayName;
      const currentPhotoURL = user.photoURL;
      const currentEmail = user.email;
      const currentPoints = user.points;
      const currentLevel = user.level;
      const currentBadges = user.badges;
      const currentArea = user.area;
      const currentJoinedAt = user.joinedAt;
      const currentStats = user.stats;
      const currentRole = user.role;

      // Clear everything
      await Issue.deleteMany({});
      await User.deleteMany({});
      await Session.deleteMany({});

      // Re-seed mock users
      for (const u of SEED_USERS) {
        if (u.uid === currentUid) continue;
        await User.create({
          uid: u.uid,
          displayName: u.displayName,
          photoURL: u.photoURL,
          email: u.email,
          points: u.points,
          level: u.level,
          badges: u.badges,
          area: u.area,
          joinedAt: new Date(u.joinedAt),
          stats: u.stats,
          role: 'citizen'
        });
      }

      // Re-create session user
      const dbUser = await User.create({
        uid: currentUid,
        displayName: currentDisplayName,
        photoURL: currentPhotoURL,
        email: currentEmail,
        points: currentPoints,
        level: currentLevel,
        badges: currentBadges,
        area: currentArea,
        joinedAt: currentJoinedAt,
        stats: currentStats,
        role: currentRole
      });

      // Recreate session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await Session.create({ sessionId, uid: currentUid, expiresAt });

      // Re-seed issues
      const seedIssues = generateSeedIssues();
      for (const iss of seedIssues) {
        const dbIssue = {
          ...iss,
          reportedAt: new Date(iss.reportedAt),
          verifications: iss.verifications,
          comments: iss.comments.map(c => ({
            ...c,
            timestamp: new Date(c.timestamp)
          })),
          agentHistory: iss.agentHistory.map(h => ({
            ...h,
            timestamp: new Date(h.timestamp)
          })),
          escalatedAt: iss.escalatedAt ? new Date(iss.escalatedAt) : undefined,
          resolvedAt: iss.resolvedAt ? new Date(iss.resolvedAt) : undefined,
          adoptedDate: iss.adoptedDate ? new Date(iss.adoptedDate) : undefined
        };
        await Issue.create(dbIssue);
      }

      const cleanIssues = await Issue.find().sort({ reportedAt: -1 });
      const cleanUsers = await User.find().sort({ points: -1 }).select(PUBLIC_USER_FIELDS);

      res.json({
        success: true,
        issues: cleanIssues.map(sanitizeIssueForClient),
        users: cleanUsers,
        currentUser: dbUser
      });
    } catch (err) {
      console.error("Database reset failed:", err);
      res.status(500).json({ error: "Database reset failed." });
    }
  },

  // Returns leaderboard users
  getLeaderboard: async (req: AuthRequest, res: Response) => {
    try {
      const list = await User.find()
        .sort({ points: -1 })
        .limit(25)
        .select(PUBLIC_USER_FIELDS);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leaderboard." });
    }
  }
};
