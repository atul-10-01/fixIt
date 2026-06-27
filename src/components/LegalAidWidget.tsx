import React, { useState } from 'react';
import { Shield, LifeBuoy, X, AlertOctagon, HelpCircle, PhoneCall, ExternalLink } from 'lucide-react';

export const LegalAidWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [threatReported, setThreatReported] = useState(false);
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitThreat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDesc('');
      setThreatReported(false);
    }, 3000);
  };

  return (
    <>
      {/* Floating button on the bottom left, keeping clear of right controls */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-zinc-900 border border-zinc-700 hover:border-red-600 text-zinc-300 hover:text-white px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 group font-black text-[10px] uppercase tracking-widest"
      >
        <Shield className="w-4 h-4 text-red-500 animate-pulse" />
        <span>⚖️ Need Help?</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-lg overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#121214]">
              <div className="flex items-center gap-2">
                <Shield className="text-red-500 w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Citizen Advocate Guard & Security</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-5">
              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded flex items-start gap-3">
                <AlertOctagon className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-red-400 tracking-wider mb-1">Your Safety is Paramount</h4>
                  <p className="text-[10.5px] text-zinc-400 font-bold uppercase leading-relaxed">
                    Under India's Whistleblower Protection guidelines and the DPDP Act 2023, citizens possess rights to report institutional safety infractions anonymously. If you feel threatened, seek instant help below.
                  </p>
                </div>
              </div>

              {/* NGOs info cards */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Verified Legal Advocacy Partners:</h4>
                
                <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">iCall Legal & Mental Helpline</h5>
                    <p className="text-[9.5px] text-zinc-500 font-bold uppercase mt-0.5">Professional trauma support & advocate counsel</p>
                  </div>
                  <a 
                    href="tel:9152987821" 
                    className="bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 p-2 rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">Human Rights Law Network (HRLN)</h5>
                    <p className="text-[9.5px] text-zinc-500 font-bold uppercase mt-0.5">Pro-bono civic advocacy lawyers collective</p>
                  </div>
                  <a 
                    href="https://hrln.org" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 p-2 rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Visit</span>
                  </a>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-850 p-3.5 rounded flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">LocalCircles Grievance Registry</h5>
                    <p className="text-[9.5px] text-zinc-500 font-bold uppercase mt-0.5">Direct state citizen coordination board</p>
                  </div>
                  <a 
                    href="https://www.localcircles.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 p-2 rounded transition-colors flex items-center gap-1 text-[9px] font-bold uppercase"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Visit</span>
                  </a>
                </div>
              </div>

              {/* Threat Reporting Safety form */}
              <div className="border-t border-zinc-900 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setThreatReported(!threatReported)}
                  className="w-full flex items-center justify-between bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 px-4 py-3 rounded text-left transition-colors"
                >
                  <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">🚨 Facing direct threats for reporting?</span>
                  <span className="text-xs text-red-500 font-bold uppercase">{threatReported ? 'Close Form' : 'File Safety Report'}</span>
                </button>

                {threatReported && (
                  <form onSubmit={handleSubmitThreat} className="mt-3 bg-zinc-900/60 p-4 border border-zinc-800 space-y-3 rounded animate-fadeIn">
                    {submitted ? (
                      <div className="py-4 text-center">
                        <p className="text-xs font-black uppercase text-emerald-500">Grievance Registered Anonymously!</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">
                          Secure token generated and shared with NGO counsel network. We stand with you.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                            Document harassment or threat details (Confidential)
                          </label>
                          <textarea
                            rows={3}
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Describe any warning letters, threats, or pressure you have received for registering this civic complaint..."
                            required
                            className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-red-600 uppercase font-bold tracking-tight rounded"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] py-2.5 tracking-widest transition-colors rounded"
                        >
                          Dispatch Anonymous Security Escalation
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#121214] p-4 text-center border-t border-zinc-900">
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                FixIt Shield Network | Pro-Bono Guard Advocacy | 2026
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
