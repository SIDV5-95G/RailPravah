import React, { useState } from "react";
import { HierarchicalIssue } from "../types";
import {
  AlertTriangle,
  ArrowRight,
  X,
  Send,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface EscalateIssueModalProps {
  issue: HierarchicalIssue;
  sourceLevel: "Supervisor" | "Zonal Head" | "Department Head";
  targetLevel: "Zonal Head" | "Department Head" | "COA Management";
  onClose: () => void;
  onConfirm: (reason: string, remarks: string) => void;
  isEscalating?: boolean;
}

export const EscalateIssueModal: React.FC<EscalateIssueModalProps> = ({
  issue,
  sourceLevel,
  targetLevel,
  onClose,
  onConfirm,
  isEscalating = false,
}) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isCoaEscalation = targetLevel === "COA Management";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError("A specific reason for escalation is mandatory.");
      return;
    }
    if (!remarks.trim()) {
      setValidationError("Please add your official remarks before forwarding.");
      return;
    }
    if (!confirmCheckbox) {
      setValidationError("Please check the confirmation box to verify this handover.");
      return;
    }

    onConfirm(reason, remarks);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isCoaEscalation
              ? "bg-[#ffdad6]/40 border-[#ffdad6]"
              : "bg-[#fffbeb] border-[#fef3c7]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-lg ${
                isCoaEscalation
                  ? "bg-[#ba1a1a] text-white"
                  : "bg-[#d97706] text-white"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777587]">
                Official Hierarchy Handover
              </span>
              <h3 className="text-base font-bold text-[#191c1e]">
                {isCoaEscalation ? "Escalate to COA Management" : `Forward to ${targetLevel}`}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Level Transition Pill */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-[#f8f9fa] rounded-xl border border-[#eceef0] font-mono text-xs">
            <span className="font-bold text-[#464555]">{sourceLevel}</span>
            <ArrowRight className="w-4 h-4 text-[#3525cd]" />
            <span className="font-bold text-[#3525cd]">{targetLevel}</span>
          </div>

          {/* Issue Summary Context */}
          <div className="bg-[#f2f4f6] p-3 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#3525cd]">{issue.ticketNo}</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                {issue.activeRequest.priority} Priority
              </span>
            </div>
            <p className="font-semibold text-[#191c1e]">{issue.activeRequest.title}</p>
            <p className="text-[11px] text-[#777587] font-mono">
              {issue.station} • {issue.activeRequest.trackSection} • {issue.activeRequest.nearestKmPost}
            </p>
          </div>

          {/* Worker Uploaded Complaint Photos Evidence */}
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
                title="Defect Photos Escalating with this Ticket"
                compact={false}
              />
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* Mandatory Reason for Escalation */}
          <div>
            <label className="block font-bold text-[#191c1e] mb-1">
              Reason for Escalation <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder={
                isCoaEscalation
                  ? "e.g. Requires 3.5-hour corridor block across Down Fast; conflicts with suburban rakes"
                  : "e.g. Multi-section track coordination & caution order sanction required"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
            />
          </div>

          {/* Detailed Remarks */}
          <div>
            <label className="block font-bold text-[#191c1e] mb-1">
              {sourceLevel} Endorsement Remarks <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Technical observations, crew readiness, recommended slot window, or traffic implications..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
            />
          </div>

          {/* Confirmation Checkbox to prevent accidental forwarding */}
          <div className="p-3 bg-[#fffbeb] border border-[#fef3c7] rounded-lg flex items-start gap-2 text-[#92400e]">
            <input
              type="checkbox"
              id="confirm-escalate-check"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="mt-0.5 rounded text-[#3525cd] focus:ring-[#3525cd] cursor-pointer"
            />
            <label htmlFor="confirm-escalate-check" className="text-[11px] cursor-pointer leading-tight">
              <strong>Confirm Escalation:</strong> I have reviewed this issue, confirmed that it cannot be
              resolved at the {sourceLevel} level, and authorize forwarding it to {targetLevel}.
            </label>
          </div>

          {/* Footer Actions */}
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
              disabled={isEscalating}
              className={`px-5 py-2 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 ${
                isCoaEscalation
                  ? "bg-[#ba1a1a] hover:bg-[#93000a]"
                  : "bg-[#3525cd] hover:bg-[#4f46e5]"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isEscalating
                  ? "Escalating..."
                  : isCoaEscalation
                  ? "Confirm & Escalate to COA"
                  : `Forward to ${targetLevel}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
