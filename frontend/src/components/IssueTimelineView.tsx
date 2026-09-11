import React, { useState } from "react";
import { HierarchicalIssue, IssueLifecycleStatus } from "../types";
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  User,
  AlertTriangle,
  ArrowRight,
  FileText,
  Eye,
  History,
  Info,
} from "lucide-react";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface IssueTimelineViewProps {
  issue: HierarchicalIssue;
  onViewHistory?: () => void;
}

const STAGES: Array<{
  key: string;
  label: string;
  roleTitle: string;
  dotColor: string;
  activeBg: string;
  badgeColor: string;
}> = [
  {
    key: "worker",
    label: "Worker",
    roleTitle: "Field Observation",
    dotColor: "bg-emerald-500 text-white",
    activeBg: "border-emerald-500 bg-emerald-50/50",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "supervisor",
    label: "Supervisor",
    roleTitle: "Field Endorsement & Edit",
    dotColor: "bg-amber-500 text-white",
    activeBg: "border-amber-500 bg-amber-50/50",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    key: "zonal",
    label: "Zonal Head",
    roleTitle: "Corridor Review & Track Coord",
    dotColor: "bg-orange-500 text-white",
    activeBg: "border-orange-500 bg-orange-50/50",
    badgeColor: "bg-orange-100 text-orange-800",
  },
  {
    key: "dept",
    label: "Department Head",
    roleTitle: "Divisional Technical Sanction",
    dotColor: "bg-rose-500 text-white",
    activeBg: "border-rose-500 bg-rose-50/50",
    badgeColor: "bg-rose-100 text-rose-800",
  },
  {
    key: "coa",
    label: "COA Management",
    roleTitle: "Corridor Slot Clearance (Final)",
    dotColor: "bg-blue-600 text-white",
    activeBg: "border-blue-600 bg-blue-50/50",
    badgeColor: "bg-blue-100 text-blue-800",
  },
];

export const IssueTimelineView: React.FC<IssueTimelineViewProps> = ({
  issue,
  onViewHistory,
}) => {
  const [showDiff, setShowDiff] = useState<boolean>(false);

  // Determine stage progress indices
  const getStageIndex = (status: IssueLifecycleStatus): number => {
    switch (status) {
      case "Reported":
        return 0;
      case "Under Supervisor Review":
      case "Resolved by Supervisor":
        return 1;
      case "Escalated to Zonal Head":
      case "Under Zonal Review":
      case "Resolved by Zonal Head":
        return 2;
      case "Escalated to Department Head":
      case "Under Department Review":
      case "Resolved by Department Head":
        return 3;
      case "Escalated to COA":
      case "Under COA Review":
      case "Resolved / Closed":
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(issue.currentStatus);
  const isResolved = issue.currentStatus.startsWith("Resolved");

  return (
    <div className="bg-white border border-[#c7c4d8]/60 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#eceef0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
              {issue.ticketNo}
            </span>
            <span className="text-xs font-bold text-[#191c1e]">{issue.station} Station</span>
            <span className="text-[11px] text-[#777587] font-mono">({issue.activeRequest.lineType})</span>
          </div>
          <p className="text-xs text-[#464555] mt-1 font-medium">
            Active Status: <strong className="text-[#3525cd]">{issue.currentStatus}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiff(!showDiff)}
            className="px-2.5 py-1 text-xs font-medium text-[#3525cd] bg-[#f2f4f6] hover:bg-[#e2dfff] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showDiff ? "Hide Original vs Active Diff" : "Compare Original vs Active"}</span>
          </button>
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="px-2.5 py-1 text-xs font-medium text-[#464555] bg-[#f2f4f6] hover:bg-[#e6e8ea] rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({issue.modificationHistory.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Escalation Timeline Tracker */}
      <div className="py-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentIndex || (idx === currentIndex && isResolved);
            const isCurrent = idx === currentIndex && !isResolved;
            const isPending = idx > currentIndex;

            return (
              <div
                key={stage.key}
                className={`p-3 rounded-lg border text-xs transition-all relative ${
                  isCurrent
                    ? `${stage.activeBg} ring-2 ring-offset-1 ring-current shadow-xs`
                    : isDone
                    ? "bg-[#f8f9fa] border-emerald-300"
                    : "bg-gray-50 border-gray-200 opacity-65"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? stage.dotColor
                          : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {isDone ? "✓" : idx + 1}
                    </span>
                    <span className="font-bold text-[11px] text-[#191c1e] truncate">{stage.label}</span>
                  </div>
                </div>

                <div className="text-[10px] text-[#464555] font-medium leading-tight">{stage.roleTitle}</div>

                {/* Subtitle / Timestamp */}
                <div className="mt-2 text-[10px] font-mono text-[#777587]">
                  {idx === 0 && `Logged: ${issue.originalRequest.reportedAt.substring(11)}`}
                  {idx === 1 &&
                    (issue.escalatedToZonalAt
                      ? `Esc: ${issue.escalatedToZonalAt.substring(11)}`
                      : isDone
                      ? "Resolved"
                      : "Pending")}
                  {idx === 2 &&
                    (issue.escalatedToDeptAt
                      ? `Esc: ${issue.escalatedToDeptAt.substring(11)}`
                      : isDone
                      ? "Resolved"
                      : "Pending")}
                  {idx === 3 &&
                    (issue.escalatedToCoaAt
                      ? `Esc: ${issue.escalatedToCoaAt.substring(11)}`
                      : isDone
                      ? "Resolved"
                      : "Pending")}
                  {idx === 4 && (isResolved ? "Closed & Sanctioned" : isCurrent ? "Under COA Review" : "Pending")}
                </div>

                {isCurrent && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Original vs Active Request Comparison Diff */}
      {showDiff && (
        <div className="bg-[#f7f9fb] border border-[#c7c4d8] rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#3525cd]" />
              <span>Editable Handover Integrity: Original vs Current Active Request</span>
            </span>
            <span className="text-[11px] text-[#777587] font-mono">
              Worker Original is preserved permanently.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Column 1: Immutably Preserved Original Worker Report */}
            <div className="bg-white border-2 border-emerald-300 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ORIGINAL WORKER SUBMISSION (Permanent)</span>
                </span>
                <span className="font-mono text-[10px] text-[#777587]">
                  {issue.originalRequest.reportedAt}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#777587] uppercase tracking-wider block">
                  Reported Title
                </span>
                <p className="font-semibold text-[#191c1e]">{issue.originalRequest.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#777587] uppercase tracking-wider block">
                  Worker Field Observation
                </span>
                <p className="text-[#464555] bg-[#f8f9fa] p-2 rounded border border-[#eceef0]">
                  {issue.originalRequest.description}
                </p>
              </div>

              {/* Original Defect Images Uploaded by Worker */}
              {issue.originalRequest.media && issue.originalRequest.media.length > 0 && (
                <div className="pt-1">
                  <ComplaintMediaGallery
                    media={issue.originalRequest.media}
                    ticketNo={issue.ticketNo}
                    station={issue.station}
                    title="Worker Photos"
                    compact={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[#777587] block">Section:</span>
                  <span className="font-bold text-[#191c1e]">{issue.originalRequest.trackSection}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">KM Post / Line:</span>
                  <span className="font-bold text-[#191c1e]">
                    {issue.originalRequest.nearestKmPost} ({issue.originalRequest.lineType})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Worker Est. Time:</span>
                  <span className="font-bold text-emerald-700">
                    {issue.originalRequest.estimatedFixTimeMinutes} mins
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Original Priority:</span>
                  <span className="font-bold text-[#191c1e]">{issue.originalRequest.priority}</span>
                </div>
              </div>

              <div className="text-[10px] text-[#777587] font-mono border-t border-[#eceef0] pt-1.5">
                Reported by: <strong>{issue.originalRequest.reportedBy.name}</strong> (
                {issue.originalRequest.reportedBy.empId}) • Group: {issue.originalRequest.reportedBy.gangNo || "P-Way"}
              </div>
            </div>

            {/* Column 2: Current Active Request (Updated by receiving authorities) */}
            <div className="bg-white border-2 border-[#3525cd]/40 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-[#e2dfff] pb-1.5">
                <span className="font-bold text-[#3525cd] text-[11px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#3525cd]" />
                  <span>CURRENT ACTIVE REQUEST (Latest Scope)</span>
                </span>
                <span className="font-mono text-[10px] text-[#777587]">Updated: {issue.updatedAt}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#777587] uppercase tracking-wider block">
                  Active Title
                </span>
                <p className="font-semibold text-[#191c1e]">{issue.activeRequest.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#777587] uppercase tracking-wider block">
                  Technical Scope & Work Specification
                </span>
                <p className="text-[#464555] bg-[#f8f9fa] p-2 rounded border border-[#eceef0]">
                  {issue.activeRequest.description}
                </p>
              </div>

              {/* Active Photos / Attachments */}
              {issue.activeRequest.media && issue.activeRequest.media.length > 0 && (
                <div className="pt-1">
                  <ComplaintMediaGallery
                    media={issue.activeRequest.media}
                    ticketNo={issue.ticketNo}
                    station={issue.station}
                    title="Active Work Photos"
                    compact={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[#777587] block">Verified Section:</span>
                  <span className="font-bold text-[#191c1e]">{issue.activeRequest.trackSection}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">KM Post / Line:</span>
                  <span className="font-bold text-[#191c1e]">
                    {issue.activeRequest.nearestKmPost} ({issue.activeRequest.lineType})
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#191c1e] block">Est Work Time:</span>
                  <span className="text-sm font-extrabold text-[#3525cd]">
                    {issue.activeRequest.estimatedFixTimeMinutes} mins
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Active Priority:</span>
                  <span
                    className={`font-bold ${
                      issue.activeRequest.priority === "Emergency"
                        ? "text-red-700"
                        : issue.activeRequest.priority === "High"
                        ? "text-orange-700"
                        : "text-[#191c1e]"
                    }`}
                  >
                    {issue.activeRequest.priority}
                  </span>
                </div>
              </div>

              {issue.activeRequest.technicalNotes && (
                <div className="bg-[#fffbeb] border border-[#fef3c7] p-2 rounded text-[11px] text-[#92400e]">
                  <strong className="block font-sans text-[10px] uppercase">Technical Handover Notes:</strong>
                  {issue.activeRequest.technicalNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
