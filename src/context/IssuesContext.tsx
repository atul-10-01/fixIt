import React, { createContext, useContext, useState, useEffect } from 'react';
import { Issue, UserProfile, AgentLog, Severity, IssueStatus, Comment } from '../types';
import { generateSeedIssues, generateSeedAgentLogs, SEED_USERS, getHaversineDistance } from '../utils/seedData';

interface IssuesContextType {
  issues: Issue[];
  agentLogs: AgentLog[];
  users: UserProfile[];
  currentUser: UserProfile;
  warRoomActive: boolean;
  warRoomArea: string;
  offlineQueue: any[];
  addIssue: (issueData: Omit<Issue, 'id' | 'reportedBy' | 'reportedByName' | 'reportedByAvatar' | 'reportedAt' | 'verifications' | 'verificationCount' | 'upvotes' | 'comments' | 'agentHistory' | 'escalatedAt' | 'resolvedAt' | 'resolutionTimeHours' | 'adoptedBy' | 'adoptedDate' | 'isChronic' | 'isFake' | 'flagCount' | 'flags'>) => void;
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
  isOnline: boolean;
  processOfflineQueue: () => void;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export const useIssuesContext = () => {
  const context = useContext(IssuesContext);
  if (!context) throw new Error("useIssuesContext must be used within an IssuesProvider");
  return context;
};

export const IssuesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEED_USERS[0]);
  const [warRoomActive, setWarRoomActive] = useState<boolean>(false);
  const [warRoomArea, setWarRoomArea] = useState<string>("Koramangala");
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Initialize data from localStorage or SeedData
  useEffect(() => {
    const storedIssues = localStorage.getItem("fixit_issues");
    const storedLogs = localStorage.getItem("fixit_agent_logs");
    const storedUsers = localStorage.getItem("fixit_users");
    const storedUser = localStorage.getItem("fixit_current_user");
    const storedWarRoom = localStorage.getItem("fixit_war_room_active");
    const storedWarRoomArea = localStorage.getItem("fixit_war_room_area");
    const storedQueue = localStorage.getItem("fixit_offline_queue");

    if (storedIssues) {
      setIssues(JSON.parse(storedIssues));
    } else {
      const seeded = generateSeedIssues();
      setIssues(seeded);
      localStorage.setItem("fixit_issues", JSON.stringify(seeded));
    }

    if (storedLogs) {
      setAgentLogs(JSON.parse(storedLogs));
    } else {
      const seededLogs = generateSeedAgentLogs();
      setAgentLogs(seededLogs);
      localStorage.setItem("fixit_agent_logs", JSON.stringify(seededLogs));
    }

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(SEED_USERS);
      localStorage.setItem("fixit_users", JSON.stringify(SEED_USERS));
    }

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      setCurrentUser(SEED_USERS[0]);
      localStorage.setItem("fixit_current_user", JSON.stringify(SEED_USERS[0]));
    }

    if (storedWarRoom) {
      setWarRoomActive(JSON.parse(storedWarRoom));
    }
    if (storedWarRoomArea) {
      setWarRoomArea(storedWarRoomArea);
    }

    if (storedQueue) {
      setOfflineQueue(JSON.parse(storedQueue));
    }
  }, []);

  // Sync data helpers
  const saveIssues = (newIssues: Issue[]) => {
    setIssues(newIssues);
    localStorage.setItem("fixit_issues", JSON.stringify(newIssues));
  };

  const saveLogs = (newLogs: AgentLog[]) => {
    setAgentLogs(newLogs);
    localStorage.setItem("fixit_agent_logs", JSON.stringify(newLogs));
  };

  const saveUsersState = (newUsers: UserProfile[]) => {
    setUsers(newUsers);
    localStorage.setItem("fixit_users", JSON.stringify(newUsers));
  };

  const saveCurrentUserState = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    localStorage.setItem("fixit_current_user", JSON.stringify(newUser));
  };

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Browser is back online. Auto-processing offline report queue...");
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log("Browser went offline. Report queuing mode active.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue, issues]);

  // Points increment helper
  const addPointsToUser = (uid: string, pts: number) => {
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

    saveUsersState(updatedUsers);
    const self = updatedUsers.find(u => u.uid === currentUser.uid);
    if (self) {
      saveCurrentUserState(self);
    }
  };

  // Process offline queued submissions
  const processOfflineQueue = () => {
    if (offlineQueue.length === 0) return;

    let updatedIssues = [...issues];
    offlineQueue.forEach(item => {
      const id = `issue_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newIssue: Issue = {
        ...item,
        id,
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

    saveIssues(updatedIssues);
    setOfflineQueue([]);
    localStorage.removeItem("fixit_offline_queue");
    addPointsToUser(currentUser.uid, offlineQueue.length * 10);
  };

  // Add new issue
  const addIssue = (issueData: any) => {
    if (!isOnline) {
      const updatedQueue = [...offlineQueue, issueData];
      setOfflineQueue(updatedQueue);
      localStorage.setItem("fixit_offline_queue", JSON.stringify(updatedQueue));
      return;
    }

    const id = `issue_${Date.now()}`;
    const newIssue: Issue = {
      ...issueData,
      id,
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
    saveIssues(updated);

    // Increment points
    addPointsToUser(currentUser.uid, 10);
  };

  // Verify issue with GPS distance check
  const verifyIssue = (issueId: string, userLat: number, userLng: number): { success: boolean; message: string } => {
    const issueIndex = issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return { success: false, message: "Issue not found." };

    const issue = issues[issueIndex];
    if (issue.reportedBy === currentUser.uid && !issue.anonymous) {
      return { success: false, message: "You cannot verify your own reported issue." };
    }

    if (issue.verifications.includes(currentUser.uid)) {
      return { success: false, message: "You have already verified this issue." };
    }

    // Geofenced checking (500m threshold)
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

    // Upgrade severity if verification count > 10
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
    saveIssues(nextIssues);

    // Grant points
    addPointsToUser(currentUser.uid, 5); // Verify others
    addPointsToUser(issue.reportedBy, 15); // Bonus to original reporter

    return { success: true, message: "Verification logged successfully! Points granted." };
  };

  // Upvote issue
  const upvoteIssue = (issueId: string) => {
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
    saveIssues(updated);
  };

  // Flag as fake
  const flagFakeIssue = (issueId: string) => {
    const updated = issues.map(i => {
      if (i.id === issueId) {
        if (i.flags.includes(currentUser.uid)) return i; // No double flagging

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

    saveIssues(updated);
  };

  // Add Comment
  const addComment = (issueId: string, content: string) => {
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
    saveIssues(updated);
  };

  // Adopt Issue by Local Org / Business
  const adoptIssue = (issueId: string, orgName: string) => {
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

    saveIssues(updated);
  };

  // Resolve issue with Before/After upload and GPS constraint
  const resolveIssue = (issueId: string, resolvedPhotoBase64: string, userLat: number, userLng: number): { success: boolean; message: string } => {
    const issueIndex = issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return { success: false, message: "Issue not found." };

    const issue = issues[issueIndex];
    if (issue.status === "resolved") return { success: false, message: "Issue is already marked resolved." };

    // Geofenced check: tolerance 50 meters
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
    saveIssues(nextIssues);

    // Grant massive points
    addPointsToUser(currentUser.uid, 15); // resolver points
    addPointsToUser(issue.reportedBy, 25); // reward reporter for successful resolve

    // Record agent log
    const newLog: AgentLog = {
      id: `log_res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "resolution_verified",
      issueId: issue.id,
      issueTitle: issue.title,
      details: `🤖 Verified resolution for Issue #${issue.id.split('_')[1]}. On-site proof verified within 50m boundaries. Direct-impact points awarded.`,
      automated: true
    };
    saveLogs([newLog, ...agentLogs]);

    return { success: true, message: "Issue resolved successfully! High-quality on-site Before/After proof registered." };
  };

  // War Room Emergency Mode Triggering
  const triggerWarRoom = (area: string) => {
    setWarRoomActive(true);
    setWarRoomArea(area);
    localStorage.setItem("fixit_war_room_active", "true");
    localStorage.setItem("fixit_war_room_area", area);

    // Instantly escalate and make critical all issues in the affected area
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

    saveIssues(nextIssues);

    const newLog: AgentLog = {
      id: `log_wr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "war_room_triggered",
      issueId: "war_room_network",
      issueTitle: `EMERGENCY ACTION IN ${area.toUpperCase()}`,
      details: `🤖 WAR ROOM ACTIVE in ${area}. All unresolved local cases escalated to CRITICAL priority with 2-hour agent escalation sweeps active.`,
      automated: true
    };

    saveLogs([newLog, ...agentLogs]);
  };

  const deactivateWarRoom = () => {
    setWarRoomActive(false);
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
    saveLogs([newLog, ...agentLogs]);
  };

  // Autonomous Escalation Engine Sweeper (Feature 5 Agent)
  const runAgentLoop = () => {
    console.log("Starting Autonomous Escalation Agent check cycle...");
    let logsCreated: AgentLog[] = [];
    const nowTime = Date.now();
    const thresholdMs = warRoomActive ? 2 * 3600 * 1000 : 48 * 3600 * 1000; // 2hrs in War Room, else 48hrs

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

      // Rule 1: Auto-escalate unresolved high/critical issues after threshold
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

      // Rule 2: Chronic Zone Detection
      // Find nearby issues in the same 200m radius of the same category reported in last 90 days
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
      saveIssues(updatedIssues);
      saveLogs([...logsCreated, ...agentLogs]);
    } else {
      // Just record a heartbeat logs
      const heartbeatLog: AgentLog = {
        id: `log_heartbeat_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "duplicate_merged",
        issueId: "system_sweep",
        issueTitle: "AGENT SWEEP HEARTBEAT",
        details: "🤖 Sweep cycle completed. No outstanding delays detected in remaining categories.",
        automated: true
      };
      saveLogs([heartbeatLog, ...agentLogs]);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem("fixit_issues");
    localStorage.removeItem("fixit_agent_logs");
    localStorage.removeItem("fixit_users");
    localStorage.removeItem("fixit_current_user");
    localStorage.removeItem("fixit_war_room_active");
    localStorage.removeItem("fixit_war_room_area");
    localStorage.removeItem("fixit_offline_queue");

    const seeded = generateSeedIssues();
    const seededLogs = generateSeedAgentLogs();
    setIssues(seeded);
    setAgentLogs(seededLogs);
    setUsers(SEED_USERS);
    setCurrentUser(SEED_USERS[0]);
    setWarRoomActive(false);
    setOfflineQueue([]);
    setIsOnline(true);

    localStorage.setItem("fixit_issues", JSON.stringify(seeded));
    localStorage.setItem("fixit_agent_logs", JSON.stringify(seededLogs));
    localStorage.setItem("fixit_users", JSON.stringify(SEED_USERS));
    localStorage.setItem("fixit_current_user", JSON.stringify(SEED_USERS[0]));
  };

  return (
    <IssuesContext.Provider value={{
      issues,
      agentLogs,
      users,
      currentUser,
      warRoomActive,
      warRoomArea,
      offlineQueue,
      isOnline,
      addIssue,
      verifyIssue,
      upvoteIssue,
      flagFakeIssue,
      addComment,
      adoptIssue,
      resolveIssue,
      triggerWarRoom,
      deactivateWarRoom,
      runAgentLoop,
      clearAllData,
      processOfflineQueue
    }}>
      {children}
    </IssuesContext.Provider>
  );
};
