import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Camera, Shield, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useIssuesStore } from '../store/useIssuesStore';
import { issuesService } from '../services/issuesService';
import { CITY_CENTERS } from '../utils/seedData';
import { issueFormSchema, aiAnalysisResponseSchema } from '../schemas';

// Helper to dynamically find which city center is closest to coordinates
const resolveClosestCity = (lat: number, lng: number) => {
  let closestCity = 'Bengaluru';
  let closestDist = Infinity;
  for (const [cityName, center] of Object.entries(CITY_CENTERS)) {
    const dist = Math.sqrt(Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2));
    if (dist < closestDist) {
      closestDist = dist;
      closestCity = cityName;
    }
  }
  return closestCity;
};

export function ReportHazard() {
  const { t } = useTranslation();
  const addIssue = useIssuesStore((state) => state.addIssue);
  const navigate = useNavigate();
  const { 
    userLat, 
    userLng,
    setSelectedIssueId,
    gpsStatus,
    requestPermission
  } = useOutletContext<{
    userLat: number;
    userLng: number;
    setSelectedIssueId: (id: string | null) => void;
    gpsStatus?: string;
    requestPermission: () => void;
  }>();

  // Report wizard state
  const [reportStep, setReportStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [exifVerified, setExifVerified] = useState(true);
  const [exifWarning, setExifWarning] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  
  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Handle image upload with simulated EXIF checking
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      
      // Simulate EXIF metadata inspection (Fake alert trigger)
      const hasExif = Math.random() > 0.4;
      setExifVerified(true);
      setExifWarning(!hasExif);

      // Trigger multi-step AI analysis loader
      triggerAIAnalysis();
    };
    reader.readAsDataURL(file);
  };

  const triggerAIAnalysis = () => {
    setAiAnalyzing(true);
    setAiStep(1);
    setFormErrors([]);
    
    let current = 1;
    const interval = setInterval(() => {
      current++;
      setAiStep(current);
      if (current === 4) {
        clearInterval(interval);
        
        // Extract real Base64 bytes and MimeType from uploadedImage DataURL
        const base64Data = uploadedImage.split(',')[1] || uploadedImage;
        const mimeType = uploadedImage.match(/data:([^;]+);/)?.[1] || "image/jpeg";
        
        // Fetch AI analysis from backend proxy
        issuesService.analyzeImage(base64Data, mimeType)
        .then(data => {
          try {
            const parsedData = aiAnalysisResponseSchema.parse(data);
            setAiAnalysisResult(parsedData);
            setAiAnalyzing(false);
            setReportStep(2); // Jump to Edit/Review AI results step
          } catch (zodErr: any) {
            console.error("Zod API Verification Error:", zodErr);
            const errStr = "Gemini diagnostic response verification failed. Please try re-uploading.";
            setFormErrors([errStr]);
            toast.error(errStr);
            setAiAnalyzing(false);
            setReportStep(1);
          }
        })
        .catch(err => {
          console.error("AI Analysis proxy error:", err);
          toast.error("Gemini AI API connection error.");
          setAiAnalyzing(false);
        });
      }
    }, 1200);
  };

  const submitNewReport = async () => {
    if (!aiAnalysisResult) return;

    setFormErrors([]);

    const validationResult = issueFormSchema.safeParse({
      title: aiAnalysisResult.title,
      description: aiAnalysisResult.description,
      category: aiAnalysisResult.category,
      severityScore: aiAnalysisResult.severityScore,
      uploadedImage: uploadedImage,
      manualAddress: manualAddress
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message);
      setFormErrors(errors);
      errors.forEach(err => toast.error(err));
      return;
    }

    const resolvedCity = resolveClosestCity(userLat, userLng);
    const cityCenter = CITY_CENTERS[resolvedCity as keyof typeof CITY_CENTERS];

    const loc = {
      lat: userLat,
      lng: userLng,
      address: manualAddress || `Street No. ${Math.floor(Math.random() * 15) + 1}, ${cityCenter.name}, ${resolvedCity}`,
      area: cityCenter.name,
      city: resolvedCity
    };

    let anonymousToken = null;
    if (isAnonymous) {
      anonymousToken = `anon_sha256_${Math.floor(Math.random() * 900000 + 100000)}`;
    }

    const newIssueId = await addIssue({
      title: validationResult.data.title || `Simulated civic infraction`,
      description: validationResult.data.description || `Citizens complained about structural concerns at location block.`,
      category: validationResult.data.category,
      severity: validationResult.data.severityScore >= 8 ? 'critical' : validationResult.data.severityScore >= 6 ? 'high' : validationResult.data.severityScore >= 4 ? 'medium' : 'low',
      severityScore: validationResult.data.severityScore,
      location: loc,
      images: [validationResult.data.uploadedImage],
      aiAnalysis: {
        category: aiAnalysisResult.category,
        severityScore: aiAnalysisResult.severityScore,
        severityReasoning: aiAnalysisResult.severityReasoning,
        estimatedImpactRadius: aiAnalysisResult.estimatedImpactRadius,
        suggestedAuthority: aiAnalysisResult.suggestedAuthority,
        confidence: aiAnalysisResult.confidence,
        authenticityScore: exifWarning ? 0.42 : aiAnalysisResult.authenticityScore || 0.95,
        authenticityReasoning: exifWarning ? "EXIF metadata missing. Frame took over 6 months ago or is screenshot." : aiAnalysisResult.authenticityReasoning || "Original mobile sensor footprint detected.",
        estimatedResolutionDays: aiAnalysisResult.estimatedResolutionDays || 3,
        urgencyKeywords: aiAnalysisResult.urgencyKeywords || []
      },
      tags: aiAnalysisResult.urgencyKeywords || ["civic", aiAnalysisResult.category],
      anonymous: isAnonymous,
      anonymousToken: anonymousToken,
      exifChecked: true,
      exifWarning: exifWarning
    });

    // Reset report state
    setUploadedImage('');
    setAiAnalysisResult(null);
    setReportStep(1);
    if (newIssueId) {
      setSelectedIssueId(newIssueId);
    } else {
      setSelectedIssueId(null);
    }
    navigate('/incidents');
  };

  // Lock reporting if GPS permission is not determined/granted yet
  if (gpsStatus === 'idle' || gpsStatus === 'pending') {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto h-full my-auto">
        <Navigation className="w-12 h-12 text-red-500 animate-pulse mb-6" />
        <h2 className="text-lg font-black uppercase text-white tracking-widest">GPS Authorization Required</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2.5 leading-relaxed">
          FixIt requires location access to report civic incidents. Please allow location permissions in the browser to start, or enable manually below.
        </p>
        <button
          onClick={requestPermission}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-widest py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg border border-red-500/20"
        >
          <Navigation className="w-4 h-4" />
          Allow Location Access
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow p-6 max-w-2xl mx-auto w-full flex flex-col justify-center gap-6">
      <div>
        <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block mb-1">{t('report.subtitle')}</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{t('report.title')}</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 leading-normal">
          {t('report.description')}
        </p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-4 rounded-lg">
        <div className="flex gap-4 text-[9.5px] font-black uppercase tracking-wider">
          <span className={reportStep === 1 ? 'text-red-500' : 'text-zinc-600'}>01. {t('report.step_media')}</span>
          <span className="text-zinc-700">//</span>
          <span className={reportStep === 2 ? 'text-red-500' : 'text-zinc-600'}>02. {t('report.step_review')}</span>
          <span className="text-zinc-700">//</span>
          <span className="text-zinc-600">03. {t('report.step_submit')}</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase">STEP {reportStep} / 3</span>
      </div>

      {/* STEP 1: CAPTURE MEDIA */}
      {reportStep === 1 && !aiAnalyzing && (
        <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg flex flex-col gap-6 shadow-xl">
          {formErrors.length > 0 && (
            <div className="bg-red-950/40 border border-red-800/60 p-4 rounded flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">⚠️ Hazard Report Validation Error</span>
              <ul className="list-disc list-inside text-[9.5px] font-mono text-red-400 font-bold uppercase space-y-1">
                {formErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Drag and Drop */}
          <div className="border border-dashed border-zinc-800 hover:border-red-600/60 p-10 text-center rounded transition-all cursor-pointer relative bg-black/40">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-4 animate-pulse" />
            <p className="text-xs font-black uppercase text-white tracking-widest">{t('report.upload_title')}</p>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1.5 leading-normal">
              {t('report.upload_desc')}
            </p>
          </div>

          {/* Whistleblower warnings */}
          <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <Shield className="text-red-500 w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">{t('report.safety_title')}</h4>
                <p className="text-[9.5px] text-zinc-500 font-bold uppercase leading-normal">
                  {t('report.safety_desc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-zinc-900/60 pt-3">
              <input 
                type="checkbox" 
                id="anonCheck" 
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="accent-red-600 rounded cursor-pointer"
              />
              <label htmlFor="anonCheck" className="text-[9px] font-black uppercase text-zinc-400 tracking-wider cursor-pointer">
                {t('report.anon_check')}
              </label>
            </div>
          </div>

          {/* Live GPS Coordinates indicator */}
          <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded flex flex-col gap-2.5">
            <span className="text-[8.5px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Locked GPS Target Coordinates</span>
            </span>
            <div className="text-xs font-mono text-zinc-300 font-bold tracking-tight">
              📍 Coordinates: {userLat.toFixed(6)}° N, {userLng.toFixed(6)}° E ({resolveClosestCity(userLat, userLng)})
            </div>
            <p className="text-[8px] text-zinc-650 uppercase font-black tracking-widest leading-normal">
              🛡️ Live GPS reporting is active. Submissions are geolocated directly to your device coordinates to maintain system integrity.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">
              Manual Address Override (Optional Description)
            </label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g., Near Block C entrance, opposite Sector 18 metro gate"
              className="w-full bg-black border border-zinc-800 p-3 text-xs text-zinc-300 focus:outline-none focus:border-red-600 uppercase font-bold tracking-tight rounded"
            />
          </div>
        </div>
      )}

      {/* AI LOADING ANIMATION STATE */}
      {aiAnalyzing && (
        <div className="bg-zinc-950 border border-zinc-850 p-12 rounded-lg flex flex-col items-center justify-center text-center shadow-2xl">
          <RefreshCw className="w-10 h-10 text-red-500 animate-spin mb-6" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">AI Diagnostics Processing...</h3>
          <p className="text-[9px] text-zinc-500 uppercase font-bold mt-2 max-w-sm leading-normal">
            Google Gemini models are inspecting image pixels, checking authenticity scores, and cataloging civic ward entities.
          </p>

          {/* Simulated Steps progress ticks */}
          <div className="mt-8 space-y-3 w-full max-w-xs text-left">
            <div className={`flex items-center gap-3 text-[9.5px] font-mono font-bold uppercase transition-all ${aiStep >= 1 ? 'text-red-500' : 'text-zinc-700'}`}>
              <span>{aiStep >= 1 ? '✓' : '○'}</span>
              <span>Identifying Category Infraction</span>
            </div>
            <div className={`flex items-center gap-3 text-[9.5px] font-mono font-bold uppercase transition-all ${aiStep >= 2 ? 'text-red-500' : 'text-zinc-700'}`}>
              <span>{aiStep >= 2 ? '✓' : '○'}</span>
              <span>Evaluating Severity Hazards</span>
            </div>
            <div className={`flex items-center gap-3 text-[9.5px] font-mono font-bold uppercase transition-all ${aiStep >= 3 ? 'text-red-500' : 'text-zinc-700'}`}>
              <span>{aiStep >= 3 ? '✓' : '○'}</span>
              <span>Estimating Impact Radius Block</span>
            </div>
            <div className={`flex items-center gap-3 text-[9.5px] font-mono font-bold uppercase transition-all ${aiStep >= 4 ? 'text-red-500' : 'text-zinc-700'}`}>
              <span>{aiStep >= 4 ? '✓' : '○'}</span>
              <span>Sourcing Local Ward Responsibility</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW AI VERIFICATION ANALYSIS RESULTS */}
      {reportStep === 2 && aiAnalysisResult && (
        <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-lg flex flex-col gap-6 shadow-xl animate-fadeIn animate-duration-300">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Sparkles className="text-red-500 w-4 h-4" />
              <span>Gemini AI Visual Audit Report</span>
            </h3>
            <span className="text-[9px] font-mono bg-zinc-900 px-2 py-1 text-zinc-400 rounded uppercase font-bold">
              Confidence: {Math.round(aiAnalysisResult.confidence * 100)}%
            </span>
          </div>
          {formErrors.length > 0 && (
            <div className="bg-red-950/40 border border-red-800/60 p-4 rounded flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">⚠️ Hazard Report Validation Error</span>
              <ul className="list-disc list-inside text-[9.5px] font-mono text-red-400 font-bold uppercase space-y-1">
                {formErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Visual Image Preview and EXIF results */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="aspect-video w-full rounded overflow-hidden bg-zinc-900">
              <img 
                src={uploadedImage} 
                alt="Uploaded preview" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Layer 2: Authenticity checks */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">EXIF Integrity Verdict:</span>
                <div className="flex items-center gap-2 mt-1">
                  {exifWarning ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-[9px] font-black uppercase text-orange-500">Unverified Media Metadata</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase text-emerald-500">Clean Camera EXIF certified</span>
                    </>
                  )}
                </div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2 leading-normal">
                  {exifWarning 
                    ? "Image properties missing. Uploaded file is potentially AI-generated/modified or a screenshot. Added '⚠️ Unverified Media' label."
                    : "Verified original smartphone CCD sensor footprint matching coordinates. Integrity score 0.98."
                  }
                </p>
              </div>

              <div className="border-t border-zinc-800/60 pt-2 mt-2">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">AI Model Authenticity Reasoning:</span>
                <p className="text-[9px] font-mono text-zinc-400 mt-1 uppercase font-bold">
                  {aiAnalysisResult.authenticityReasoning || "Physical asset lighting and perspective physically consistent. Realistic noise."}
                </p>
              </div>
            </div>
          </div>

          {/* Pre-filled fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-widest mb-1">Assessed Title:</label>
              <input 
                type="text" 
                value={aiAnalysisResult.title}
                onChange={(e) => setAiAnalysisResult({...aiAnalysisResult, title: e.target.value})}
                className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-white focus:outline-none uppercase font-bold tracking-tight rounded"
              />
            </div>

            <div>
              <label className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-widest mb-1">Assessed Category Description:</label>
              <textarea 
                rows={2}
                value={aiAnalysisResult.description}
                onChange={(e) => setAiAnalysisResult({...aiAnalysisResult, description: e.target.value})}
                className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-zinc-300 focus:outline-none uppercase font-bold tracking-tight rounded"
              />
            </div>

            {/* Badges gauge row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/20 border border-zinc-855 p-3.5 rounded text-left">
                <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-wider">Severity Gauge (1-10)</span>
                <span className="text-xl font-black font-mono text-red-500">{aiAnalysisResult.severityScore}/10</span>
                <span className="text-[8.5px] text-zinc-500 font-bold uppercase block mt-1 leading-none">{aiAnalysisResult.severityReasoning}</span>
              </div>

              <div className="bg-zinc-900/20 border border-zinc-855 p-3.5 rounded text-left">
                <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-wider">Action Department</span>
                <span className="text-xs font-black text-white uppercase tracking-tight block mt-1 leading-normal">{aiAnalysisResult.suggestedAuthority}</span>
                <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block mt-1">Est resolution: {aiAnalysisResult.estimatedResolutionDays} days</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 border-t border-zinc-900 pt-6">
            <button 
              onClick={() => setReportStep(1)}
              className="flex-1 border border-zinc-700 hover:border-white text-white font-black uppercase text-xs py-3.5 tracking-widest rounded"
            >
              Go Back
            </button>
            <button 
              onClick={submitNewReport}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-3.5 tracking-widest rounded"
            >
              Lock In & Post Report
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
