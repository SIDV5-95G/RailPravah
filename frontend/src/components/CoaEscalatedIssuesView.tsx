import React, { useState, useEffect } from "react";
import { HierarchicalIssue, IssueLifecycleStatus } from "../types";
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  Search,
  Filter,
  MessageSquare,
  History,
  Eye,
  Send,
  Building,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { IssueTimelineView } from "./IssueTimelineView";
import { EditIssueModal } from "./EditIssueModal";
import { ModificationHistoryModal } from "./ModificationHistoryModal";
import { ResolveIssueModal } from "./ResolveIssueModal";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface CoaEscalatedIssuesViewProps {
  onIssueResolved?: (issue: HierarchicalIssue) => void;
}

export const CoaEscalatedIssuesView: React.FC<CoaEscalatedIssuesViewProps> = ({
  onIssueResolved,
}) => {
  const [issues, setIssues] = useState<HierarchicalIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<HierarchicalIssue | null>(null);

  // Modals state
  const [viewHistoryIssue, setViewHistoryIssue] = useState<HierarchicalIssue | null>(null);
  const [editModalIssue, setEditModalIssue] = useState<HierarchicalIssue | null>(null);
  const [resolveModalIssue, setResolveModalIssue] = useState<HierarchicalIssue | null>(null);
  const [remarksModalIssue, setRemarksModalIssue] = useState<HierarchicalIssue | null>(null);
  const [coaRemarkInput, setCoaRemarkInput] = useState<string>("");

  // Quick original submission peek modal
  const [originalReportPeek, setOriginalReportPeek] = useState<HierarchicalIssue | null>(null);

  const fetchCoaIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/issues?role=coa_admin", {
        headers: {
          "x-user-role": "coa_admin",
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error("Failed to fetch COA escalated issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaIssues();
  }, []);

  // Filter COA issues: Only show issues at COA level (Escalated to COA, Under COA Review, Resolved / Closed)
  const filteredIssues = issues.filter((issue) => {
    // Search match
    const matchSearch =
      issue.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.activeRequest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.department && issue.department.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (filterStatus === "pending") {
      return issue.currentStatus === "Escalated to COA" || issue.currentStatus === "Under COA Review";
    }
    if (filterStatus === "resolved") {
      return issue.currentStatus === "Resolved / Closed";
    }
    return true;
  });

  // Handle Save Edit
  const handleSaveEdit = async (
    updatedActive: any,
    changesSummary: string,
    remarks: string
  ) => {
    if (!editModalIssue) return;
    try {
      const res = await fetch(`/api/issues/${editModalIssue.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "coa_admin",
        },
        body: JSON.stringify({
          level: "COA Management",
          modifiedBy: {
            name: "COA Section Controller",
            empId: "COA-CR-01",
            role: "Chief Corridor Controller",
          },
          changesSummary,
          remarks,
          activeRequest: updatedActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalIssue(null);
        fetchCoaIssues();
      }
    } catch (err) {
      console.error("Error editing issue in COA:", err);
    }
  };

  // Handle Resolve Issue
  const handleResolveIssue = async (resolutionDetails: string) => {
    if (!resolveModalIssue) return;
    try {
      const res = await fetch(`/api/issues/${resolveModalIssue.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "coa_admin",
        },
        body: JSON.stringify({
          level: "COA Management",
          userRole: "coa_admin",
          modifiedBy: {
            name: "COA Corridor Authority",
            empId: "COA-CR-HQ",
            role: "Chief Train Controller (COA CSMT)",
          },
          resolutionDetails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolveModalIssue(null);
        fetchCoaIssues();
        if (onIssueResolved) onIssueResolved(data.issue);
      }
    } catch (err) {
      console.error("Error resolving issue in COA:", err);
    }
  };

  // Handle Add Remarks
  const handleAddRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarksModalIssue || !coaRemarkInput.trim()) return;
    try {
      const res = await fetch(`/api/issues/${remarksModalIssue.id}/add-remarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "coa_admin",
        },
        body: JSON.stringify({
          level: "COA Management",
          modifiedBy: {
            name: "COA Corridor Authority",
            empId: "COA-CR-HQ",
            role: "Chief Train Controller (COA CSMT)",
          },
          remarks: coaRemarkInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRemarksModalIssue(null);
        setCoaRemarkInput("");
        fetchCoaIssues();
      }
    } catch (err) {
      console.error("Error adding COA remarks:", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* COA Authority Banner */}
      <div className="bg-linear-to-r from-[#191c1e] to-[#2b2e30] rounded-2xl p-5 text-white border border-[#464555] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#3525cd] text-white text-[11px] font-mono font-bold rounded-md">
              COA MANAGEMENT CONSOLE
            </span>
            <span className="text-xs text-blue-300 font-medium">Control Office Application • HQ CSMT</span>
          </div>
          <h2 className="text-xl font-bold mt-1 tracking-tight">
            Final Escalation & Corridor Block Clearance
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            Issues escalated to COA represent multi-department track possessions, severe corridor
            conflicts, or critical structural interventions requiring synchronized suburban train
            regulation.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 font-mono text-xs">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-lg font-bold text-amber-300">
              {issues.filter((i) => i.currentStatus === "Escalated to COA").length}
            </div>
            <div className="text-[10px] text-gray-300 uppercase">Pending COA</div>
          </div>
          <div className="text-center px-3">
            <div className="text-lg font-bold text-emerald-400">
              {issues.filter((i) => i.currentStatus === "Resolved / Closed").length}
            </div>
            <div className="text-[10px] text-gray-300 uppercase">Sanctioned / Closed</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#c7c4d8]/60 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777587]" />
          <input
            type="text"
            placeholder="Search by ticket, station, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === "all"
                ? "bg-[#3525cd] text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            All COA Escalations ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === "pending"
                ? "bg-amber-500 text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            Action Required ({issues.filter((i) => i.currentStatus !== "Resolved / Closed").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("resolved")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === "resolved"
                ? "bg-emerald-600 text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            Sanctioned / Closed ({issues.filter((i) => i.currentStatus === "Resolved / Closed").length})
          </button>
        </div>
      </div>

      {/* Issues Table / Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#c7c4d8]/60 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#3525cd] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#777587]">Loading COA escalated corridor requests...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-[#c7c4d8]/60 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#191c1e]">No Escalated Issues Pending</h3>
          <p className="text-xs text-[#777587] max-w-md mx-auto">
            All corridor maintenance items from Department Heads are currently sanctioned, or no
            issues match the active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isResolved = issue.currentStatus === "Resolved / Closed";

            return (
              <div
                key={issue.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all ${
                  isResolved
                    ? "border-emerald-200"
                    : issue.activeRequest.priority === "Emergency"
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-[#c7c4d8]/70"
                }`}
              >
                {/* Issue Header Bar */}
                <div className="p-4 sm:p-5 border-b border-[#eceef0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8f9fa]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2.5 py-0.5 rounded">
                        {issue.ticketNo}
                      </span>
                      <span className="text-xs font-bold text-[#191c1e]">{issue.station} Station</span>
                      <span className="text-[11px] text-[#777587] font-mono">
                        ({issue.activeRequest.trackSection} • {issue.activeRequest.lineType} •{" "}
                        {issue.activeRequest.nearestKmPost})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.activeRequest.priority === "Emergency"
                            ? "bg-red-100 text-red-800"
                            : issue.activeRequest.priority === "High"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {issue.activeRequest.priority} Priority
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#191c1e]">
                      {issue.activeRequest.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isResolved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {issue.currentStatus}
                    </span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* COA Escalation Context Box */}
                  <div className="p-3.5 bg-[#fff8e1] border border-[#ffe082] rounded-xl space-y-2 text-[#795548]">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-bold text-[#b78103]">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>REASON FOR ESCALATION TO COA MANAGEMENT</span>
                      </span>
                      <span className="font-mono text-[10px]">
                        Escalated: {issue.escalatedToCoaAt || issue.updatedAt}
                      </span>
                    </div>
                    <p className="font-medium text-[#4e342e] leading-relaxed">
                      {issue.coaEscalationReason || "Corridor slot clearance & suburban regulation required."}
                    </p>
                    {issue.deptRemarks && (
                      <p className="text-[11px] text-[#6d4c41] italic border-t border-[#ffe082]/60 pt-1.5">
                        <strong>Dept Head Remarks:</strong> "{issue.deptRemarks}"
                      </p>
                    )}
                  </div>

                  {/* Hierarchy Accountability Trail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0]">
                      <span className="text-[10px] uppercase font-bold text-[#777587] block">
                        1. Worker (Field Log)
                      </span>
                      <p className="font-bold text-[#191c1e] text-xs mt-0.5">
                        {issue.originalRequest.reportedBy.name}
                      </p>
                      <p className="text-[10px] text-[#777587] font-mono">
                        {issue.originalRequest.reportedBy.empId} • {issue.originalRequest.reportedBy.gangNo}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-mono mt-1">
                        Reported: {issue.originalRequest.reportedAt.substring(0, 16)}
                      </p>
                    </div>

                    <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0]">
                      <span className="text-[10px] uppercase font-bold text-[#777587] block">
                        2. Supervisor (SSE)
                      </span>
                      <p className="font-bold text-[#191c1e] text-xs mt-0.5">
                        {issue.supervisor.name}
                      </p>
                      <p className="text-[10px] text-[#777587] font-mono">
                        {issue.supervisor.empId} • {issue.supervisor.designation}
                      </p>
                      <p className="text-[10px] text-amber-700 font-mono mt-1">
                        {issue.supervisor.depot}
                      </p>
                    </div>

                    <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0]">
                      <span className="text-[10px] uppercase font-bold text-[#777587] block">
                        3. Zonal Head (HQ)
                      </span>
                      <p className="font-bold text-[#191c1e] text-xs mt-0.5">
                        {issue.zonalHead?.name || "Virendra K. Meena"}
                      </p>
                      <p className="text-[10px] text-[#777587] font-mono">
                        {issue.zonalHead?.empId || "ZON-CR-1102"} • CTE Central Zone
                      </p>
                      <p className="text-[10px] text-orange-700 font-mono mt-1">
                        Escalated: {issue.escalatedToZonalAt || "Passed"}
                      </p>
                    </div>

                    <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0]">
                      <span className="text-[10px] uppercase font-bold text-[#777587] block">
                        4. Department Head
                      </span>
                      <p className="font-bold text-[#191c1e] text-xs mt-0.5">
                        {issue.departmentHead?.name || "Dr. Pradeep Verma"}
                      </p>
                      <p className="text-[10px] text-[#777587] font-mono">
                        {issue.departmentHead?.empId || "DPT-CR-5520"} • Sr. DEN
                      </p>
                      <p className="text-[10px] text-rose-700 font-mono mt-1">
                        Escalated to COA: {issue.escalatedToCoaAt || "Passed"}
                      </p>
                    </div>
                  </div>

                  {/* Active Request Technical Scope & Original Peek Button */}
                  <div className="bg-[#f8f9fa] border border-[#eceef0] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-[#191c1e] text-xs">
                        Current Technical Work Scope:
                      </span>
                      <button
                        type="button"
                        onClick={() => setOriginalReportPeek(issue)}
                        className="text-xs font-semibold text-[#3525cd] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Original Worker Submission</span>
                      </button>
                    </div>
                    <p className="text-[#464555] bg-white p-2.5 rounded-lg border border-[#eceef0] leading-relaxed">
                      {issue.activeRequest.description}
                    </p>
                    <div className="flex items-center gap-4 flex-wrap text-[11px] font-mono text-[#777587]">
                      <span>
                        Est. Fix Time:{" "}
                        <strong className="text-[#3525cd]">
                          {issue.activeRequest.estimatedFixTimeMinutes} minutes
                        </strong>
                      </span>
                      {issue.activeRequest.technicalNotes && (
                        <span>
                          Notes:{" "}
                          <strong className="text-[#191c1e]">
                            {issue.activeRequest.technicalNotes}
                          </strong>
                        </span>
                      )}
                    </div>

                    {/* Complaint Defect Photos & Visual Evidence */}
                    <div className="pt-2 border-t border-[#eceef0]">
                      <ComplaintMediaGallery
                        media={
                          issue.activeRequest.media && issue.activeRequest.media.length > 0
                            ? issue.activeRequest.media
                            : issue.originalRequest.media
                        }
                        ticketNo={issue.ticketNo}
                        station={issue.station}
                        title="Worker Defect Photos & Visual Evidence"
                      />
                    </div>
                  </div>

                  {/* Embedded Escalation Timeline Component */}
                  <IssueTimelineView
                    issue={issue}
                    onViewHistory={() => setViewHistoryIssue(issue)}
                  />

                  {/* Resolution banner if resolved */}
                  {isResolved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Resolved / Closed by {issue.resolvedBy?.level || "COA Management"}</span>
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700">
                          {issue.resolvedAt}
                        </span>
                      </div>
                      <p className="text-xs">{issue.resolutionDetails}</p>
                    </div>
                  )}

                  {/* COA Action Controls */}
                  <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewHistoryIssue(issue)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#464555] bg-[#f2f4f6] hover:bg-[#eceef0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Complete History ({issue.modificationHistory.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRemarksModalIssue(issue);
                          setCoaRemarkInput("");
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#3525cd] bg-[#e2dfff] hover:bg-[#d0ccff] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Add COA Remarks</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditModalIssue(issue)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#191c1e] bg-white border border-[#c7c4d8] hover:bg-[#f8f9fa] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#3525cd]" />
                        <span>Edit Active Request</span>
                      </button>

                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => setResolveModalIssue(issue)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sanction & Close Issue</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Original Report Peek Modal */}
      {originalReportPeek && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-emerald-300 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>ORIGINAL WORKER SUBMISSION (Permanent & Immutable)</span>
              </span>
              <button
                type="button"
                onClick={() => setOriginalReportPeek(null)}
                className="text-[#777587] hover:text-[#191c1e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">Ticket No:</span>
                <span className="font-mono font-bold text-[#3525cd]">
                  {originalReportPeek.ticketNo}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">Reported Title:</span>
                <p className="font-bold text-[#191c1e]">
                  {originalReportPeek.originalRequest.title}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">
                  Worker Field Observation:
                </span>
                <p className="p-2.5 bg-emerald-50 text-emerald-950 rounded-lg border border-emerald-200">
                  {originalReportPeek.originalRequest.description}
                </p>
              </div>

              {/* Original Worker Defect Photos */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <ComplaintMediaGallery
                  media={originalReportPeek.originalRequest.media}
                  ticketNo={originalReportPeek.ticketNo}
                  station={originalReportPeek.station}
                  title="Original Defect Field Photos Uploaded by Worker"
                  showOriginalTag={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[#777587] block">Location:</span>
                  <span>
                    {originalReportPeek.originalRequest.station} (
                    {originalReportPeek.originalRequest.trackSection})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">KM Post / Line:</span>
                  <span>
                    {originalReportPeek.originalRequest.nearestKmPost} •{" "}
                    {originalReportPeek.originalRequest.lineType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Reported By:</span>
                  <span>{originalReportPeek.originalRequest.reportedBy.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Logged Date:</span>
                  <span>{originalReportPeek.originalRequest.reportedAt}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#eceef0] flex justify-end">
              <button
                type="button"
                onClick={() => setOriginalReportPeek(null)}
                className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Issue Modal */}
      {editModalIssue && (
        <EditIssueModal
          issue={editModalIssue}
          userRoleTitle="COA Management"
          onClose={() => setEditModalIssue(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* MODAL 3: Complete Audit History Modal */}
      {viewHistoryIssue && (
        <ModificationHistoryModal
          issue={viewHistoryIssue}
          onClose={() => setViewHistoryIssue(null)}
        />
      )}

      {/* MODAL 4: Resolve Issue Modal */}
      {resolveModalIssue && (
        <ResolveIssueModal
          issue={resolveModalIssue}
          resolverRole="COA Corridor Authority"
          onClose={() => setResolveModalIssue(null)}
          onConfirm={handleResolveIssue}
        />
      )}

      {/* MODAL 5: Add Remarks Modal */}
      {remarksModalIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#c7c4d8] shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#eceef0] pb-2">
              <h3 className="font-bold text-sm text-[#191c1e]">
                Add COA Management Remarks
              </h3>
              <button
                type="button"
                onClick={() => setRemarksModalIssue(null)}
                className="text-[#777587] hover:text-[#191c1e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRemarks} className="space-y-3">
              <div className="bg-[#f2f4f6] p-2 rounded text-[11px] font-mono">
                Ticket: <strong>{remarksModalIssue.ticketNo}</strong> •{" "}
                {remarksModalIssue.station}
              </div>

              <div>
                <label className="block font-bold text-[#191c1e] mb-1">
                  COA Review Notes / Train Regulation Instructions:
                </label>
                <textarea
                  rows={4}
                  value={coaRemarkInput}
                  onChange={(e) => setCoaRemarkInput(e.target.value)}
                  required
                  placeholder="e.g. Approved for shadow block slot during Kasara freight turnaround. S&T and TRD staff must confirm track clearance 15 mins prior."
                  className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg p-3 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRemarksModalIssue(null)}
                  className="px-3 py-1.5 text-xs text-[#464555] hover:bg-[#eceef0] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] transition-colors cursor-pointer"
                >
                  Save Remarks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
