import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useIssuesContext } from '../../context/IssuesContext';

export function HeaderNavbar() {
  const { warRoomActive, offlineQueue, currentUser } = useIssuesContext();

  return (
    <>
      <header className="bg-zinc-950 border-b border-zinc-850 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 bg-red-600 flex items-center justify-center font-black text-black tracking-tighter text-lg rounded">
            FI
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 block leading-none mb-1">
              {warRoomActive ? 'EMERGENCY SHIELD ACTIVE' : 'ACTIVE COMMUNITY PROTOCOL'}
            </span>
            <div className="text-xl font-black tracking-tighter uppercase leading-none text-white">
              FixIt<span className="text-red-500">.</span>
            </div>
          </div>
        </Link>

        {/* Global Navigation links */}
        <nav className="flex flex-wrap items-center gap-1 sm:gap-4 md:gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <NavLink 
            to="/"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /01. Home
          </NavLink>
          <NavLink 
            to="/map"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /02. Grid Map
          </NavLink>
          <NavLink 
            to="/incidents"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /03. Incidents
          </NavLink>
          <NavLink 
            to="/report"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /04. Report Hazard
          </NavLink>
          <NavLink 
            to="/stats"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /05. Impact Stats
          </NavLink>
          <NavLink 
            to="/leaderboard"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white' : 'border-transparent'}`
            }
          >
            /06. Leaderboard
          </NavLink>
          <NavLink 
            to="/admin"
            className={({ isActive }) => 
              `pb-1 border-b-2 hover:text-white transition-all ${isActive ? 'border-red-600 text-white animate-pulse' : 'border-transparent'}`
            }
          >
            /07. Agent Core
          </NavLink>
        </nav>

        {/* User badge points bar */}
        <div className="flex items-center gap-3">
          {offlineQueue.length > 0 && (
            <div className="bg-red-600/15 border border-red-500 text-red-500 text-[9px] font-black px-2 py-1 uppercase tracking-wider rounded animate-pulse">
              Queued Offline: {offlineQueue.length}
            </div>
          )}

          <Link 
            to="/profile"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 border border-zinc-800 rounded cursor-pointer transition-colors"
          >
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.displayName} 
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full border border-red-500" 
            />
            <div className="text-left leading-none">
              <span className="text-[9px] text-zinc-400 font-black uppercase block tracking-wider">{currentUser.displayName.split(' ')[0]}</span>
              <span className="text-[10px] text-white font-mono font-black">{currentUser.points} PTS <span className="text-red-500">[{currentUser.level.toUpperCase()}]</span></span>
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
