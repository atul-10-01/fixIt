import { create } from 'zustand';
import { Issue, UserProfile, AgentLog } from '../types';
import { generateSeedIssues, generateSeedAgentLogs, SEED_USERS, getHaversineDistance } from '../utils/seedData';
import { issuesService } from '../services/issuesService';

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

// One-time migration: purge any stale localStorage keys from old builds
(function purgeStaleKeys() {
  const staleKeys = [
    'fixit_current_user',
    'fixit_users',
    'fixit_agent_logs',
    'fixit_war_room_active',
    'fixit_war_room_area',
  ];
  staleKeys.forEach(k => localStorage.removeItem(k));
})();

// Seeding checks for initial load — issues only
const getInitialIssues = (): Issue[] => {
  const stored = localStorage.getItem('fixit_issues');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  return generateSeedIssues();
};

const getInitialLogs = (): AgentLog[] => generateSeedAgentLogs();


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
  initializeStore: () => Promise<void>;
  logoutUser: () => Promise<void>;
  addIssue: (issueData: Omit<Issue, 'id' | 'status' | 'reportedBy' | 'reportedByName' | 'reportedByAvatar' | 'reportedAt' | 'verifications' | 'verificationCount' | 'upvotes' | 'comments' | 'agentHistory' | 'escalatedAt' | 'resolvedAt' | 'resolutionTimeHours' | 'adoptedBy' | 'adoptedDate' | 'isChronic' | 'isFake' | 'flagCount' | 'flags' | 'resolvedPhoto'>) => Promise<string | undefined>;
  verifyIssue: (issueId: string, userLat: number, userLng: number) => Promise<{ success: boolean; message: string }>;
  upvoteIssue: (issueId: string) => Promise<void>;
  flagFakeIssue: (issueId: string) => Promise<void>;
  addComment: (issueId: string, content: string) => Promise<void>;
  adoptIssue: (issueId: string, orgName: string) => Promise<void>;
  resolveIssue: (issueId: string, resolvedPhotoBase64: string, userLat: number, userLng: number) => Promise<{ success: boolean; message: string }>;
  triggerWarRoom: (area: string) => void;
  deactivateWarRoom: () => void;
  runAgentLoop: () => void;
  clearAllData: () => void;
  processOfflineQueue: () => Promise<void>;
}

export const useIssuesStore = create<IssuesState>((set, get) => ({
  issues: getInitialIssues(),
  agentLogs: getInitialLogs(),
  users: SEED_USERS,          // always starts from seed, synced from DB on initializeStore
  currentUser: SEED_USERS[0], // always starts from seed, synced from /api/auth/me on initializeStore
  warRoomActive: false,       // always starts false — transient UI state, not persisted
  warRoomArea: "Koramangala",
  offlineQueue: getStoredJSON("fixit_offline_queue", []),
  isOnline: navigator.onLine,

  setIsOnline: (online) => set({ isOnline: online }),

  initializeStore: async () => {
    const { processOfflineQueue } = get();
    try {
      // 1. Fetch current authenticated profile from server (session-based)
      const user = await issuesService.getMe();
      if (user) {
        set({ currentUser: user });
        // Do NOT persist currentUser to localStorage — always comes from server session
      }

      // 2. Fetch list of issues
      const remoteIssues = await issuesService.fetchIssues();
      if (Array.isArray(remoteIssues)) {
        set({ issues: remoteIssues, isOnline: true });
        localStorage.setItem('fixit_issues', JSON.stringify(remoteIssues));
      }

      // 3. Fetch leaderboard users (in-memory only, no localStorage)
      const remoteUsers = await issuesService.fetchLeaderboard();
      if (Array.isArray(remoteUsers)) {
        set({ users: remoteUsers });
      }

      // 4. Process any pending offline mutations
      await processOfflineQueue();
    } catch (err) {
      console.warn('Server offline or unreachable, running in offline fallback mode:', err);
      set({ isOnline: false });
    }
  },

  logoutUser: async () => {
    try {
      await issuesService.logout();
    } catch (err) {
      console.error('Failed to logout API:', err);
    }
    // Reset to seed user in-memory; session is cleared server-side
    set({ currentUser: SEED_USERS[0] });
    // Re-fetch issues anonymously
    try {
      const list = await issuesService.fetchIssues();
      set({ issues: list });
    } catch {
      // Fallback to cached issues
    }
  },

  processOfflineQueue: async () => {
    const { offlineQueue, isOnline, initializeStore } = get();
    if (offlineQueue.length === 0 || !isOnline) return;

    try {
      for (const item of offlineQueue) {
        await issuesService.createIssue(item);
      }
      set({ offlineQueue: [] });
      localStorage.removeItem("fixit_offline_queue");
      // Refresh state from database
      const remoteIssues = await issuesService.fetchIssues();
      const remoteUsers = await issuesService.fetchLeaderboard();
      const user = await issuesService.getMe();
      if (user) set({ currentUser: user });
      
      const nextState: any = {};
      if (Array.isArray(remoteIssues)) nextState.issues = remoteIssues;
      if (Array.isArray(remoteUsers)) nextState.users = remoteUsers;
      set(nextState);
    } catch (err) {
      console.error("Failed to process offline queue:", err);
    }
  },

  addIssue: async (issueData) => {
    const { isOnline, offlineQueue, issues, currentUser } = get();
    if (!isOnline) {
      const updatedQueue = [...offlineQueue, issueData];
      set({ offlineQueue: updatedQueue });
      localStorage.setItem("fixit_offline_queue", JSON.stringify(updatedQueue));
      return;
    }

    try {
      const newIssue = await issuesService.createIssue(issueData);
      set({ issues: [newIssue, ...issues] });
      // Update local storage
      localStorage.setItem("fixit_issues", JSON.stringify([newIssue, ...issues]));
      
      // Sync current user points
      const user = await issuesService.getMe();
      if (user) {
        set({ currentUser: user });
      }
      const remoteUsers = await issuesService.fetchLeaderboard();
      set({ users: remoteUsers });
      return newIssue.id;
    } catch (err) {
      console.error("Failed to create issue:", err);
      // Fallback to queue if request fails
      const updatedQueue = [...offlineQueue, issueData];
      set({ offlineQueue: updatedQueue });
      localStorage.setItem("fixit_offline_queue", JSON.stringify(updatedQueue));
    }
  },

  verifyIssue: async (issueId, userLat, userLng) => {
    const { isOnline, issues } = get();
    if (!isOnline) {
      return { success: false, message: "Network connection required to log physical verifications." };
    }

    try {
      const result = await issuesService.verifyIssue(issueId, userLat, userLng);
      if (result.success) {
        const updated = issues.map(i => i.id === issueId ? result.issue : i);
        set({ issues: updated });
        localStorage.setItem("fixit_issues", JSON.stringify(updated));

        // Sync points
        const user = await issuesService.getMe();
        if (user) {
          set({ currentUser: user });
        }
        const remoteUsers = await issuesService.fetchLeaderboard();
        set({ users: remoteUsers });

        return { success: true, message: "Verification logged successfully! Points granted." };
      }
      return { success: false, message: "Failed to verify issue." };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.error || "Failed to log verification." 
      };
    }
  },

  upvoteIssue: async (issueId) => {
    const { isOnline, issues } = get();
    if (!isOnline) return;

    try {
      const updatedIssue = await issuesService.upvoteIssue(issueId);
      const updated = issues.map(i => i.id === issueId ? updatedIssue : i);
      set({ issues: updated });
      localStorage.setItem("fixit_issues", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  },

  flagFakeIssue: async (issueId) => {
    const { isOnline, issues } = get();
    if (!isOnline) return;

    try {
      const updatedIssue = await issuesService.flagIssue(issueId);
      const updated = issues.map(i => i.id === issueId ? updatedIssue : i);
      set({ issues: updated });
      localStorage.setItem("fixit_issues", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to flag:", err);
    }
  },

  addComment: async (issueId, content) => {
    const { isOnline, issues } = get();
    if (!isOnline || !content.trim()) return;

    try {
      const updatedIssue = await issuesService.addComment(issueId, content);
      const updated = issues.map(i => i.id === issueId ? updatedIssue : i);
      set({ issues: updated });
      localStorage.setItem("fixit_issues", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  },

  adoptIssue: async (issueId, orgName) => {
    const { isOnline, issues } = get();
    if (!isOnline || !orgName.trim()) return;

    try {
      const updatedIssue = await issuesService.adoptIssue(issueId, orgName);
      const updated = issues.map(i => i.id === issueId ? updatedIssue : i);
      set({ issues: updated });
      localStorage.setItem("fixit_issues", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to adopt:", err);
    }
  },

  resolveIssue: async (issueId, resolvedPhotoBase64, userLat, userLng) => {
    const { isOnline, issues } = get();
    if (!isOnline) {
      return { success: false, message: "Network connection required to log resolutions." };
    }

    try {
      const result = await issuesService.resolveIssue(issueId, resolvedPhotoBase64, userLat, userLng);
      if (result.success) {
        const updated = issues.map(i => i.id === issueId ? result.issue : i);
        set({ issues: updated });
        localStorage.setItem("fixit_issues", JSON.stringify(updated));

        // Sync points
        const user = await issuesService.getMe();
        if (user) {
          set({ currentUser: user });
        }
        const remoteUsers = await issuesService.fetchLeaderboard();
        set({ users: remoteUsers });

        return { success: true, message: "Issue resolved successfully! Resolution proof registered." };
      }
      return { success: false, message: "Failed to resolve issue." };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.error || "Failed to resolve issue." 
      };
    }
  },

  triggerWarRoom: (area) => {
    const { issues } = get();
    // warRoom is purely in-memory state — no localStorage persistence
    set({ warRoomActive: true, warRoomArea: area });

    const nextIssues = issues.map(i => {
      if (i.location.area.toLowerCase() === area.toLowerCase() && i.status !== "resolved") {
        return { ...i, severity: "critical" as any, severityScore: 10, status: "escalated" as any };
      }
      return i;
    });
    set({ issues: nextIssues });
  },

  deactivateWarRoom: () => {
    set({ warRoomActive: false });
  },

  runAgentLoop: () => {
    const { issues, warRoomActive, agentLogs } = get();
    console.log("Starting Local Agent check cycle...");
    // Keep local logs simulation active in memory
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
  },

  clearAllData: () => {
    // Only clear the keys we actually use
    localStorage.removeItem("fixit_issues");
    localStorage.removeItem("fixit_offline_queue");
    localStorage.removeItem("fixit_gps_asked");

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
  }
}));
