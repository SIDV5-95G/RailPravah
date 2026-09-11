import React, { useState } from "react";
import { HierarchicalIssue } from "../types";
import { CheckCircle2, X, Wrench, ShieldCheck, FileText } from "lucide-react";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface ResolveIssueModalProps {
  issue: HierarchicalIssue;
  resolverRole: string;
  onClose: () => void;
  onConfirm: (resolutionDetails: string) => void;
  isResolving?: boolean;
}

export const ResolveIssueModal: React.FC<ResolveIssueModalProps> = ({
  issue,
  resolverRole,
  onClose,
  onConfirm,
  isResolving = false,
}) => {
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionDetails.trim()) {
      setError("Please provide technical resolution details before marking this issue resolved.");
      return;
    }
    if (!confirmed) {
      setError("Please check the confirmation box to certify track and equipment safety.");
      return;
    }

    onConfirm(resolutionDetails);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Resolution Certification
              </span>
              <h3 className="text-base font-bold text-[#191c1e]">
                Mark Issue as Resolved / Closed
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#777587] hover:text-[#191c1e] hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-[#f2f4f6] p-3 rounded-lg space-y-1">
            <span className="font-mono font-bold text-[#3525cd]">{issue.ticketNo}</span>
            <p className="font-semibold text-[#191c1e]">{issue.activeRequest.title}</p>
            <p className="text-[11px] text-[#777587] font-mono">
              {issue.station} • {issue.activeRequest.trackSection}
            </p>
          </div>

          {/* Worker Defect Photos Evidence */}
          {((issue.activeRequest.media && issue.activeRequest.media.length > 0) ||
            (issue.originalRequest.media && issue.originalRequest.media.length > 0)) && (
            <div className="p-3 bg-[#f8f9fa] border border-[#eceef0] rounded-xl space-y-1">
              <ComplaintMediaGallery
                media={
                  issue.activeRequest.media && issue.activeRequest.media.length > 0
                    ? issue.activeRequest.media
                    : issue.originalRequest.media
                }
                ticketNo={issue.ticketNo}
                station={issue.station}
                title="Defect Photos Being Resolved"
                compact={false}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-[#191c1e] mb-1">
              Final Resolution & Clearance Details <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Replaced cracked insulator with composite polymer unit. Tower wagon group tested under full 25kV load. Caution order cancelled; normal 100 KMPH line speed restored at 04:30."
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              required
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900">
            <input
              type="checkbox"
              id="confirm-resolution-check"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600 cursor-pointer"
            />
            <label htmlFor="confirm-resolution-check" className="text-[11px] cursor-pointer leading-tight">
              <strong>Safety Sign-Off:</strong> I certify as <strong>{resolverRole}</strong> that the
              maintenance work has been completed to Central Railway technical standards and track safety
              is verified.
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#464555] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResolving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isResolving ? "Resolving..." : "Certify & Close Issue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
