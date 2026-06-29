import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Shield, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIssuesStore } from '../store/useIssuesStore';
import { getHaversineDistance } from '../utils/seedData';
import { IssueDetailPanel } from '../components/features/IssueDetailPanel';

const getThumbnailUrl = (url: string) => {
  if (!url.includes('images.unsplash.com')) return url;

  const imageUrl = new URL(url);
  imageUrl.searchParams.set('w', '360');
  imageUrl.searchParams.set('q', '70');
  imageUrl.searchParams.set('auto', 'format');
  imageUrl.searchParams.set('fit', 'crop');
  return imageUrl.toString();
};

export function LandingPage() {
  const { t } = useTranslation();
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

  // "Near You" Feed issues
  const localFeedIssues = issues.filter(issue => {
    const dist = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
    return dist <= 2000; // 2km radius
  }).slice(0, 5);

  const activeIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="flex-grow flex flex-col">
      {/* Split Hero */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-12 items-center flex-grow">
        
        {/* Left Side Bold Headlines */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-2 block">
            {t('landing.subtitle')}
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-[75px] font-black tracking-tighter uppercase leading-[0.9] mb-6 text-white">
            {t('landing.title')}
          </h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-16 bg-red-600"></div>
            <p className="text-base sm:text-lg font-medium text-zinc-400 italic font-display">
              Your Friendly Neighborhood Hero
            </p>
          </div>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mb-8 uppercase font-bold leading-relaxed">
            {t('landing.description')}
          </p>
 
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/report"
              className="bg-white text-black font-black uppercase text-xs py-4 px-8 tracking-widest hover:bg-red-600 hover:text-white transition-colors duration-200 rounded shadow-lg text-center"
            >
              {t('landing.btn_report')}
            </Link>
            <Link 
              to="/map"
              className="border border-zinc-700 font-black uppercase text-xs py-4 px-8 hover:border-white text-white tracking-widest transition-colors duration-200 rounded text-center"
            >
              {t('landing.btn_map')}
            </Link>
          </div>
        </div>

        {/* Right Side Mission Blueprint */}
        <div className="md:col-span-5">
          <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg flex flex-col h-full shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-900">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Mission Blueprint</h2>
              <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 font-black uppercase tracking-wider rounded">PHASE 01</span>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="text-xl font-black text-red-600 font-mono">/01</div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">Capture Diagnostics</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 leading-normal">
                    Snap photo. On-board Gemini evaluates authenticity, categories, severity metrics, and suggested municipal agency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="text-xl font-black text-red-600 font-mono">/02</div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">Geofenced Peer Validation</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 leading-normal">
                    Neighborhood citizens physically walk near the hazard coordinate (&lt;500m) to confirm validation, blocking bots.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="text-xl font-black text-red-600 font-mono">/03</div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">Autonomous Escalation Sweep</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 leading-normal">
                    AI Sweeper scans outstanding delayed reports, tagging repeat Chronic Zones, formulating legal complaint notices, and triggering Twitter pressure.
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated volunteer stat counters */}
            <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 mt-8 pt-6">
              <div>
                <span className="text-[8px] text-zinc-400 font-black uppercase block tracking-wider mb-1">Volunteers</span>
                <span className="text-lg font-black font-mono text-white">14,208</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-400 font-black uppercase block tracking-wider mb-1">Resolved</span>
                <span className="text-lg font-black font-mono text-emerald-500">921</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-400 font-black uppercase block tracking-wider mb-1">Avg Response</span>
                <span className="text-lg font-black font-mono text-red-500 italic">4.2m</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Real-time Live Activity Feed */}
      <div className="bg-zinc-950 border-t border-zinc-900 py-10 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <Radio className="text-red-500 w-4 h-4 animate-ping" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Live Hyperlocal Feed (2km Radius)</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase">Updates real-time via local ledger</span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {localFeedIssues.map((issue) => (
              <button
                type="button"
                key={issue.id}
                aria-label={`Inspect incident: ${issue.title} in ${issue.location.area}, ${issue.location.city}`}
                onClick={() => {
                  setSelectedIssueId(issue.id);
                  setTimeout(() => {
                    const el = document.getElementById('issue-detail-scroller');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="bg-black border border-zinc-850 hover:border-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 p-4 rounded cursor-pointer transition-colors flex flex-col gap-3 group text-left"
              >
                <div className="relative aspect-square rounded overflow-hidden">
                  <img 
                    src={getThumbnailUrl(issue.images[0])}
                    alt={issue.title} 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  {issue.anonymous && (
                    <div className="absolute top-2 left-2 bg-black/80 px-1.5 py-0.5 rounded flex items-center gap-1 border border-zinc-800">
                      <Shield className="w-2.5 h-2.5 text-zinc-300" aria-hidden="true" />
                      <span className="text-[7px] text-zinc-300 font-black uppercase">Anon</span>
                    </div>
                  )}
                  <span className={`absolute bottom-2 right-2 text-[7.5px] font-black uppercase px-2 py-0.5 rounded text-black ${
                    issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'high' ? 'bg-orange-500' : issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1">{issue.title}</h4>
                  <span className="text-[8.5px] font-mono text-zinc-400 uppercase mt-1 block">{issue.location.area} · {issue.location.city}</span>
                  <div className="flex justify-between items-center border-t border-zinc-900 mt-2 pt-2">
                    <span className="text-[8px] font-black text-zinc-300 uppercase">Status</span>
                    <span className="text-[8.5px] font-black font-mono text-red-500 uppercase">{issue.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* In-Line Selected Issue details container if any is active */}
      {activeIssue && (
        <div id="issue-detail-scroller" className="bg-black border-t border-zinc-900 py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Incident Inspection Core</span>
              <button
                type="button"
                onClick={() => setSelectedIssueId(null)}
                aria-label="Close incident inspection"
                className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-white"
              >
                [Close Inspection]
              </button>
            </div>
            <IssueDetailPanel 
              issue={activeIssue} 
              userLat={userLat}
              userLng={userLng}
              onClose={() => setSelectedIssueId(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
