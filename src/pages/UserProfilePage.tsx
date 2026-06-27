import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useIssuesStore } from '../store/useIssuesStore';

export function UserProfilePage() {
  const currentUser = useIssuesStore((state) => state.currentUser);
  const issues = useIssuesStore((state) => state.issues);
  const navigate = useNavigate();
  const { setSelectedIssueId } = useOutletContext<{
    setSelectedIssueId: (id: string | null) => void;
  }>();

  const userIssues = issues.filter(i => i.reportedBy === currentUser.uid);

  return (
    <div className="flex-grow p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
      <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg flex flex-col md:flex-row gap-6 items-center">
        <img 
          src={currentUser.photoURL} 
          alt={currentUser.displayName} 
          referrerPolicy="no-referrer"
          className="w-24 h-24 rounded-full border-2 border-red-500 object-cover shadow-xl" 
        />
        <div className="text-center md:text-left flex-grow">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">{currentUser.level} Advocate</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{currentUser.displayName}</h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase block tracking-wider mt-1">{currentUser.email} · Corridor: {currentUser.area}</span>
          
          <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Helpfulness</span>
              <span className="text-lg font-mono font-black text-emerald-500">{currentUser.stats.helpfulnessScore}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Reports filed</span>
              <span className="text-lg font-mono font-black text-white">{currentUser.stats.reportsSubmitted}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Verifications</span>
              <span className="text-lg font-mono font-black text-white">{currentUser.stats.reportsVerified}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-850 px-4 py-2 rounded text-center">
              <span className="text-[8px] font-black text-zinc-500 block uppercase">Resolved</span>
              <span className="text-lg font-mono font-black text-emerald-500">{currentUser.stats.issuesResolved}</span>
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
