import React, { useState } from 'react';
import { Issue } from '../types';
import { X, Copy, Download, FileText, Check, Loader2 } from 'lucide-react';
import { issuesService } from '../services/issuesService';
import { complaintResponseSchema } from '../schemas';

interface ComplaintLetterModalProps {
  issue: Issue;
  onClose: () => void;
}

export const ComplaintLetterModal: React.FC<ComplaintLetterModalProps> = ({ issue, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [complaintText, setComplaintText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const reporterName = issue.anonymous ? `Anonymous Citizen #${issue.id.slice(-4)}` : issue.reportedByName;
  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const daysUnresolved = Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (3600 * 24 * 1000)));

  const generateLetter = async () => {
    setLoading(true);
    setDownloaded(false);
    setCopied(false);

    try {
      const data = await issuesService.generateComplaint({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        verificationCount: issue.verificationCount,
        location: issue.location,
        daysUnresolved,
        reporterName,
        generatedDate
      });

      const parsedData = complaintResponseSchema.parse(data);
      setComplaintText(parsedData.text);
    } catch (err) {
      console.error("Grievance letter generation error:", err);
      // Hard fallback matching standard styling
      setComplaintText(`
FORMAL CIVIC GRIEVANCE COMPLAINT

Date: ${generatedDate}
To,
The Joint Ward Commissioner / Chief Municipal Engineer,  
Municipal Corporation Division,  
${issue.location.city}, India.

Subject: URGENT CITIZEN DEMAND - Immediate remediation of ${issue.category.toUpperCase()} hazard at ${issue.location.area}

Respected Sir/Madam,

This is an official grievance registered under the FixIt Community Security Network. We write to direct your immediate attention to a critical public hazard that poses severe threats to the safety, health, and mobility of residents in this quadrant.

Grievance Specifications:
Incident Title: ${issue.title}
Detailed Description: ${issue.description}
Location Address: ${issue.location.address}
Assessed Severity Category: ${issue.severity.toUpperCase()}
Duration Outstanding: Unresolved for ${daysUnresolved} days since official report.

Community Verification & Evidence:
This report has been actively geofenced-verified on-site by ${issue.verificationCount} registered local citizens who have attested to its ongoing threat level. Photographic evidence has been verified and registered on our civic ledger.

The persistence of this hazard represents a direct failure of standard ward maintenance guidelines and creates a high-risk liability for the municipal office under public security safety mandates.

Required Action:
We respectfully demand that a field engineer inspect the site and coordinate an active repair squad within 48 hours of receiving this grievance.

Thank you for your prompt attention to public safety.

Sincerely,
Civic Hero Advocate: ${reporterName}
      `);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(complaintText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([complaintText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `FixIt_Municipal_Complaint_${issue.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl flex flex-col rounded-lg max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#121214]">
          <div className="flex items-center gap-2">
            <FileText className="text-red-500 w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Legal Redress Tool</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 mb-1">Municipal Complaint Generator</h3>
            <p className="text-[11px] text-zinc-500 uppercase font-bold leading-normal">
              Using issue telemetry (severity scores, citizen confirmations, duration) FixIt auto-formulates a formally worded legal grievance for local municipal ward offices.
            </p>
          </div>

          {!complaintText && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-800">
              <FileText className="w-12 h-12 text-zinc-700 mb-4" />
              <button 
                onClick={generateLetter}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs px-6 py-3 tracking-widest transition-colors rounded"
              >
                Assemble Letter via Gemini AI
              </button>
              <span className="text-[9px] font-mono text-zinc-600 mt-2 uppercase tracking-wide">
                Takes ~2 seconds to process raw coordinates & descriptions
              </span>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Formulating Legal Content</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                  Drafting professional salutations, incident telemetry summaries, and demand clauses...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-grow">
              <div className="bg-black border border-zinc-800 p-5 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-y-auto max-h-[40vh] whitespace-pre-wrap select-text rounded">
                {complaintText}
              </div>

              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-black uppercase text-xs py-3.5 tracking-widest transition-colors rounded"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Letter Text</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={downloadText}
                  className="flex-1 flex items-center justify-center gap-2 border border-zinc-700 hover:border-white text-white font-black uppercase text-xs py-3.5 tracking-widest transition-colors rounded"
                >
                  {downloaded ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download .txt File</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
