import React, { useState } from 'react';
import { MapPin, Shield, Navigation } from 'lucide-react';
import { CITY_FALLBACKS } from '../hooks/useGeolocation';

interface LocationPermissionModalProps {
  onAllow: () => void;
  onDecline: (cityKey: string) => void;
}

export function LocationPermissionModal({ onAllow, onDecline }: LocationPermissionModalProps) {
  const [selectedCity, setSelectedCity] = useState('bengaluru');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/40 to-zinc-950 p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] block">Location Access</span>
              <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none">
                GPS Required
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 font-bold uppercase leading-relaxed">
            FixIt uses your real GPS coordinates to enable{' '}
            <span className="text-white">geofenced proximity verification</span> — ensuring only
            on-site citizens can validate civic hazards within 500m tolerance.
          </p>
        </div>

        {/* Privacy note */}
        <div className="px-6 py-4 border-b border-zinc-900/60 flex items-start gap-3">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
            Your coordinates are <span className="text-emerald-400">never stored on our servers</span>.
            They are only used client-side for distance calculations. We do not track your movement.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-4">
          <button
            onClick={onAllow}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-widest py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            Allow Location Access
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-950 px-3 text-[9px] text-zinc-600 uppercase font-black tracking-widest">
                Or select your area
              </span>
            </div>
          </div>

          {/* City fallback selector */}
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
              Select your closest city to continue without GPS:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CITY_FALLBACKS).map(([key, city]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCity(key)}
                  className={`text-[9px] font-black uppercase tracking-wider px-3 py-2 border rounded transition-all text-left ${
                    selectedCity === key
                      ? 'border-red-500 bg-red-950/20 text-red-400'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  <MapPin className="w-2.5 h-2.5 inline-block mr-1" />
                  {city.label.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => onDecline(selectedCity)}
              className="w-full border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-widest py-2.5 rounded-lg transition-colors mt-1"
            >
              Continue with {CITY_FALLBACKS[selectedCity]?.label.split(' ')[0]} Coordinates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
