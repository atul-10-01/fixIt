import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { useIssuesStore } from '../store/useIssuesStore';

export function AdminPanel() {
  const agentLogs = useIssuesStore((state) => state.agentLogs);
  const warRoomActive = useIssuesStore((state) => state.warRoomActive);
  const warRoomArea = useIssuesStore((state) => state.warRoomArea);
  const triggerWarRoom = useIssuesStore((state) => state.triggerWarRoom);
  const deactivateWarRoom = useIssuesStore((state) => state.deactivateWarRoom);
  const runAgentLoop = useIssuesStore((state) => state.runAgentLoop);
  const clearAllData = useIssuesStore((state) => state.clearAllData);

  return (
    <div className="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">Autonomous Coordination Engine</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">AI Sweep & Dispatch Terminal</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-normal">
            Agent triggers every hour on production container schedules, auto-merging duplicates, escalating overdue high infractions, and tagging chronic corridors.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={runAgentLoop}
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-3 px-6 tracking-widest transition-colors rounded flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Run Agent Sweep Loop</span>
          </button>
          <button 
            onClick={clearAllData}
            className="border border-zinc-700 hover:border-red-600 hover:text-white text-zinc-400 font-black uppercase text-xs py-3 px-6 tracking-widest transition-all rounded"
          >
            Reset Demo DB
          </button>
        </div>
      </div>

      {/* War Room Manual Trigger Console */}
      <div className="bg-red-950/10 border border-red-900/30 p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="text-red-500 w-5 h-5 animate-bounce" />
          <h3 className="text-xs font-black uppercase text-red-500 tracking-widest">Grievance War Room manual trigger block</h3>
        </div>
        <p className="text-[10.5px] text-zinc-400 font-bold uppercase leading-normal max-w-2xl">
          War Room mode triggers immediately when 10+ storm/flood notifications accumulate in 6 hours. When active, all local cases are automatically escalated to CRITICAL priority on a shortened 2-hour agent countdown.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <select 
            id="warRoomSelector"
            className="bg-black text-white text-xs font-bold uppercase border border-zinc-800 px-3 py-2 rounded focus:outline-none"
          >
            <option value="Koramangala">Bengaluru (Koramangala 4th Block)</option>
            <option value="Bandra West">Mumbai (Bandra West)</option>
            <option value="Saket">Delhi (Saket)</option>
          </select>

          {warRoomActive ? (
            <button 
              onClick={deactivateWarRoom}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs py-2.5 px-5 tracking-widest rounded transition-colors"
            >
              Deactivate War Room (Active in {warRoomArea})
            </button>
          ) : (
            <button 
              onClick={() => {
                const sel = (document.getElementById('warRoomSelector') as HTMLSelectElement)?.value || "Koramangala";
                triggerWarRoom(sel);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-2.5 px-5 tracking-widest rounded transition-colors"
            >
              Trigger Emergency War Room (Demo)
            </button>
          )}
        </div>
      </div>

      {/* Live Logs streaming terminal */}
      <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">
            Live Agent Autonomous Logs Stream ({agentLogs.length})
          </h3>
          <span className="text-[8.5px] font-mono text-emerald-500 animate-pulse font-bold uppercase">
            ● AGENT LISTENING FOR LEDGER INFRACTIONS
          </span>
        </div>

        <div className="font-mono text-[10px] space-y-3 max-h-[350px] overflow-y-auto leading-relaxed uppercase font-bold text-zinc-400">
          {agentLogs.length === 0 ? (
            <div className="py-8 text-center text-zinc-600">// Logs stream empty</div>
          ) : (
            agentLogs.map(log => (
              <div key={log.id} className="border-b border-zinc-900/40 pb-2.5 flex items-start gap-4">
                <span className="text-red-500 font-black shrink-0">[🤖 AGENT]</span>
                <span className="text-zinc-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <div>
                  <span className="text-zinc-500 font-bold">[{log.action.toUpperCase()}]</span>
                  <p className="text-zinc-300 mt-0.5 leading-normal">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Agent Rule Switch Toggles */}
      <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest pb-3 border-b border-zinc-900 mb-4">
          Active Sweeper Rules Toggles
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-[10px] font-bold uppercase text-zinc-400">
          <div className="bg-black/40 border border-zinc-900 p-4 rounded flex items-center justify-between">
            <div>
              <span className="text-white block font-black">Rule 1: Auto-Escalation</span>
              <span className="text-[8.5px] text-zinc-600 font-bold block mt-0.5">Escalate high issues after 48h</span>
            </div>
            <span className="text-emerald-500 font-black font-mono">ACTIVE</span>
          </div>

          <div className="bg-black/40 border border-zinc-900 p-4 rounded flex items-center justify-between">
            <div>
              <span className="text-white block font-black">Rule 2: Duplicate Merge</span>
              <span className="text-[8.5px] text-zinc-600 font-bold block mt-0.5">Merge reports within 100m</span>
            </div>
            <span className="text-emerald-500 font-black font-mono">ACTIVE</span>
          </div>

          <div className="bg-black/40 border border-zinc-900 p-4 rounded flex items-center justify-between">
            <div>
              <span className="text-white block font-black">Rule 3: Chronic Zone Sweep</span>
              <span className="text-[8.5px] text-zinc-600 font-bold block mt-0.5">3+ reports raises severity</span>
            </div>
            <span className="text-emerald-500 font-black font-mono">ACTIVE</span>
          </div>
        </div>
      </div>

    </div>
  );
}
