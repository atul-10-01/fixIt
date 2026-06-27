import React, { useState } from 'react';
import { ThumbsUp, AlertTriangle, Share2, Camera, Shield } from 'lucide-react';
import { useIssuesContext } from '../../context/IssuesContext';
import { Issue } from '../../types';
import { getHaversineDistance } from '../../utils/seedData';
import { BeforeAfterSlider } from '../BeforeAfterSlider';
import { ComplaintLetterModal } from '../ComplaintLetterModal';
import { TweetPreviewModal } from '../TweetPreviewModal';

interface IssueDetailPanelProps {
  issue: Issue;
  userLat: number;
  userLng: number;
  onClose: () => void;
}

export function IssueDetailPanel({ issue, userLat, userLng, onClose }: IssueDetailPanelProps) {
  const { addComment, adoptIssue, upvoteIssue, flagFakeIssue, verifyIssue, resolveIssue } = useIssuesContext();
  const [commentText, setCommentText] = useState('');
  const [showLetter, setShowLetter] = useState(false);
  const [showTweet, setShowTweet] = useState(false);
  
  // Simulated file resolver upload
  const [resPhoto, setResPhoto] = useState('');
  const [orgName, setOrgName] = useState('');

  // Calculate geofencing distance check for verification
  const distance = getHaversineDistance(userLat, userLng, issue.location.lat, issue.location.lng);
  const verifyAllowed = distance <= 500;
  const resolutionAllowed = distance <= 50;

  const handleResolvePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setResPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyClick = () => {
    if (!verifyAllowed) {
      alert(`Geofenced Verification Locked: You must be within 500m of this hazard. Currently: ${Math.round(distance)}m away.`);
      return;
    }
    verifyIssue(issue.id, userLat, userLng);
  };

  return (
    <div className="grid md:grid-cols-12 gap-8 items-start animate-fadeIn">
      
      {/* Photo Comparison slider / main image */}
      <div className="md:col-span-6 space-y-4">
        {issue.status === 'resolved' && issue.resolvedPhoto ? (
          <BeforeAfterSlider beforeUrl={issue.images[0]} afterUrl={issue.resolvedPhoto} />
        ) : (
          <div className="aspect-video w-full rounded overflow-hidden bg-zinc-900 border border-zinc-800">
            <img 
              src={issue.images[0]} 
              alt={issue.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Action row verifications, upvote, flag */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Verification */}
          {issue.status !== 'resolved' && (
            <button
              onClick={handleVerifyClick}
              className={`flex-1 flex items-center justify-center gap-2 font-black uppercase text-[10px] py-3 tracking-widest border rounded transition-all ${
                verifyAllowed 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                  : 'bg-zinc-900/10 border-zinc-850 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>Verify ({verifyAllowed ? `you're ${Math.round(distance)}m away ✓` : `locked - you're ${Math.round(distance)}m away`})</span>
            </button>
          )}

          {/* Upvote */}
          <button
            onClick={() => upvoteIssue(issue.id)}
            className="px-4 py-3 border border-zinc-800 hover:border-zinc-500 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-2 text-zinc-300"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Upvote ({issue.upvotes.length})</span>
          </button>

          {/* Layer 3 Flag as Fake */}
          <button
            onClick={() => {
              flagFakeIssue(issue.id);
              alert("Incident flagged. Admin audits will review media integrity.");
            }}
            className="px-4 py-3 border border-zinc-800 hover:border-red-600/40 rounded text-[10px] font-black uppercase tracking-wider text-red-500/70 hover:text-red-500 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flag Fake ({issue.flagCount})</span>
          </button>

          {/* Tweet auto amplificator */}
          {issue.verificationCount >= 3 && (
            <button
              onClick={() => setShowTweet(true)}
              className="flex-grow flex items-center justify-center gap-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-black uppercase text-[10px] py-3 tracking-widest rounded"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share To Amplify</span>
            </button>
          )}

        </div>

        {/* Resolution Camera Capture form coordinates matching constraints */}
        {issue.status !== 'resolved' && (
          <div className="bg-zinc-950 border border-zinc-850 p-5 rounded">
            <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-wider mb-2">Upload Remediation Proof (Requires &lt;50m GPS)</h4>
            
            {resolutionAllowed ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!resPhoto) return;
                  const res = resolveIssue(issue.id, resPhoto, userLat, userLng);
                  alert(res.message);
                  if (res.success) {
                    setResPhoto('');
                  }
                }}
                className="space-y-4"
              >
                <div className="border border-dashed border-zinc-800 hover:border-emerald-600 p-4 text-center rounded relative cursor-pointer bg-black/40">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleResolvePhotoUpload}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Snap Resolution Photo</span>
                </div>
                {resPhoto && (
                  <div className="flex gap-4 items-center">
                    <img src={resPhoto} alt="Resolution" className="w-16 h-12 object-cover rounded" />
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] py-2 px-4 tracking-wider rounded"
                    >
                      Certify Resolution Proof
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <p className="text-[9px] text-zinc-500 font-mono font-bold uppercase leading-relaxed">
                🔒 GPS LOCK: Walk closer to the site (within 50m tolerance) to trigger photo capture validation. Currently: {Math.round(distance)}m away.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Telemetry metadata, pipelines, complaint tools */}
      <div className="md:col-span-6 space-y-6 text-left">
        <div>
          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block mb-0.5">{issue.category.replace('_', ' ')}</span>
          <h2 className="text-xl font-black uppercase text-white leading-tight tracking-tight">{issue.title}</h2>
          <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-wider mt-1">{issue.location.address} · Area: {issue.location.area}</span>
        </div>

        {/* Pipeline horizontal indicator */}
        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded flex justify-between items-center text-[8.5px] font-mono font-bold uppercase tracking-wider text-zinc-500">
          <span className={issue.status === 'reported' ? 'text-red-500' : 'text-zinc-600'}>REPORTED</span>
          <span>➔</span>
          <span className={issue.status === 'verified' ? 'text-red-500' : 'text-zinc-600'}>VERIFIED</span>
          <span>➔</span>
          <span className={issue.status === 'in_progress' ? 'text-red-500' : 'text-zinc-600'}>IN PROGRESS</span>
          <span>➔</span>
          <span className={issue.status === 'resolved' ? 'text-emerald-500' : 'text-zinc-600'}>RESOLVED</span>
        </div>

        {/* Adopt issue widget */}
        {!issue.adoptedBy && issue.status !== 'resolved' && (
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[10px] font-black uppercase text-white tracking-wider mb-0.5">🤝 Adopt This Incident</h4>
              <p className="text-[8.5px] text-zinc-500 font-bold uppercase leading-normal">
                Resident groups or local businesses can adopt the issue, bypass municipal pipelines, and execute coordinates repairs directly.
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="RWA / Business Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-black text-white text-[9.5px] font-bold uppercase border border-zinc-800 px-2 py-1.5 focus:outline-none rounded w-32"
              />
              <button
                onClick={() => {
                  if (!orgName.trim()) return;
                  adoptIssue(issue.id, orgName);
                  setOrgName('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[9px] px-3 py-1.5 tracking-wider rounded"
              >
                Adopt
              </button>
            </div>
          </div>
        )}

        {issue.adoptedBy && (
          <div className="bg-red-950/15 border border-red-900/35 p-4 rounded">
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block">Direct Action Partner</span>
            <span className="text-xs font-black text-white uppercase block mt-1 tracking-wider">🤝 ADOPTED BY: {issue.adoptedBy}</span>
            <p className="text-[8.5px] text-zinc-500 font-mono font-bold uppercase block mt-1 leading-none">Pledged Direct Remediation Bypass</p>
          </div>
        )}

        {/* AI diagnostic report info cards */}
        <div className="bg-zinc-950 border border-zinc-850 p-5 rounded space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
            <h4 className="text-[10px] font-black uppercase text-zinc-300">Gemini AI Audit Properties</h4>
            <button 
              onClick={() => setShowLetter(true)}
              className="text-[9px] font-black text-red-500 uppercase hover:text-white"
            >
              [Generate Municipal Complaint]
            </button>
          </div>

          <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase leading-normal">{issue.aiAnalysis.authenticityReasoning}</p>

          <div className="grid grid-cols-2 gap-4 text-[9px] font-mono font-bold uppercase text-zinc-500 pt-1.5">
            <div>Confidence score: <span className="text-white font-black">{Math.round(issue.aiAnalysis.confidence * 100)}%</span></div>
            <div>Authenticity match: <span className="text-white font-black">{Math.round(issue.aiAnalysis.authenticityScore * 100)}%</span></div>
            <div>Impact Radius: <span className="text-white font-black">{issue.aiAnalysis.estimatedImpactRadius}m</span></div>
            <div>Suggested Authority: <span className="text-white font-black leading-none">{issue.aiAnalysis.suggestedAuthority}</span></div>
          </div>
        </div>

        {/* Comments Feed Thread */}
        <div className="space-y-3.5">
          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Citizen Feedback Thread</h4>
          
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {issue.comments && issue.comments.map(c => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-900 p-3 rounded flex gap-2.5 items-start">
                <img src={c.userAvatar} alt={c.userName} className="w-5 h-5 rounded-full" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black text-white">{c.userName}</span>
                    <span className="text-[8px] text-zinc-600">{new Date(c.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 font-bold uppercase mt-1 leading-normal">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <input 
              type="text" 
              placeholder="Add feedback / updates..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-grow bg-zinc-950 border border-zinc-850 p-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-red-600 rounded"
            />
            <button 
              onClick={() => {
                if (!commentText.trim()) return;
                addComment(issue.id, commentText);
                setCommentText('');
              }}
              className="bg-zinc-900 border border-zinc-700 text-white font-black uppercase text-[10px] px-4 rounded transition-colors"
            >
              Post
            </button>
          </div>
        </div>

        {/* Vertical Timeline logs of actions */}
        <div className="space-y-3 border-t border-zinc-900 pt-5">
          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Chronicle Timeline Logs</h4>
          <div className="space-y-3 font-mono text-[9px] uppercase font-bold text-zinc-500">
            {issue.agentHistory && issue.agentHistory.map((h, idx) => (
              <div key={idx} className="flex gap-3 items-start border-l border-zinc-850 pl-3 relative">
                <span className="absolute -left-1 top-1 w-1.5 h-1.5 bg-red-600 rounded-full" />
                <span className="text-zinc-600 shrink-0">{new Date(h.timestamp).toLocaleDateString()}</span>
                <div>
                  <span className="text-zinc-300 font-black">[{h.action}]</span>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">{h.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {showLetter && (
        <ComplaintLetterModal issue={issue} onClose={() => setShowLetter(false)} />
      )}

      {showTweet && (
        <TweetPreviewModal issue={issue} onClose={() => setShowTweet(false)} />
      )}

    </div>
  );
}
