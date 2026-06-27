import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useIssuesStore } from '../store/useIssuesStore';
import { IssueDetailPanel } from '../components/features/IssueDetailPanel';

export function IncidentStream() {
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

  // Local filter states
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

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'low': return '#10b981';
      case 'medium': return '#eab308';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">Civic Ledger Archives</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Active Grievance Stream</h2>
        </div>
        
        <Link 
          to="/report"
          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-2.5 px-5 tracking-widest transition-colors rounded text-center"
        >
          Log New Incident
        </Link>
      </div>

      {/* Search Input Bar */}
      <div className="bg-zinc-950 border border-zinc-905 p-3.5 rounded-lg">
        <input 
          type="text" 
          placeholder="Filter logs by title, street, keyword..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-black border border-zinc-800 text-xs px-3.5 py-2.5 rounded focus:outline-none uppercase font-bold text-white w-full"
        />
      </div>

      {/* Feed Cards layout */}
      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Filter left sidebar */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-lg space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pb-3 border-b border-zinc-900">
              Audit Filters
            </h3>

            <div>
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-2">Category Select</label>
              <div className="flex flex-col gap-1 text-[9.5px] uppercase font-bold text-zinc-400">
                {['all', 'pothole', 'water_leakage', 'streetlight', 'garbage', 'flooding', 'encroachment', 'road_damage'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`text-left py-1 hover:text-white transition-colors ${filterCategory === cat ? 'text-red-500 font-black' : ''}`}
                  >
                    // {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-2">Severity Level</label>
              <div className="flex flex-col gap-1 text-[9.5px] uppercase font-bold text-zinc-400">
                {['all', 'low', 'medium', 'high', 'critical'].map(sev => (
                  <button 
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`text-left py-1 hover:text-white transition-colors ${filterSeverity === sev ? 'text-red-500 font-black' : ''}`}
                  >
                    // {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Central grid of cards */}
        <div className="md:col-span-9 space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-zinc-800 rounded-lg">
              <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-4 animate-bounce" />
              <p className="text-xs font-black uppercase text-zinc-400 tracking-wider">No Incidents Found Matching Filters</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Clear filters or file a fresh safety complaint.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredIssues.map(issue => {
                const markerColor = getSeverityColor(issue.severity);
                return (
                  <div 
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`bg-zinc-950 border transition-all p-5 rounded-lg flex flex-col gap-4 cursor-pointer relative ${
                      selectedIssueId === issue.id ? 'border-red-600 bg-zinc-900/40' : 'border-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    {issue.isChronic && (
                      <span className="absolute top-4 right-4 z-10 text-[7px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                        Chronic Zone
                      </span>
                    )}

                    <div className="aspect-video w-full bg-zinc-900 rounded overflow-hidden relative">
                      <img 
                        src={issue.images[0]} 
                        alt={issue.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Visual pulse glow on card */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/85 border border-zinc-800 px-2 py-1 rounded">
                        <span 
                          style={{ backgroundColor: markerColor }}
                          className="w-1.5 h-1.5 rounded-full inline-block animate-ping"
                        />
                        <span className="text-[8px] font-black text-white uppercase tracking-wider">{issue.severity}</span>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                        {issue.category.replace('_', ' ')}
                      </span>
                      <h3 className="text-xs font-black uppercase text-white leading-snug tracking-tight line-clamp-1">{issue.title}</h3>
                      <p className="text-[10.5px] font-mono text-zinc-400 mt-1 line-clamp-2 uppercase font-bold leading-normal">{issue.description}</p>
                    </div>

                    <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-[8px] font-mono font-bold text-zinc-500 uppercase">
                      <span>GPS Address: {issue.location.area}</span>
                      <span>VERIFICATIONS: <span className="text-white font-black">{issue.verificationCount}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Selected detail drawer under list if selected */}
      {activeIssue && (
        <div className="bg-black border border-zinc-850 p-6 rounded-lg mt-8">
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
