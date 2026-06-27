import React from 'react';
import { Flame } from 'lucide-react';
import { useIssuesContext } from '../context/IssuesContext';

export function LeaderboardPage() {
  const { users, currentUser } = useIssuesContext();

  const rankedUsers = [...users].sort((a, b) => b.points - a.points);

  return (
    <div className="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div>
        <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">Community Standings</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Citizen Hero Rankings</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-normal">
          Citizens accumulate points by filing clean diagnostics (+10), verifying physical hazards (+5), and executing resolutions (+25).
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-stretch">
        {/* Rankings List */}
        <div className="md:col-span-7 bg-zinc-950 border border-zinc-850 p-6 rounded-lg flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider pb-3 border-b border-zinc-900">
            Leaderboard Standing (All Time)
          </h3>

          <div className="space-y-3">
            {rankedUsers.map((usr, idx) => {
              const isSelf = usr.uid === currentUser.uid;
              return (
                <div 
                  key={usr.uid}
                  className={`p-3.5 border rounded flex items-center justify-between transition-colors ${
                    isSelf ? 'bg-zinc-900 border-red-600 shadow-md' : 'bg-black/40 border-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black font-mono w-5 ${
                      idx === 0 ? 'text-red-500' : idx === 1 ? 'text-amber-500' : idx === 2 ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>
                      #{idx + 1}
                    </span>
                    <img 
                      src={usr.photoURL} 
                      alt={usr.displayName} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-zinc-800" 
                    />
                    <div>
                      <span className="text-[11px] font-black text-white uppercase tracking-tight block">
                        {usr.displayName} {isSelf && <span className="text-red-500 text-[9px] font-black lowercase">[YOU]</span>}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{usr.level} · {usr.area}</span>
                    </div>
                  </div>

                  <div className="text-right leading-none">
                    <span className="text-xs font-black text-white font-mono block">{usr.points} PTS</span>
                    <span className="text-[7.5px] text-zinc-500 font-mono block uppercase tracking-wider mt-1">
                      {usr.stats.reportsSubmitted} Reports / {usr.stats.reportsVerified} Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone badges and profile status */}
        <div className="md:col-span-5 bg-zinc-950 border border-zinc-850 p-6 rounded-lg flex flex-col gap-6">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider pb-3 border-b border-zinc-900">
            Your Badges & Achievements
          </h3>

          {/* Badges grids */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "First Report", label: "First Report", desc: "Submitted initial incident validation record", unlocked: currentUser.badges.includes("First Report") },
              { id: "On Fire", label: "On Fire", desc: "Submitted 5+ reports in a single week block", unlocked: currentUser.badges.includes("On Fire") },
              { id: "Sharpshooter", label: "Sharpshooter", desc: "Had 10+ reports successfully validated by peers", unlocked: currentUser.badges.includes("Sharpshooter") },
              { id: "Community Pillar", label: "Community Pillar", desc: "Verified 50+ third-party reports", unlocked: currentUser.badges.includes("Community Pillar") },
              { id: "Pioneer", label: "Pioneer", desc: "First to report within a new quadrant corridor", unlocked: currentUser.badges.includes("Pioneer") },
              { id: "Quick Responder", label: "Quick Responder", desc: "Report successfully resolved in under 24hrs", unlocked: currentUser.badges.includes("Quick Responder") }
            ].map(badge => (
              <div 
                key={badge.id}
                className={`p-3.5 border rounded flex flex-col gap-1 text-left relative ${
                  badge.unlocked ? 'bg-zinc-900/40 border-red-900/30' : 'bg-black/10 border-zinc-900 opacity-40'
                }`}
              >
                {badge.unlocked && (
                  <span className="absolute top-2 right-2 text-red-500">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                  </span>
                )}
                <h4 className="text-[10px] font-black uppercase text-white leading-tight">{badge.label}</h4>
                <p className="text-[8.5px] text-zinc-500 font-bold uppercase leading-normal mt-1">{badge.desc}</p>
              </div>
            ))}
          </div>

          {/* Level list explanation */}
          <div className="border-t border-zinc-900 pt-4">
            <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3">Levels & Milestone Hierarchy:</h4>
            <div className="space-y-1.5 text-[8.5px] font-mono font-bold uppercase text-zinc-400">
              <div className="flex justify-between"><span>🌱 NEWCOMER</span><span>0 - 50 PTS</span></div>
              <div className="flex justify-between"><span>👀 OBSERVER</span><span>51 - 150 PTS</span></div>
              <div className="flex justify-between"><span>📢 REPORTER</span><span>151 - 350 PTS</span></div>
              <div className="flex justify-between"><span>🔍 INVESTIGATOR</span><span>351 - 700 PTS</span></div>
              <div className="flex justify-between"><span>🛡️ GUARDIAN</span><span>701 - 1200 PTS</span></div>
              <div className="flex justify-between text-red-500"><span>⭐ CIVIC HERO</span><span>1200+ PTS</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
