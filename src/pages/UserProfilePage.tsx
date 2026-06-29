import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useIssuesStore } from '../store/useIssuesStore';
import api from '../services/api';
import { toast } from 'sonner';

export function UserProfilePage() {
  const currentUser = useIssuesStore((state) => state.currentUser);
  const logoutUser = useIssuesStore((state) => state.logoutUser);
  const issues = useIssuesStore((state) => state.issues);
  const navigate = useNavigate();
  const { setSelectedIssueId } = useOutletContext<{
    setSelectedIssueId: (id: string | null) => void;
  }>();

  const [isWakingUp, setIsWakingUp] = useState(false);

  const userIssues = issues.filter(i => i.reportedBy === currentUser.uid);

  const handleGoogleSignIn = async () => {
    setIsWakingUp(true);
    const toastId = toast.loading("Connecting to authorization servers... (May take 10-15 seconds if server is sleeping)", {
      duration: Infinity,
    });
    try {
      // Ping backend health endpoint to ensure it's awake before browser redirect
      await api.get('/api/health');
      toast.success("Authorization servers ready! Redirecting...", { id: toastId });
      // Direct window location to Google OAuth endpoint
      window.location.href = `${api.defaults.baseURL || ''}/api/auth/google?origin=${window.location.origin}`;
    } catch (err) {
      console.error("Failed to connect to backend server:", err);
      toast.error("Could not establish connection to the server. Please try again.", { id: toastId });
      setIsWakingUp(false);
    }
  };

  return (
    <div className="flex-grow p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Account controls */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-lg flex justify-between items-center gap-4 flex-wrap">
        <div>
          <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">Account Access Security</span>
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight mt-0.5">
            {currentUser.uid === "user_priya_s" ? "Currently browsing under simulated default citizen profile." : "Logged in via Google Secure Server Authorization."}
          </p>
        </div>
        <div>
          {currentUser.uid === "user_priya_s" ? (
            <button 
              onClick={handleGoogleSignIn}
              disabled={isWakingUp}
              className={`bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-black uppercase text-[9.5px] py-2.5 px-4 tracking-widest rounded transition-colors text-center flex items-center justify-center gap-2 ${
                isWakingUp ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isWakingUp ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Waking servers...
                </>
              ) : (
                'Sign In with Google'
              )}
            </button>
          ) : (
            <button 
              onClick={async () => {
                await logoutUser();
                navigate('/');
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[9.5px] py-2.5 px-4 tracking-widest rounded transition-colors text-center"
            >
              Sign Out / Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg flex flex-col md:flex-row gap-6 items-center">
        <img 
          src={currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
          alt={currentUser?.displayName || "Citizen"} 
          referrerPolicy="no-referrer"
          className="w-24 h-24 rounded-full border-2 border-red-500 object-cover shadow-xl" 
        />
        <div className="text-center md:text-left flex-grow">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">{(currentUser?.level || "Newcomer")} Advocate</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{currentUser?.displayName || "Citizen"}</h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase block tracking-wider mt-1">{currentUser?.email || ""} · Corridor: {currentUser?.area || ""}</span>
          
          <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Helpfulness</span>
              <span className="text-lg font-mono font-black text-emerald-500">{currentUser?.stats?.helpfulnessScore || 0}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Reports filed</span>
              <span className="text-lg font-mono font-black text-white">{currentUser?.stats?.reportsSubmitted || 0}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Verifications</span>
              <span className="text-lg font-mono font-black text-white">{currentUser?.stats?.reportsVerified || 0}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Resolved</span>
              <span className="text-lg font-mono font-black text-emerald-500">{currentUser?.stats?.issuesResolved || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User self-filed reports stream */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Your Diagnostic Submissions Feed</h3>
        
        {userIssues.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 font-mono text-[10px] uppercase">
            You have not submitted any reports yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {userIssues.map(issue => (
              <div 
                key={issue.id}
                onClick={() => {
                  setSelectedIssueId(issue.id);
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('issue-detail-scroller');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="bg-zinc-950 border border-zinc-850 hover:border-zinc-700 p-4 rounded-lg flex gap-4 cursor-pointer transition-colors"
              >
                <img 
                  src={issue.images[0]} 
                  alt={issue.title} 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded shrink-0 border border-zinc-900" 
                />
                <div className="flex-grow min-w-0">
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block mb-0.5">{issue.category.replace('_', ' ')}</span>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1">{issue.title}</h4>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase block tracking-wider mt-1">{issue.location.address}</p>
                  <div className="flex items-center justify-between border-t border-zinc-900 mt-2 pt-2 text-[8px] font-bold uppercase">
                    <span className="text-zinc-500">STATUS</span>
                    <span className="text-red-500 font-black font-mono">{issue.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
