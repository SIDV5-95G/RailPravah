import React, { useState } from "react";
import { HierarchicalIssue, PriorityType, IssueSnapshot } from "../types";
import { X, Save, AlertCircle, ShieldCheck, Clock, MapPin, Wrench } from "lucide-react";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface EditIssueModalProps {
  issue: HierarchicalIssue;
  userRoleTitle: string;
  onClose: () => void;
  onSave: (
    updatedActiveRequest: IssueSnapshot,
    changesSummary: string,
    remarks: string
  ) => void;
  isSaving?: boolean;
}

export const EditIssueModal: React.FC<EditIssueModalProps> = ({
  issue,
  userRoleTitle,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [title, setTitle] = useState(issue.activeRequest.title);
  const [description, setDescription] = useState(issue.activeRequest.description);
  const [priority, setPriority] = useState<PriorityType>(issue.activeRequest.priority);
  const [estimatedFixTimeMinutes, setEstimatedFixTimeMinutes] = useState(
    issue.activeRequest.estimatedFixTimeMinutes
  );
  const [station, setStation] = useState(issue.activeRequest.station);
  const [trackSection, setTrackSection] = useState(issue.activeRequest.trackSection);
  const [nearestKmPost, setNearestKmPost] = useState(issue.activeRequest.nearestKmPost);
  const [lineType, setLineType] = useState(issue.activeRequest.lineType);
  const [technicalNotes, setTechnicalNotes] = useState(
    issue.activeRequest.technicalNotes || ""
  );

  // Mandatory audit fields
  const [changesSummary, setChangesSummary] = useState("");
  const [remarks, setRemarks] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changesSummary.trim()) {
      setValidationError("Please enter a summary of changes made for the audit record.");
      return;
    }
    if (!remarks.trim()) {
      setValidationError("Please enter remarks/technical assessment for this handover review.");
      return;
    }

    const updatedActiveRequest: IssueSnapshot = {
      ...issue.activeRequest,
      title,
      description,
      priority,
      estimatedFixTimeMinutes: Number(estimatedFixTimeMinutes) || 45,
      station,
      trackSection,
      nearestKmPost,
      lineType,
      technicalNotes,
    };

    onSave(updatedActiveRequest, changesSummary, remarks);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#3525cd] text-white text-[10px] font-mono font-bold rounded">
                {issue.ticketNo}
              </span>
              <span className="text-xs font-bold text-[#191c1e]">{userRoleTitle} Handover Edit</span>
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mt-1">
              Update Active Issue Request
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#777587] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Preservation Banner */}
          <div className="p-3 bg-[#e6f4ea] border border-[#a8dab5] rounded-xl flex items-start gap-2.5 text-[#137333]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="text-[11px] leading-relaxed">
              <strong>Immutable Original Preservation:</strong> Editing updates the{" "}
              <em>Current Active Request</em>. The original Worker submission logged by{" "}
              <strong>{issue.originalRequest.reportedBy.name}</strong> is permanently preserved in
              the database and will never be overwritten.
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-bold text-[#191c1e] mb-1">Issue Title / Defect Summary</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-[#191c1e] mb-1">
              Technical Description & Work Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
            />
          </div>

          {/* Worker Complaint Defect Photos */}
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
                title="Worker Field Defect Photos (Evidence)"
                compact={false}
              />
            </div>
          )}

          {/* Location & Sector Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">Station</label>
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                required
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">Track Section</label>
              <input
                type="text"
                value={trackSection}
                onChange={(e) => setTrackSection(e.target.value)}
                required
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">Nearest KM Post / Mast</label>
              <input
                type="text"
                value={nearestKmPost}
                onChange={(e) => setNearestKmPost(e.target.value)}
                required
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">Line Type</label>
              <select
                value={lineType}
                onChange={(e) => setLineType(e.target.value as any)}
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
              >
                <option value="Down Fast">Down Fast</option>
                <option value="Up Fast">Up Fast</option>
                <option value="Down Slow">Down Slow</option>
                <option value="Up Slow">Up Slow</option>
                <option value="Yard / Siding">Yard / Siding</option>
              </select>
            </div>
          </div>

          {/* Priority & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityType)}
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white font-semibold"
              >
                <option value="Emergency">🚨 Emergency</option>
                <option value="High">⚠️ High</option>
                <option value="Medium">⚡ Medium</option>
                <option value="Low">ℹ️ Low</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#191c1e] mb-1">
                Estimated Work Time (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="480"
                value={estimatedFixTimeMinutes}
                onChange={(e) => setEstimatedFixTimeMinutes(Number(e.target.value))}
                required
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
              />
            </div>
          </div>

          {/* Technical Assessment Notes */}
          <div>
            <label className="block font-bold text-[#191c1e] mb-1">
              Technical Assessment & Equipment Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Requires thermit weld kit / Tower Wagon TW-902 / 30 KMPH caution active"
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
            />
          </div>

          {/* Audit History Logging Requirements */}
          <div className="pt-2 border-t border-[#eceef0] space-y-3">
            <h4 className="font-bold text-[#191c1e] text-[11px] uppercase tracking-wider text-[#3525cd]">
              Handover Audit Trail Fields (Required)
            </h4>

            <div>
              <label className="block font-bold text-[#191c1e] mb-1">
                Summary of Changes Made <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Revised fix time to 90 mins; upgraded priority to High; verified track clamp."
                value={changesSummary}
                onChange={(e) => setChangesSummary(e.target.value)}
                required
                className="w-full bg-[#fffbeb] border border-[#fef3c7] rounded-lg px-3 py-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#191c1e] mb-1">
                Handover Remarks / Technical Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Remarks added at this level for downstream reviews or resolution..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
                className="w-full bg-[#fffbeb] border border-[#fef3c7] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#eceef0] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#464555] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Active Updates"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
