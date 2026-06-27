import React, { useState } from 'react';
import { Eye, ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeUrl, afterUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center bg-black/40 border border-zinc-800/80 px-3 py-1.5 rounded">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Remediation Proof Verification Slider</span>
        <div className="flex gap-4 text-[9px] font-mono font-bold uppercase tracking-wider">
          <span className="text-red-500">BEFORE (REPORTED)</span>
          <span className="text-emerald-500">AFTER (RESOLVED)</span>
        </div>
      </div>

      <div className="relative w-full aspect-video rounded overflow-hidden border border-zinc-800 select-none">
        {/* AFTER image (Full back layer) */}
        <img 
          src={afterUrl} 
          alt="Resolved After" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* BEFORE image (Clip-path front layer) */}
        <div 
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          className="absolute inset-0 w-full h-full"
        >
          <img 
            src={beforeUrl} 
            alt="Reported Before" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover filter brightness-90"
          />
        </div>

        {/* Custom divider bar line */}
        <div 
          style={{ left: `${sliderPosition}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none z-10"
        />

        {/* Slider drag badge indicator handles */}
        <div 
          style={{ left: `${sliderPosition}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 bg-black border-2 border-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg pointer-events-none"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Interactive range input overlaid on top */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderPosition} 
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />
      </div>

      <div className="text-[9.5px] text-zinc-500 uppercase font-bold text-center italic tracking-wide mt-1">
        Drag the divider slider left-and-right to inspect structural remediation
      </div>
    </div>
  );
};
