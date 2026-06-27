/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useIssuesStore } from './store/useIssuesStore';
import { HeaderNavbar } from './components/features/HeaderNavbar';
import { LegalAidWidget } from './components/LegalAidWidget';
import { LandingPage } from './pages/LandingPage';
import { MapExplorer } from './pages/MapExplorer';
import { IncidentStream } from './pages/IncidentStream';
import { ReportHazard } from './pages/ReportHazard';
import { ImpactStats } from './pages/ImpactStats';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPanel } from './pages/AdminPanel';
import { UserProfilePage } from './pages/UserProfilePage';

function AppLayout() {
  const issues = useIssuesStore((state) => state.issues);
  const warRoomActive = useIssuesStore((state) => state.warRoomActive);
  const setIsOnline = useIssuesStore((state) => state.setIsOnline);
  const processOfflineQueue = useIssuesStore((state) => state.processOfflineQueue);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Simulated GPS for coordinates validations
  const [userLat, setUserLat] = useState<number>(12.9345);
  const [userLng, setUserLng] = useState<number>(77.6265);

  // Sync network status and process offline queue on mount
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, processOfflineQueue]);

  // Set user's simulated GPS position depending on selected city quadrant
  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue) {
        // Position user near the issue so they can test geofenced verification/resolution instantly!
        setUserLat(issue.location.lat + 0.0005);
        setUserLng(issue.location.lng - 0.0005);
      }
    }
  }, [selectedIssueId, issues]);

  return (
    <div className={`min-h-screen flex flex-col ${warRoomActive ? 'border-4 border-red-600/60' : ''} bg-zinc-950 text-white`}>
      <HeaderNavbar />
      <main className="flex-grow flex flex-col">
        <Outlet context={{ userLat, userLng, setUserLat, setUserLng, selectedIssueId, setSelectedIssueId }} />
      </main>
      <LegalAidWidget />
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-600 text-[10px] uppercase font-mono font-bold tracking-widest">
          <div>
            <span>© 2026 FIXIT NETWORK. YOUR FRIENDLY NEIGHBORHOOD HERO.</span>
          </div>
          
          <div className="max-w-md text-center md:text-right leading-relaxed normal-case font-sans font-normal font-bold">
            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest block mb-1">Legal Disclaimer Notice</span>
            FixIt is a decentralized community reporting platform and is not an emergency service. For immediate life-threatening situations, call 112. FixIt is not liable for municipal response delay.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="map" element={<MapExplorer />} />
          <Route path="incidents" element={<IncidentStream />} />
          <Route path="report" element={<ReportHazard />} />
          <Route path="stats" element={<ImpactStats />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
