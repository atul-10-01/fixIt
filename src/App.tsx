/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useIssuesStore } from './store/useIssuesStore';
import { HeaderNavbar } from './components/features/HeaderNavbar';
import { LegalAidWidget } from './components/LegalAidWidget';
import { LandingPage } from './pages/LandingPage';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { useGeolocation } from './hooks/useGeolocation';

const MapExplorer = lazy(() => import('./pages/MapExplorer').then((module) => ({ default: module.MapExplorer })));
const IncidentStream = lazy(() => import('./pages/IncidentStream').then((module) => ({ default: module.IncidentStream })));
const ReportHazard = lazy(() => import('./pages/ReportHazard').then((module) => ({ default: module.ReportHazard })));
const ImpactStats = lazy(() => import('./pages/ImpactStats').then((module) => ({ default: module.ImpactStats })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then((module) => ({ default: module.LeaderboardPage })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then((module) => ({ default: module.UserProfilePage })));

function RouteFallback() {
  return (
    <div className="flex-grow flex items-center justify-center p-8">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
        Loading FixIt module...
      </span>
    </div>
  );
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function AppLayout() {
  const issues = useIssuesStore((state) => state.issues);
  const warRoomActive = useIssuesStore((state) => state.warRoomActive);
  const setIsOnline = useIssuesStore((state) => state.setIsOnline);
  const processOfflineQueue = useIssuesStore((state) => state.processOfflineQueue);
  const initializeStore = useIssuesStore((state) => state.initializeStore);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Real GPS via hook
  const { lat: userLat, lng: userLng, status: gpsStatus, requestPermission, setFallbackCity } = useGeolocation();

  // Override location when user clicks into a specific issue (dev testing UX)
  const [devOverrideLat, setDevOverrideLat] = useState<number | null>(null);
  const [devOverrideLng, setDevOverrideLng] = useState<number | null>(null);

  const effectiveLat = devOverrideLat ?? userLat;
  const effectiveLng = devOverrideLng ?? userLng;

  // Initial load and sync on mount
  useEffect(() => {
    console.log('[FixIt CI/CD] Pipeline test - deployed via GitHub Actions 🚀');
    initializeStore();
  }, [initializeStore]);

  // Show location modal on first load (only if permission not yet asked)
  useEffect(() => {
    const alreadyAsked = localStorage.getItem('fixit_gps_asked');
    if (!alreadyAsked) {
      setShowLocationModal(true);
    }
  }, []);

  const handleAllowLocation = () => {
    localStorage.setItem('fixit_gps_asked', 'true');
    setShowLocationModal(false);
    requestPermission();
  };

  const handleDeclineLocation = (cityKey: string) => {
    localStorage.setItem('fixit_gps_asked', 'true');
    setShowLocationModal(false);
    setFallbackCity(cityKey);
  };

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
    
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, processOfflineQueue]);

  // Place user near selected issue for proximity testing in dev
  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue && gpsStatus !== 'granted') {
        setDevOverrideLat(issue.location.lat + 0.0005);
        setDevOverrideLng(issue.location.lng - 0.0005);
      } else {
        setDevOverrideLat(null);
        setDevOverrideLng(null);
      }
    }
  }, [selectedIssueId, issues, gpsStatus]);

  return (
    <div className={`min-h-screen flex flex-col ${warRoomActive ? 'border-4 border-red-600/60' : ''} bg-zinc-950 text-white`}>
      <Toaster theme="dark" position="bottom-right" richColors />
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={handleAllowLocation}
          onDecline={handleDeclineLocation}
        />
      )}
      <HeaderNavbar gpsStatus={gpsStatus} />
      <main className="flex-grow flex flex-col">
        <Outlet context={{ userLat: effectiveLat, userLng: effectiveLng, setUserLat: setDevOverrideLat, setUserLng: setDevOverrideLng, selectedIssueId, setSelectedIssueId, gpsStatus, requestPermission }} />
      </main>
      <LegalAidWidget />
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-[10px] uppercase font-mono font-bold tracking-widest">
          <div>
            <span>© 2026 FIXIT NETWORK. YOUR FRIENDLY NEIGHBORHOOD HERO.</span>
          </div>
          
          <div className="max-w-md text-center md:text-right leading-relaxed normal-case font-sans font-normal font-bold">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">Legal Disclaimer Notice</span>
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
          <Route path="map" element={<LazyRoute><MapExplorer /></LazyRoute>} />
          <Route path="incidents" element={<LazyRoute><IncidentStream /></LazyRoute>} />
          <Route path="report" element={<LazyRoute><ReportHazard /></LazyRoute>} />
          <Route path="stats" element={<LazyRoute><ImpactStats /></LazyRoute>} />
          <Route path="leaderboard" element={<LazyRoute><LeaderboardPage /></LazyRoute>} />
          <Route path="admin" element={<LazyRoute><AdminPanel /></LazyRoute>} />
          <Route path="profile" element={<LazyRoute><UserProfilePage /></LazyRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
