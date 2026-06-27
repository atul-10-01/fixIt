import { create } from 'zustand';
import { Issue, UserProfile, AgentLog, Severity, IssueStatus, Comment } from '../types';
import { generateSeedIssues, generateSeedAgentLogs, SEED_USERS, getHaversineDistance } from '../utils/seedData';

// Helper to read initial state safely
const getStoredJSON = (key: string, fallback: any) => {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// Seeding checks for initial load
const getInitialIssues = (): Issue[] => {
  const stored = localStorage.getItem("fixit_issues");
  if (stored) return JSON.parse(stored);
  const seeded = generateSeedIssues();
  localStorage.setItem("fixit_issues", JSON.stringify(seeded));
  return seeded;
};

const getInitialLogs = (): AgentLog[] => {
  const stored = localStorage.getItem("fixit_agent_logs");
  if (stored) return JSON.parse(stored);
  const seeded = generateSeedAgentLogs();
  localStorage.setItem("fixit_agent_logs", JSON.stringify(seeded));
  return seeded;
};

const getInitialUsers = (): UserProfile[] => {
  const stored = localStorage.getItem("fixit_users");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("fixit_users", JSON.stringify(SEED_USERS));
  return SEED_USERS;
};

const getInitialCurrentUser = (): UserProfile => {
  const stored = localStorage.getItem("fixit_current_user");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("fixit_current_user", JSON.stringify(SEED_USERS[0]));
  return SEED_USERS[0];
};

interface IssuesState {
  issues: Issue[];
  agentLogs: AgentLog[];
  users: UserProfile[];
  currentUser: UserProfile;
  warRoomActive: boolean;
  warRoomArea: string;
  offlineQueue: any[];
  isOnline: boolean;
  
  setIsOnline: (online: boolean) => void;
  addIssue: (issueData: Omit<Issue, 'id' | 'status' | 'reportedBy' | 'reportedByName' | 'reportedByAvatar' | 'reportedAt' | 'verifications' | 'verificationCount' | 'upvotes' | 'comments' | 'agentHistory' | 'escalatedAt' | 'resolvedAt' | 'resolutionTimeHours' | 'adoptedBy' | 'adoptedDate' | 'isChronic' | 'isFake' | 'flagCount' | 'flags' | 'resolvedPhoto'>) => void;
  verifyIssue: (issueId: string, userLat: number, userLng: number) => { success: boolean; message: string };
  upvoteIssue: (issueId: string) => void;
  flagFakeIssue: (issueId: string) => void;
  addComment: (issueId: string, content: string) => void;
  adoptIssue: (issueId: string, orgName: string) => void;
  resolveIssue: (issueId: string, resolvedPhotoBase64: string, userLat: number, userLng: number) => { success: boolean; message: string };
  triggerWarRoom: (area: string) => void;
  deactivateWarRoom: () => void;
  runAgentLoop: () => void;
  clearAllData: () => void;
  processOfflineQueue: () => void;
  addPointsToUser: (uid: string, pts: number) => void;
}

export const useIssuesStore = create<IssuesState>((set, get) => ({
  issues: getInitialIssues(),
  agentLogs: getInitialLogs(),
  users: getInitialUsers(),
  currentUser: getInitialCurrentUser(),
  warRoomActive: getStoredJSON("fixit_war_room_active", false),
  warRoomArea: localStorage.getItem("fixit_war_room_area") || "Koramangala",
  offlineQueue: getStoredJSON("fixit_offline_queue", []),
  isOnline: navigator.onLine,

  setIsOnline: (online) => set({ isOnline: online }),

  addPointsToUser: (uid, pts) => {
    const { users, currentUser } = get();
    const updatedUsers = users.map(u => {
      if (u.uid === uid) {
        const nextPoints = u.points + pts;
        let nextLevel = u.level;
        if (nextPoints <= 50) nextLevel = 'Newcomer';
        else if (nextPoints <= 150) nextLevel = 'Observer';
        else if (nextPoints <= 350) nextLevel = 'Reporter';
        else if (nextPoints <= 700) nextLevel = 'Investigator';
        else if (nextPoints <= 1200) nextLevel = 'Guardian';
        else nextLevel = 'CivicHero';

        return {
          ...u,
          points: nextPoints,
          level: nextLevel as any
        };
      }
      return u;
    });

    set({ users: updatedUsers });
    localStorage.setItem("fixit_users", JSON.stringify(updatedUsers));
    
    const self = updatedUsers.find(u => u.uid === currentUser.uid);
    if (self) {
      set({ currentUser: self });
      localStorage.setItem("fixit_current_user", JSON.stringify(self));
    }
  },

  processOfflineQueue: () => {
    const { offlineQueue, issues, currentUser, addPointsToUser } = get();
    if (offlineQueue.length === 0) return;

    let updatedIssues = [...issues];
    offlineQueue.forEach(item => {
      const id = `issue_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newIssue: Issue = {
        ...item,
        id,
        status: "reported",
        verifications: [],
        verificationCount: 0,
        upvotes: [],
        comments: [],
        agentHistory: [
          {
            action: "reported",
            timestamp: new Date().toISOString(),
            details: "Report successfully pushed from Offline Queue. AI analysis synced.",
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
        resolvedPhoto: null
      };
      updatedIssues.unshift(newIssue);
    });

    set({ issues: updatedIssues, offlineQueue: [] });
    localStorage.setItem("fixit_issues", JSON.stringify(updatedIssues));
    localStorage.removeItem("fixit_offline_queue");
    addPointsToUser(currentUser.uid, offlineQueue.length * 10);
  },

  addIssue: (issueData) => {
    const { isOnline, offlineQueue, issues, currentUser, addPointsToUser } = get();
    if (!isOnline) {
      const updatedQueue = [...offlineQueue, issueData];
      set({ offlineQueue: updatedQueue });
      localStorage.setItem("fixit_offline_queue", JSON.stringify(updatedQueue));
      return;
    }

    const id = `issue_${Date.now()}`;
    const newIssue: Issue = {
      ...issueData,
      id,
      status: 'reported',
      reportedBy: currentUser.uid,
      reportedByName: currentUser.displayName,
      reportedByAvatar: currentUser.photoURL,
      reportedAt: new Date().toISOString(),
      verifications: [],
      verificationCount: 0,
      upvotes: [],
      comments: [],
      agentHistory: [
        {
          action: "reported",
          timestamp: new Date().toISOString(),
          details: `Issue recorded by citizen ${currentUser.displayName}. AI pre-evaluated severity as ${issueData.severityScore}/10.`,
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
      resolvedPhoto: null
    };

    const updated = [newIssue, ...issues];
    set({ issues: updated });
    localStorage.setItem("fixit_issues", JSON.stringify(updated));

    addPointsToUser(currentUser.uid, 10);
  },

  verifyIssue: (issueId, userLat, userLng) => {
    const { issues, currentUser, addPointsToUser } = get();
    const issueIndex = issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return { success: false, message: "Issue not found." };

    const issue = issues[issueIndex];
    if (issue.reportedBy === currentUser.uid && !issue.anonymous) {
      return { success: false, message: "You cannot verify your own reported issue." };
    }

    if (issue.verifications.includes(currentUser.uid)) {
      return { success: false, message: "You have already verified this issue." };
    }

    const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
    if (dist > 500) {
      return {
        success: false,
        message: `You need to be near this location to verify it. Current distance: ${Math.round(dist)}m. Threshold is 500m.`
      };
    }

    const nextVerifications = [...issue.verifications, currentUser.uid];
    const nextCount = nextVerifications.length;
    let nextStatus = issue.status;
    let nextHistory = [...issue.agentHistory];

    nextHistory.push({
      action: "verification_added",
      timestamp: new Date().toISOString(),
      details: `${currentUser.displayName} submitted verified physical validation (distance: ${Math.round(dist)}m).`,
      automated: false
    });

    if (nextCount >= 3 && issue.status === "reported") {
      nextStatus = "verified";
      nextHistory.push({
        action: "verified",
        timestamp: new Date().toISOString(),
        details: "🤖 System automatically upgraded status to VERIFIED after receiving 3+ citizen confirmations.",
        automated: true
      });
    }

    if (nextCount > 10 && issue.severity !== "critical") {
      nextStatus = "escalated";
      nextHistory.push({
        action: "severity_upgraded",
        timestamp: new Date().toISOString(),
        details: "🤖 System automatically upgraded issue to CRITICAL/ESCALATED due to high verification volume (>10 users).",
        automated: true
      });
    }

    const updatedIssue: Issue = {
      ...issue,
      verifications: nextVerifications,
      verificationCount: nextCount,
      status: nextStatus,
      agentHistory: nextHistory
    };

    const nextIssues = [...issues];
    nextIssues[issueIndex] = updatedIssue;
    
    set({ issues: nextIssues });
    localStorage.setItem("fixit_issues", JSON.stringify(nextIssues));

    addPointsToUser(currentUser.uid, 5);
    addPointsToUser(issue.reportedBy, 15);

    return { success: true, message: "Verification logged successfully! Points granted." };
  },

  upvoteIssue: (issueId) => {
    const { issues, currentUser } = get();
    const updated = issues.map(i => {
      if (i.id === issueId) {
        const hasUpvoted = i.upvotes.includes(currentUser.uid);
        const nextUpvotes = hasUpvoted
          ? i.upvotes.filter(u => u !== currentUser.uid)
          : [...i.upvotes, currentUser.uid];
        return {
          ...i,
          upvotes: nextUpvotes
        };
      }
      return i;
    });
    set({ issues: updated });
    localStorage.setItem("fixit_issues", JSON.stringify(updated));
  },

  flagFakeIssue: (issueId) => {
    const { issues, currentUser } = get();
    const updated = issues.map(i => {
      if (i.id === issueId) {
        if (i.flags.includes(currentUser.uid)) return i;

        const nextFlags = [...i.flags, currentUser.uid];
        const nextFlagCount = nextFlags.length;
        let nextStatus = i.status;
        let nextHistory = [...i.agentHistory];

        if (nextFlagCount >= 3) {
          nextStatus = "under_review";
          nextHistory.push({
            action: "flagged_under_review",
            timestamp: new Date().toISOString(),
            details: "🤖 Issue moved to UNDER REVIEW status due to 3+ independent fraudulent report flags.",
            automated: true
          });
        }

        return {
          ...i,
          flags: nextFlags,
          flagCount: nextFlagCount,
          status: nextStatus,
          agentHistory: nextHistory
        };
      }
      return i;
    });

    set({ issues: updated });
    localStorage.setItem("fixit_issues", JSON.stringify(updated));
  },

  addComment: (issueId, content) => {
    const { issues, currentUser } = get();
    if (!content.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.photoURL,
      content,
      timestamp: new Date().toISOString()
    };

    const updated = issues.map(i => {
      if (i.id === issueId) {
        return {
          ...i,
          comments: [...i.comments, newComment]
        };
      }
      return i;
    });
    set({ issues: updated });
    localStorage.setItem("fixit_issues", JSON.stringify(updated));
  },

  adoptIssue: (issueId, orgName) => {
    const { issues } = get();
    if (!orgName.trim()) return;

    const updated = issues.map(i => {
      if (i.id === issueId) {
        const nextHistory = [...i.agentHistory, {
          action: "adopted",
          timestamp: new Date().toISOString(),
          details: `🤝 Issue adopted by local partner organization: "${orgName}". Pledged for direct action bypass.`,
          automated: false
        }];

        return {
          ...i,
          adoptedBy: orgName,
          adoptedDate: new Date().toISOString(),
          status: "in_progress" as IssueStatus,
          agentHistory: nextHistory
        };
      }
      return i;
    });

    set({ issues: updated });
    localStorage.setItem("fixit_issues", JSON.stringify(updated));
  },

  resolveIssue: (issueId, resolvedPhotoBase64, userLat, userLng) => {
    const { issues, currentUser, agentLogs, addPointsToUser } = get();
    const issueIndex = issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return { success: false, message: "Issue not found." };

    const issue = issues[issueIndex];
    if (issue.status === "resolved") return { success: false, message: "Issue is already marked resolved." };

    const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
    if (dist > 50) {
      return {
        success: false,
        message: `Resolution photo must be captured on-site (within 50m tolerance) to prevent fraud. You are currently ${Math.round(dist)}m away.`
      };
    }

    const nextHistory = [...issue.agentHistory, {
      action: "resolved",
      timestamp: new Date().toISOString(),
      details: `✅ Verification of resolution submitted by ${currentUser.displayName}. On-site GPS tolerance match certified (${Math.round(dist)}m). Side-by-side Before/After slider unlocked.`,
      automated: false
    }];

    const updatedIssue: Issue = {
      ...issue,
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolvedPhoto: resolvedPhotoBase64,
      agentHistory: nextHistory,
      resolutionTimeHours: Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (3600 * 1000)))
    };

    const nextIssues = [...issues];
    nextIssues[issueIndex] = updatedIssue;
    set({ issues: nextIssues });
    localStorage.setItem("fixit_issues", JSON.stringify(nextIssues));

    addPointsToUser(currentUser.uid, 15);
    addPointsToUser(issue.reportedBy, 25);

    const newLog: AgentLog = {
      id: `log_res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "resolution_verified",
      issueId: issue.id,
      issueTitle: issue.title,
      details: `🤖 Verified resolution for Issue #${issue.id.split('_')[1]}. On-site proof verified within 50m boundaries. Direct-impact points awarded.`,
      automated: true
    };
    const nextLogs = [newLog, ...agentLogs];
    set({ agentLogs: nextLogs });
    localStorage.setItem("fixit_agent_logs", JSON.stringify(nextLogs));

    return { success: true, message: "Issue resolved successfully! High-quality on-site Before/After proof registered." };
  },

  triggerWarRoom: (area) => {
    const { issues, agentLogs } = get();
    set({ warRoomActive: true, warRoomArea: area });
    localStorage.setItem("fixit_war_room_active", "true");
    localStorage.setItem("fixit_war_room_area", area);

    const nextIssues = issues.map(i => {
      if (i.location.area.toLowerCase() === area.toLowerCase() && i.status !== "resolved") {
        const nextHistory = [...i.agentHistory, {
          action: "war_room_escalation",
          timestamp: new Date().toISOString(),
          details: `⚠️ WAR ROOM EMERGENCY ACTIVE. System automatically upgraded severity to CRITICAL and status to ESCALATED.`,
          automated: true
        }];
        return {
          ...i,
          severity: "critical" as Severity,
          severityScore: 10,
          status: "escalated" as IssueStatus,
          agentHistory: nextHistory
        };
      }
      return i;
    });

    set({ issues: nextIssues });
    localStorage.setItem("fixit_issues", JSON.stringify(nextIssues));

    const newLog: AgentLog = {
      id: `log_wr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "war_room_triggered",
      issueId: "war_room_network",
      issueTitle: `EMERGENCY ACTION IN ${area.toUpperCase()}`,
      details: `🤖 WAR ROOM ACTIVE in ${area}. All unresolved local cases escalated to CRITICAL priority with 2-hour agent escalation sweeps active.`,
      automated: true
    };
    const nextLogs = [newLog, ...agentLogs];
    set({ agentLogs: nextLogs });
    localStorage.setItem("fixit_agent_logs", JSON.stringify(nextLogs));
  },

  deactivateWarRoom: () => {
    const { agentLogs } = get();
    set({ warRoomActive: false });
    localStorage.setItem("fixit_war_room_active", "false");

    const newLog: AgentLog = {
      id: `log_wr_off_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "war_room_triggered",
      issueId: "war_room_network",
      issueTitle: "EMERGENCY WAR ROOM OFF",
      details: `🤖 War Room deactivated. Standing emergency priority reverted to normal ward schedules.`,
      automated: true
    };
    const nextLogs = [newLog, ...agentLogs];
    set({ agentLogs: nextLogs });
    localStorage.setItem("fixit_agent_logs", JSON.stringify(nextLogs));
  },

  runAgentLoop: () => {
    const { issues, warRoomActive, agentLogs } = get();
    console.log("Starting Autonomous Escalation Agent check cycle...");
    let logsCreated: AgentLog[] = [];
    const nowTime = Date.now();
    const thresholdMs = warRoomActive ? 2 * 3600 * 1000 : 48 * 3600 * 1000;

    const updatedIssues = issues.map(i => {
      if (i.status === "resolved" || i.status === "rejected" || i.status === "under_review") return i;

      let nextStatus = i.status;
      let nextSeverity = i.severity;
      let nextSeverityScore = i.severityScore;
      let nextHistory = [...i.agentHistory];
      let tags = [...i.tags];
      let isChronic = i.isChronic;

      const elapsedMs = nowTime - new Date(i.reportedAt).getTime();
      let modified = false;

      if ((i.severity === "high" || i.severity === "critical") && i.status !== "escalated" && elapsedMs > thresholdMs) {
        nextStatus = "escalated";
        nextHistory.push({
          action: "auto_escalated",
          timestamp: new Date().toISOString(),
          details: `🤖 Agent auto-escalation: Case unresolved for ${Math.round(elapsedMs / 3600000)} hours. Advanced warning letter prepared for municipal authority.`,
          automated: true
        });
        logsCreated.push({
          id: `log_agent_esc_${Date.now()}_${i.id}`,
          timestamp: new Date().toISOString(),
          action: "auto_escalated",
          issueId: i.id,
          issueTitle: i.title,
          details: `🤖 Auto-escalated Issue #${i.id.split('_')[1]} after outstanding delay. Drafting municipal alert.`,
          automated: true
        });
        modified = true;
      }

      const sameCategoryNearby = issues.filter(other => {
        if (other.id === i.id || other.category !== i.category) return false;
        const dist = getHaversineDistance(i.location.lat, i.location.lng, other.location.lat, other.location.lng);
        return dist <= 200;
      });

      if (sameCategoryNearby.length >= 2 && !i.isChronic) {
        isChronic = true;
        nextSeverity = "critical" as Severity;
        nextSeverityScore = Math.max(9, i.severityScore);
        if (!tags.includes("chronic_zone")) {
          tags.push("chronic_zone");
        }
        nextHistory.push({
          action: "chronic_zone_tagged",
          timestamp: new Date().toISOString(),
          details: `🤖 System classified coordinates as CHRONIC ZONE (3+ repeat issues of type '${i.category}' within 200m radius). Severity boosted.`,
          automated: true
        });
        logsCreated.push({
          id: `log_agent_chr_${Date.now()}_${i.id}`,
          timestamp: new Date().toISOString(),
          action: "chronic_zone_tagged",
          issueId: i.id,
          issueTitle: i.title,
          details: `🤖 Tagged repeat coordination quadrant as '🔴 Chronic Zone'. Heightened safety audits active.`,
          automated: true
        });
        modified = true;
      }

      if (modified) {
        return {
          ...i,
          status: nextStatus,
          severity: nextSeverity,
          severityScore: nextSeverityScore,
          agentHistory: nextHistory,
          tags,
          isChronic
        };
      }

      return i;
    });

    if (logsCreated.length > 0) {
      set({ issues: updatedIssues, agentLogs: [...logsCreated, ...agentLogs] });
      localStorage.setItem("fixit_issues", JSON.stringify(updatedIssues));
      localStorage.setItem("fixit_agent_logs", JSON.stringify([...logsCreated, ...agentLogs]));
    } else {
      const heartbeatLog: AgentLog = {
        id: `log_heartbeat_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "duplicate_merged",
        issueId: "system_sweep",
        issueTitle: "AGENT SWEEP HEARTBEAT",
        details: "🤖 Sweep cycle completed. No outstanding delays detected in remaining categories.",
        automated: true
      };
      set({ agentLogs: [heartbeatLog, ...agentLogs] });
      localStorage.setItem("fixit_agent_logs", JSON.stringify([heartbeatLog, ...agentLogs]));
    }
  },

  clearAllData: () => {
    localStorage.removeItem("fixit_issues");
    localStorage.removeItem("fixit_agent_logs");
    localStorage.removeItem("fixit_users");
    localStorage.removeItem("fixit_current_user");
    localStorage.removeItem("fixit_war_room_active");
    localStorage.removeItem("fixit_war_room_area");
    localStorage.removeItem("fixit_offline_queue");

    const seeded = generateSeedIssues();
    const seededLogs = generateSeedAgentLogs();

    set({
      issues: seeded,
      agentLogs: seededLogs,
      users: SEED_USERS,
      currentUser: SEED_USERS[0],
      warRoomActive: false,
      offlineQueue: [],
      isOnline: true
    });

    localStorage.setItem("fixit_issues", JSON.stringify(seeded));
    localStorage.setItem("fixit_agent_logs", JSON.stringify(seededLogs));
    localStorage.setItem("fixit_users", JSON.stringify(SEED_USERS));
    localStorage.setItem("fixit_current_user", JSON.stringify(SEED_USERS[0]));
  }
}));
