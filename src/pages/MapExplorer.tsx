import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useIssuesStore } from '../store/useIssuesStore';
import { MapCanvas } from '../components/MapCanvas';
import { IssueDetailPanel } from '../components/features/IssueDetailPanel';

export function MapExplorer() {
  const issues = useIssuesStore((state) => state.issues);
  const { 
    userLat, 
    userLng, 
    selectedIssueId, 
    setSelectedIssueId 
  } = useOutletContext<{
    userLat: number;
    userLng: number;
    selectedIssueId: string | null;
    setSelectedIssueId: (id: string | null) => void;
  }>();

  // Scroll to details drawer on selection
  React.useEffect(() => {
    if (selectedIssueId) {
      const timer = setTimeout(() => {
        const el = document.getElementById('issue-detail-scroller');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedIssueId]);

  // Local filter states for the map view
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = issues.filter(issue => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q) ||
        issue.location.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">Hyperlocal Physical Layer</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Hyperlocal Grid Coordinate Radar</h2>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-zinc-500 font-black uppercase block tracking-widest">Active Incident Indicators</span>
          <span className="text-xl font-mono font-black text-white">{issues.filter(i => i.location.city === 'Bengaluru').length} Bangalore Quadrants</span>
        </div>
      </div>

      {/* Simple Search on Map page */}
      <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-lg flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="Search coordinates..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-black border border-zinc-800 text-xs px-3 py-2 rounded focus:outline-none uppercase font-bold text-white flex-grow"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-black text-zinc-400 text-xs font-bold uppercase border border-zinc-800 px-3 py-2 rounded focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="pothole">Potholes</option>
          <option value="water_leakage">Water Leakage</option>
          <option value="streetlight">Streetlights</option>
          <option value="garbage">Garbage</option>
          <option value="flooding">Flooding</option>
          <option value="encroachment">Encroachments</option>
          <option value="road_damage">Road Damage</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-black text-zinc-400 text-xs font-bold uppercase border border-zinc-850 px-3 py-2 rounded focus:outline-none"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Canvas */}
        <div className="lg:col-span-8">
          <MapCanvas 
            selectedIssueId={selectedIssueId || undefined} 
            onSelectIssue={(id) => setSelectedIssueId(id)}
            userLat={userLat}
            userLng={userLng}
          />
        </div>

        {/* Side Floating details feed */}
        <div className="lg:col-span-4 flex flex-col gap-4 max-h-[550px] overflow-y-auto border border-zinc-800 p-4 rounded-lg bg-zinc-950">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 pb-3 border-b border-zinc-900">
            Filtered Pins Stream ({filteredIssues.length})
          </h3>

          {filteredIssues.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 font-mono text-[10px] uppercase">
              No active coordinates found for filter set.
            </div>
          ) : (
            <div className="space-y-3 flex-grow overflow-y-auto">
              {filteredIssues.map(issue => (
                <div 
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`p-3.5 border transition-all rounded cursor-pointer ${
                    selectedIssueId === issue.id ? 'bg-zinc-900 border-red-600' : 'bg-black/40 border-zinc-855 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[10px] font-black uppercase text-white leading-snug line-clamp-1">{issue.title}</h4>
                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      issue.status === 'resolved' ? 'bg-emerald-500 text-black' : issue.status === 'escalated' ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">{issue.location.address}</p>
                  <div className="flex items-center justify-between border-t border-zinc-900 mt-2 pt-2 text-[8px] font-bold uppercase text-zinc-400">
                    <span>Severity: <span className="text-red-500 font-black">{issue.severityScore}/10</span></span>
                    <span>Verifiers: {issue.verificationCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* In-Line Selected Issue details container if active inside Map */}
      {activeIssue && (
        <div id="issue-detail-scroller" className="bg-black border border-zinc-850 p-6 rounded-lg mt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Incident Details Core</span>
            <button onClick={() => setSelectedIssueId(null)} className="text-[9px] font-black uppercase tracking-wider text-red-500">
              [Close]
            </button>
          </div>
          <IssueDetailPanel 
            issue={activeIssue} 
            userLat={userLat}
            userLng={userLng}
            onClose={() => setSelectedIssueId(null)} 
          />
        </div>
      )}
    </div>
  );
}
