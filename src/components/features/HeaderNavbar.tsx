import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIssuesStore } from '../../store/useIssuesStore';
import { GeolocationStatus } from '../../hooks/useGeolocation';

interface HeaderNavbarProps {
  gpsStatus?: GeolocationStatus;
}

export function HeaderNavbar({ gpsStatus = 'idle' }: HeaderNavbarProps) {
  const { t, i18n } = useTranslation();
  const warRoomActive = useIssuesStore((state) => state.warRoomActive);
  const offlineQueue = useIssuesStore((state) => state.offlineQueue);
  const currentUser = useIssuesStore((state) => state.currentUser);

  return (
    <>
      <header className="bg-zinc-950 border-b border-zinc-850 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-3 cursor-pointer order-1 flex-shrink-0">
          <div className="w-9 h-9 bg-red-600 flex items-center justify-center font-black text-black tracking-tighter text-lg rounded-full">
            FI
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 block leading-none mb-1">
              {warRoomActive ? 'EMERGENCY SHIELD ACTIVE' : 'ACTIVE COMMUNITY PROTOCOL'}
            </span>
            <div className="text-xl font-black tracking-tighter uppercase leading-none text-white">
              {t('nav.title')}<span className="text-red-500">.</span>
            </div>
          </div>
        </Link>

        {/* Global Navigation links */}
        <nav className="flex items-center gap-4 md:gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 overflow-x-auto whitespace-nowrap no-scrollbar w-full md:w-auto py-2 md:py-0 border-t border-zinc-900 md:border-t-0 order-3 md:order-2">
          <NavLink 
            to="/"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /01. {t('nav.home')}
          </NavLink>
          <NavLink 
            to="/map"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /02. {t('nav.map')}
          </NavLink>
          <NavLink 
            to="/incidents"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /03. {t('nav.feed')}
          </NavLink>
          <NavLink 
            to="/report"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /04. {t('nav.report')}
          </NavLink>
          <NavLink 
            to="/stats"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /05. {t('nav.stats')}
          </NavLink>
          <NavLink 
            to="/leaderboard"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /06. {t('nav.leaderboard')}
          </NavLink>
          <NavLink 
            to="/admin"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white animate-pulse' : 'border-transparent'}`
            }
          >
            /07. {t('nav.admin')}
          </NavLink>
        </nav>

        {/* User badge points bar */}
        <div className="flex items-center gap-3 order-2 md:order-3 flex-shrink-0">
          <select 
            value={i18n.language} 
            onChange={(e) => {
              const lang = e.target.value;
              i18n.changeLanguage(lang);
              localStorage.setItem('fixit_lang', lang);
            }}
            className="bg-black text-zinc-400 text-[9px] uppercase font-black border border-zinc-800 px-2 py-1.5 focus:outline-none focus:border-red-600 rounded cursor-pointer transition-colors"
          >
            <option value="en">EN</option>
            <option value="kn">KN</option>
            <option value="hi">HI</option>
          </select>

          {/* GPS Status badge */}
          {gpsStatus !== 'idle' && (
            <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
              gpsStatus === 'granted'
                ? 'bg-emerald-950/20 border-emerald-800 text-emerald-500'
                : gpsStatus === 'pending'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400 animate-pulse'
                : 'bg-red-950/20 border-red-800/40 text-red-500'
            }`}>
              {gpsStatus === 'granted' ? '🟢 GPS Live' : gpsStatus === 'pending' ? '📡 Locating...' : '🔴 GPS Off'}
            </div>
          )}

          {offlineQueue.length > 0 && (
            <div className="bg-red-600/15 border border-red-500 text-red-500 text-[9px] font-black px-2 py-1 uppercase tracking-wider rounded animate-pulse">
              {t('nav.offline_queue')}: {offlineQueue.length}
            </div>
          )}

          <Link 
            to="/profile"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 border border-zinc-800 rounded cursor-pointer transition-colors"
          >
            <img 
              src={currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt={currentUser?.displayName || "Citizen"} 
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full border border-red-500" 
            />
            <div className="text-left leading-none">
              <span className="text-[9px] text-zinc-400 font-black uppercase block tracking-wider">{(currentUser?.displayName || "Citizen").split(' ')[0]}</span>
              <span className="text-[10px] text-white font-mono font-black">{currentUser?.points || 0} PTS <span className="text-red-500">[{(currentUser?.level || "Newcomer").toUpperCase()}]</span></span>
            </div>
          </Link>
        </div>
      </header>

      {/* EMERGENCY WAR ROOM BANNER */}
      {warRoomActive && (
        <div className="bg-red-600 text-white py-2.5 px-6 font-black uppercase text-xs tracking-widest text-center flex items-center justify-center gap-3 animate-pulse">
          <span>⚠️ EMERGENCY WAR ROOM ACTIVE — HIGH CRITICAL FLUX ZONE. ALL RESOLUTION DELAYS MINIMIZED.</span>
        </div>
      )}
    </>
  );
}
