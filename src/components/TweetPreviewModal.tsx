import React, { useState } from 'react';
import { Issue } from '../types';
import { X, Send, Check, Twitter } from 'lucide-react';

interface TweetPreviewModalProps {
  issue: Issue;
  onClose: () => void;
}

export const TweetPreviewModal: React.FC<TweetPreviewModalProps> = ({ issue, onClose }) => {
  const [tweeted, setTweeted] = useState(false);

  const getMunicipalHandle = (city: string) => {
    switch (city) {
      case 'Bengaluru': return '@BBMPCOMM';
      case 'Mumbai': return '@mybmc';
      case 'Delhi': return '@Official_SDMC';
      default: return '@MunicipalCorp';
    }
  };

  const handle = getMunicipalHandle(issue.location.city);
  const mapLink = `https://fixit.org/map?issue=${issue.id}`;
  const tweetText = `🚨 REPORTED: ${issue.title} at ${issue.location.area}, ${issue.location.city} | Severity: [${issue.severity.toUpperCase()}] | Verified by ${issue.verificationCount} citizens | 📍 ${mapLink} | ${handle} #FixIt #${issue.location.city}Problems — Help us pressure authorities 👇`;

  const handlePostTweet = () => {
    setTweeted(true);
    setTimeout(() => {
      setTweeted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f1419] border border-zinc-800 w-full max-w-lg rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-[#15181c]">
          <div className="flex items-center gap-2">
            <Twitter className="text-[#1d9bf0] w-5 h-5 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Twitter/X Auto-Amplifier</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto max-h-[calc(100vh-100px)] no-scrollbar">
          <div className="bg-zinc-900/40 border border-zinc-850 p-3 sm:p-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-1">Social Pressure Pipeline</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
              When issues cross 5+ verifications, FixIt enables citizens to bypass traditional communication blackholes by broadcasting coordinates directly to civic officials over Twitter.
            </p>
          </div>

          {/* Twitter Card simulation */}
          <div className="bg-[#15181c] border border-zinc-800 p-3 sm:p-5 rounded-xl flex gap-2.5 sm:gap-3.5">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center font-black text-white text-xs select-none shrink-0">
              FI
            </div>

            {/* Post details */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black text-white">FixIt India Collective</span>
                  <span className="text-[10px] text-zinc-500">@FixItIndia</span>
                  <span className="text-[10px] text-zinc-500">· Now</span>
                </div>
                <span className="text-[7.5px] bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded shrink-0">
                  Demo Simulation Block
                </span>
              </div>

              {/* Text */}
              <p className="text-[11px] text-zinc-300 mt-2 font-mono leading-relaxed select-all break-words">
                {tweetText}
              </p>

              {/* Link preview card mockup */}
              <div className="mt-3.5 border border-zinc-800 rounded-xl overflow-hidden bg-black flex flex-col">
                <img 
                  src={issue.images[0]} 
                  alt="Issue preview" 
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover border-b border-zinc-800"
                />
                <div className="p-2.5 sm:p-3">
                  <div className="text-[9.5px] text-zinc-500 font-mono tracking-tight uppercase">FIXIT.ORG</div>
                  <div className="text-[10.5px] font-black text-white uppercase mt-0.5 tracking-tight">{issue.title}</div>
                  <div className="text-[9.5px] text-zinc-400 mt-1 uppercase font-bold leading-normal truncate">{issue.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="text-center text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900/10 py-2 border border-zinc-900">
            * Official handle @FixItIndia API will trigger broadcast on production.
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {tweeted ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-500 font-black uppercase text-xs py-3.5 tracking-widest text-center rounded flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Amplification Post Dispatched!</span>
              </div>
            ) : (
              <button 
                onClick={handlePostTweet}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-black uppercase text-[10px] tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-2 w-full transition-all"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Amplify on Twitter / X</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
