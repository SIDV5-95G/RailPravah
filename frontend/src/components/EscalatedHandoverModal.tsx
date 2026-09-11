import React from "react";
import { HierarchicalIssue, UserProfile } from "../types";
import {
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Layers,
  Send,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";

interface EscalatedHandoverModalProps {
  issue: HierarchicalIssue;
  currentUser: UserProfile;
  onClose: () => void;
}

export const EscalatedHandoverModal: React.FC<EscalatedHandoverModalProps> = ({
  issue,
  currentUser,
  onClose,
}) => {
  // Find the latest escalation record from modification history or specific escalation fields
  const escalationRecords = (issue.modificationHistory || []).filter(
    (m) =>
      m.actionTaken?.toLowerCase().includes("escalat") ||
      m.changes?.toLowerCase().includes("escalat") ||
      m.remarks?.toLowerCase().includes("escalat") ||
      m.level === "Supervisor" ||
      m.level === "Zonal Head" ||
      m.level === "Department Head"
  );

  const latestEscalation = escalationRecords[escalationRecords.length - 1];

  // Determine submitting officer based on current status and history
  let submittingOfficer = {
    name: latestEscalation?.modifiedBy?.name || issue.supervisor.name,
    empId: latestEscalation?.modifiedBy?.empId || issue.supervisor.empId,
    role: latestEscalation?.modifiedBy?.role || latestEscalation?.level || "Section Supervisor",
    designation: issue.supervisor.designation,
    department: issue.department,
    dateTime: latestEscalation?.dateTime || issue.escalatedToZonalAt || issue.updatedAt || issue.createdAt,
  };

  let targetRecipient = {
    level: "Zonal Head / Chief Engineer Desk",
    name: issue.zonalHead?.name || "Chief Track Engineer (CTE CSMT)",
    designation: issue.zonalHead?.designation || "Chief Technical Authority",
    zone: issue.zone || "Central Railway Headquarters CSMT",
  };

  if (issue.currentStatus.includes("Department")) {
    submittingOfficer = {
      name: issue.zonalHead?.name || "Chief Track Engineer",
      empId: issue.zonalHead?.empId || "ZON-CR-1102",
      role: "Zonal Technical Head",
      designation: issue.zonalHead?.designation || "Chief Track Engineer",
      department: issue.department,
      dateTime: issue.escalatedToDeptAt || issue.updatedAt,
    };
    targetRecipient = {
      level: "Department Head / Sr. DEN",
      name: issue.departmentHead?.name || "Dr. Pradeep Verma",
      designation: issue.departmentHead?.designation || "Sr. Divisional Engineer",
      zone: issue.zone,
    };
  } else if (issue.currentStatus.includes("COA")) {
    submittingOfficer = {
      name: issue.departmentHead?.name || "Sr. Divisional Engineer",
      empId: issue.departmentHead?.empId || "DPT-CR-5520",
      role: "Department Head",
      designation: issue.departmentHead?.designation || "Sr. Divisional Engineer",
      department: issue.department,
      dateTime: issue.escalatedToCoaAt || issue.updatedAt,
    };
    targetRecipient = {
      level: "Apex COA Corridor Controller",
      name: "Chief Train Controller (COA CSMT)",
      designation: "Apex Traffic & Corridor Possession Authority",
      zone: "Central Railway Headquarters CSMT",
    };
  }

  // Escalation reason & technical assessment
  const escalationReason =
    issue.zonalEscalationReason ||
    issue.deptEscalationReason ||
    issue.coaEscalationReason ||
    latestEscalation?.remarks ||
    latestEscalation?.changes ||
    "Major track & safety defect requiring multi-departmental possessions and higher technical sanction.";

  const technicalRemarks =
    issue.zonalRemarks ||
    issue.deptRemarks ||
    issue.coaRemarks ||
    latestEscalation?.remarks ||
    "Handover inspection completed. All primary safety precautions and preliminary speed restrictions recorded.";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2.5 py-0.5 rounded-md">
                  {issue.ticketNo}
                </span>
                <span className="px-2 py-0.5 bg-[#fef3c7] text-[#92400e] text-[10px] font-bold rounded-full border border-[#f59e0b]/40 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[#d97706]" />
                  <span>Matter Escalated • Read Only Handover</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-[#191c1e] mt-0.5">
                Technical Handover & Escalated Submission Details
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#777587] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Handover Flow Banner: Submitting Officer -> Next Level */}
          <div className="bg-gradient-to-r from-[#fef3c7] via-[#fffbeb] to-[#f3e8ff] border border-[#fde68a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#fcd34d]/60 pb-2.5">
              <span className="text-[11px] font-bold text-[#92400e] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#d97706]" />
                <span>Official Chain of Custody Handover</span>
              </span>
              <span className="font-mono text-[11px] text-[#78350f]">
                Escalated On: <strong>{submittingOfficer.dateTime}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
              {/* Submitting Officer */}
              <div className="md:col-span-5 bg-white/90 p-3 rounded-lg border border-[#fde68a] space-y-1">
                <span className="text-[10px] font-bold text-[#78350f] uppercase tracking-wider block font-mono">
                  Submitting Officer (Escalated By)
                </span>
                <div className="font-bold text-sm text-[#191c1e]">{submittingOfficer.name}</div>
                <div className="text-[11px] text-[#464555] font-medium">{submittingOfficer.designation}</div>
                <div className="text-[10px] text-[#777587] font-mono">
                  Emp ID: <strong>{submittingOfficer.empId}</strong> • {submittingOfficer.department}
                </div>
              </div>

              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center py-1 md:py-0">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Recipient Authority */}
              <div className="md:col-span-5 bg-white/90 p-3 rounded-lg border border-[#e9d5ff] space-y-1">
                <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider block font-mono">
                  Next Level Authority (Handed Over To)
                </span>
                <div className="font-bold text-sm text-[#191c1e]">{targetRecipient.level}</div>
                <div className="text-[11px] text-[#464555] font-medium">{targetRecipient.name}</div>
                <div className="text-[10px] text-[#777587] font-mono">{targetRecipient.zone}</div>
              </div>
            </div>
          </div>

          {/* Official Reason for Escalation */}
          <div className="bg-[#fff8f6] border border-[#ffdad6] rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
              <span>Official Reason for Escalation</span>
            </span>
            <p className="text-xs font-semibold text-[#191c1e] leading-relaxed bg-white p-3 rounded-lg border border-[#ffdad6]">
              {escalationReason}
            </p>
          </div>

          {/* Technical Remarks & Handover Notes */}
          <div className="bg-[#f8f9fa] border border-[#eceef0] rounded-xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-[#3525cd]" />
              <span>Technical Notes & Engineering Assessment</span>
            </span>
            <p className="text-xs text-[#191c1e] leading-relaxed bg-white p-3 rounded-lg border border-[#eceef0] italic">
              "{technicalRemarks}"
            </p>
          </div>

          {/* Active Technical Request Snapshot Submitted to Next Level */}
          <div className="border border-[#c7c4d8] rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#eceef0] pb-2">
              <span className="text-[11px] font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#3525cd]" />
                <span>Technical Defect Snapshot Submitted to Next Level</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                {issue.activeRequest.priority} Priority
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#eceef0]">
                <span className="text-[10px] text-[#777587] font-semibold block">Station & Section</span>
                <span className="font-bold text-[#191c1e]">{issue.station}</span>
                <span className="text-[10px] text-[#464555] font-mono block">{issue.activeRequest.trackSection}</span>
              </div>
              <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#eceef0]">
                <span className="text-[10px] text-[#777587] font-semibold block">Track & Km Post</span>
                <span className="font-bold text-[#191c1e]">{issue.activeRequest.lineType}</span>
                <span className="text-[10px] text-[#464555] font-mono block">{issue.activeRequest.nearestKmPost}</span>
              </div>
              <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#eceef0]">
                <span className="text-[10px] text-[#777587] font-semibold block">Estimated Fix Window</span>
                <span className="font-bold text-[#191c1e]">{issue.activeRequest.estimatedFixTimeMinutes} Mins</span>
                <span className="text-[10px] text-[#464555] font-mono block">Block Required</span>
              </div>
              <div className="bg-[#f8f9fa] p-2.5 rounded-lg border border-[#eceef0]">
                <span className="text-[10px] text-[#777587] font-semibold block">Department</span>
                <span className="font-bold text-[#191c1e]">{issue.department}</span>
                <span className="text-[10px] text-[#464555] font-mono block">Central Zone</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#777587] font-bold uppercase tracking-wider font-mono">
                Defect Title & Technical Description
              </span>
              <div className="bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0] space-y-1">
                <div className="font-bold text-xs text-[#191c1e]">{issue.activeRequest.title}</div>
                <p className="text-xs text-[#464555] leading-relaxed">{issue.activeRequest.description}</p>
              </div>
            </div>

            {/* Attached Media Photos */}
            {issue.activeRequest.media && issue.activeRequest.media.length > 0 && (
              <div className="pt-2">
                <ComplaintMediaGallery
                  media={issue.activeRequest.media}
                  ticketNo={issue.ticketNo}
                  station={issue.station}
                  title="Forwarded Visual Evidence & Field Photographs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#f8f9fa] border-t border-[#eceef0] flex items-center justify-between">
          <span className="text-[11px] text-[#777587] font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Editing is disabled while matter is in custody of {targetRecipient.level}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
