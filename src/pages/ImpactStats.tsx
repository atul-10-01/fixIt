import React from 'react';
import { Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useIssuesContext } from '../context/IssuesContext';

export function ImpactStats() {
  const { issues } = useIssuesContext();

  const getCategoryMetrics = () => {
    const cats = issues.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(cats).map(key => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: cats[key]
    }));
  };

  const getSeverityMetrics = () => {
    const sevs = issues.reduce((acc: any, curr) => {
      acc[curr.severity] = (acc[curr.severity] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'CRITICAL', value: sevs['critical'] || 0, color: '#ef4444' },
      { name: 'HIGH', value: sevs['high'] || 0, color: '#f97316' },
      { name: 'MEDIUM', value: sevs['medium'] || 0, color: '#eab308' },
      { name: 'LOW', value: sevs['low'] || 0, color: '#10b981' }
    ];
  };

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  return (
    <div className="flex-grow p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div>
        <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">Grievance Audit Matrix</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Impact & Spatial Analytics Dashboard</h2>
      </div>

      {/* Stats Row Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <span className="text-[8.5px] font-black text-zinc-500 uppercase block tracking-wider mb-2">Total Logged Infractions</span>
          <span className="text-4xl font-black font-mono text-white tracking-tight">{issues.length}</span>
          <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block mt-2">// Coordinates live</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <span className="text-[8.5px] font-black text-zinc-500 uppercase block tracking-wider mb-2">Remediated & Closed</span>
          <span className="text-4xl font-black font-mono text-emerald-500 tracking-tight">
            {issues.filter(i => i.status === 'resolved').length}
          </span>
          <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block mt-2">
            // {issues.length > 0 ? Math.round((issues.filter(i => i.status === 'resolved').length / issues.length) * 100) : 0}% Resolve Rate
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <span className="text-[8.5px] font-black text-zinc-500 uppercase block tracking-wider mb-2">Avg Resolution Duration</span>
          <span className="text-4xl font-black font-mono text-white tracking-tight">41.6 hrs</span>
          <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block mt-2">// Geofenced matching certified</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <span className="text-[8.5px] font-black text-zinc-500 uppercase block tracking-wider mb-2">Active Citizens Registered</span>
          <span className="text-4xl font-black font-mono text-white tracking-tight">14,208</span>
          <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block mt-2">// Across 3 city corridors</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Bar/Donut Recharts */}
        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-6">Incidents by Category Breakdown</h3>
          <div className="h-64 flex justify-center items-center">
            {getCategoryMetrics().length === 0 ? (
              <span className="text-xs text-zinc-500 font-mono uppercase">No Category Data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryMetrics()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getCategoryMetrics().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Labels legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[8.5px] font-mono font-bold uppercase">
            {getCategoryMetrics().map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 inline-block rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-zinc-400">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distributions Recharts */}
        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-6">Incidents Severity Matrix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getSeverityMetrics()}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontFamily="var(--font-mono)" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="var(--font-mono)" />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {getSeverityMetrics().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider text-center mt-4">
            * Live database evaluations on active reports
          </div>
        </div>

      </div>

      {/* Predictive Insights Panel & Gamified outputs */}
      <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Sparkles className="text-red-500 w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Predictive Spatial Insights (Google AI Engine)</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">Proactive ward forecasting</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-black border border-zinc-900 p-5 rounded">
            <span className="text-[7.5px] bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded block w-max mb-3">
              92% Flood probability
            </span>
            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">ST Bed Block Corridors</h4>
            <p className="text-[9.5px] font-mono text-zinc-500 uppercase mt-1 leading-normal">
              Rain forecasts cross-referenced with cumulative municipal trash blockages indicate high flood risks in next 72 hours. Clearance dispatched to Solid Waste Dept.
            </p>
          </div>

          <div className="bg-black border border-zinc-900 p-5 rounded">
            <span className="text-[7.5px] bg-amber-600/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded block w-max mb-3">
              78% Cable breach risk
            </span>
            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">Bandra Pali Hill Corridors</h4>
            <p className="text-[9.5px] font-mono text-zinc-500 uppercase mt-1 leading-normal">
              Overlapped fiber excavation logs suggest potential water pipe leakage risk at Bandra. Pre-excavation alignment warning prepared.
            </p>
          </div>

          <div className="bg-black border border-zinc-900 p-5 rounded">
            <span className="text-[7.5px] bg-purple-600/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded block w-max mb-3">
              84% Grid lighting deficit
            </span>
            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">Saket PVR Rear Corridors</h4>
            <p className="text-[9.5px] font-mono text-zinc-500 uppercase mt-1 leading-normal">
              Defunct poles clusters indicate potential local transformer damage patterns. Electrical inspector alert generated.
            </p>
          </div>
        </div>

        {/* Gamified translation counters */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded text-center grid sm:grid-cols-2 gap-4">
          <div className="text-center sm:border-r sm:border-zinc-800">
            <span className="text-[10px] font-black text-zinc-500 uppercase block tracking-wider mb-1">Direct Social Impact Created:</span>
            <p className="text-xl font-mono font-black text-emerald-500 uppercase">
              124 POTHOLES SECURED = 25km SAFER ROADS FOR TWO-WHEELERS
            </p>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase block tracking-wider mb-1">Pedestrian Safety Index:</span>
            <p className="text-xl font-mono font-black text-emerald-500 uppercase">
              42 STREETLIGHTS RESOLVED = 1.2K PEDESTRIAN WALKWAY SECURED NIGHTS
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
