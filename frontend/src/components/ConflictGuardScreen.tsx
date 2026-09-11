import React, { useState } from "react";
import { ConflictQueueItem, DepartmentType, UserProfile } from "../types";
import {
  ShieldAlert,
  AlertCircle,
  Clock,
  CheckCircle2,
  Zap,
  Activity,
  ArrowUpRight,
  Sparkles,
  Plus,
  Train,
  AlertTriangle,
  Flame,
  ShieldCheck,
  RefreshCw,
  GitMerge,
  Calendar,
  Layers,
  Lock,
  UserCheck,
} from "lucide-react";

interface ConflictGuardScreenProps {
  queueItems: ConflictQueueItem[];
  currentUser?: UserProfile;
  onResolveItem: (itemId: string, assignedSlot: string, actionType?: string) => void;
  onOpenNewBlockModal?: () => void;
}

const ROLE_HIERARCHY_LEVEL: Record<string, number> = {
  worker: 0,
  supervisor: 1,
  zonal_head: 2,
  department_user: 3,
  department_head: 3,
  coa_admin: 4,
};

export const ConflictGuardScreen: React.FC<ConflictGuardScreenProps> = ({
  queueItems,
  currentUser,
  onResolveItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<ConflictQueueItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("Immediate shadow corridor slotted via Dadar Down Fast.");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "conflicts" | "resolved">("all");

  const currentUserLevel = ROLE_HIERARCHY_LEVEL[currentUser?.userRole || "coa_admin"] ?? 4;

  const criticalCount = queueItems.filter((i) => i.priorityNum === 1 && i.slotStatus !== "Assigned").length;
  const pendingCount = queueItems.filter((i) => i.slotStatus !== "Assigned").length;
  const conflictDetectedCount = queueItems.filter((i) => i.schedulingConflict?.hasConflict && i.slotStatus !== "Assigned").length;
  const resolvedCount = queueItems.filter((i) => i.slotStatus === "Assigned").length;

  const filteredItems = queueItems.filter((item) => {
    const isAssigned = item.slotStatus === "Assigned";
    if (activeTab === "all") return !isAssigned;
    if (activeTab === "critical") return item.priorityNum === 1 && !isAssigned;
    if (activeTab === "conflicts") return item.schedulingConflict?.hasConflict && !isAssigned;
    if (activeTab === "resolved") return isAssigned;
    return true;
  });

  const handleOpenModal = (item: ConflictQueueItem) => {
    setSelectedItem(item);
    if (item.recommendedSlot) {
      setResolutionNote(item.recommendedSlot);
    } else {
      setResolutionNote("Immediate emergency track clearance slot granted by Central Dispatch.");
    }
  };

  const handleConfirmResolution = (actionType: string = "assign") => {
    if (!selectedItem) return;
    onResolveItem(selectedItem.id, resolutionNote, actionType);
    setToastMsg(
      actionType === "prevent_shift"
        ? `Scheduling collision prevented for "${selectedItem.description}". Rescheduled to Shadow Window.`
        : `Conflict "${selectedItem.description}" marked ASSIGNED with immediate track clearance.`
    );
    setSelectedItem(null);
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div id="conflictguard-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-mono flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Live Safety & Scheduling Engine
            </span>
            <span className="text-[11px] text-[#777587] font-mono">Central Line SIL-4 Active Queue</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#191c1e] tracking-tight mt-1 flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#ffdad6] text-[#ba1a1a]">
              <ShieldAlert className="w-5 h-5" />
            </span>
            ConflictGuard: Urgency Queue & Conflict Prevention
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#464555] bg-[#f2f4f6] px-3 py-1.5 rounded border border-[#c7c4d8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#006e1c] animate-pulse"></span>
            100% Database Synced (Supabase)
          </span>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 bg-[#dcfce7] border border-[#86efac] text-[#166534] text-[13px] font-medium rounded-lg flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-[12px] font-bold uppercase hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c7c4d8] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
              Critical Conflicts
            </span>
            <span className="text-[10px] font-bold text-[#ba1a1a] bg-[#ffdad6] px-1.5 py-0.5 rounded">
              Priority 1 Active
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[28px] font-mono font-bold text-[#ba1a1a]">
              {criticalCount < 10 ? `0${criticalCount}` : criticalCount}
            </span>
            <span className="text-[11px] text-[#777587]">Emergency Defects</span>
          </div>
        </div>

        <div className="bg-white border border-[#c7c4d8] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#904d00]">
              Pending Assignments
            </span>
            <span className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-1.5 py-0.5 rounded">
              In Evaluation
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[28px] font-mono font-bold text-[#904d00]">
              {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
            </span>
            <span className="text-[11px] text-[#777587]">All Unresolved</span>
          </div>
        </div>

        <div className="bg-white border border-[#c7c4d8] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3525cd]">
              Scheduling Conflicts
            </span>
            <span className="text-[10px] font-bold text-[#3525cd] bg-[#e0e0ff] px-1.5 py-0.5 rounded">
              Auto-Detected
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[28px] font-mono font-bold text-[#3525cd]">
              {conflictDetectedCount < 10 ? `0${conflictDetectedCount}` : conflictDetectedCount}
            </span>
            <span className="text-[11px] text-[#3525cd] font-semibold">Overlaps Prevented</span>
          </div>
        </div>

        <div className="bg-white border border-[#c7c4d8] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006e1c]">
              Resolved / Assigned
            </span>
            <span className="text-[10px] font-bold text-[#006e1c] bg-[#dcfce7] px-1.5 py-0.5 rounded">
              Slotted Active
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[28px] font-mono font-bold text-[#006e1c]">
              {resolvedCount < 10 ? `0${resolvedCount}` : resolvedCount}
            </span>
            <span className="text-[11px] text-[#777587]">Dispatched to Calendar</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#c7c4d8] pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all ${
            activeTab === "all"
              ? "bg-[#3525cd] text-white shadow-xs"
              : "bg-[#f2f4f6] text-[#464555] hover:bg-[#e0e3e5]"
          }`}
        >
          Active Urgency Queue ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab("critical")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeTab === "critical"
              ? "bg-[#ba1a1a] text-white shadow-xs"
              : "bg-[#f2f4f6] text-[#ba1a1a] hover:bg-[#ffdad6]"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Critical / Emergency P1 ({criticalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("conflicts")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeTab === "conflicts"
              ? "bg-[#3525cd] text-white shadow-xs"
              : "bg-[#f2f4f6] text-[#3525cd] hover:bg-[#e0e0ff]"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Scheduling Overlaps ({conflictDetectedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("resolved")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            activeTab === "resolved"
              ? "bg-[#006e1c] text-white shadow-xs"
              : "bg-[#f2f4f6] text-[#006e1c] hover:bg-[#dcfce7]"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Resolved / Assigned ({resolvedCount})</span>
        </button>
      </div>

      {/* Main Urgency Queue Table */}
      <div className="bg-white border border-[#c7c4d8] rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#c7c4d8] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">
              Urgency Resolution Queue & Scheduling Defense
            </h2>
            <span className="text-[11px] text-[#777587]">
              Ranked strictly by safety priority order (P1 &gt; P2 &gt; P3), corridor timetable consequence, and collision prevention
            </span>
          </div>

          <span className="text-[11px] font-mono text-[#777587]">
            Showing {filteredItems.length} active items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#f2f4f6] text-[#464555] uppercase text-[10px] font-bold tracking-wider border-b border-[#c7c4d8]">
                <th className="py-3 px-4 w-[100px]">Priority</th>
                <th className="py-3 px-4 w-[110px]">Dept / Sector</th>
                <th className="py-3 px-4 w-[130px]">Officer Custody</th>
                <th className="py-3 px-4 min-w-[280px]">Conflict &amp; Failure Consequence If Unresolved</th>
                <th className="py-3 px-4 min-w-[190px]">Affected Trains (Priority Order)</th>
                <th className="py-3 px-4 w-[130px]">Conflict Status</th>
                <th className="py-3 px-4 w-[110px]">Timestamp</th>
                <th className="py-3 px-4 text-right w-[110px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#777587] font-mono text-[13px]">
                    No conflict queue items in this view category.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isP1 = item.priorityNum === 1;
                  const isP2 = item.priorityNum === 2;
                  const isAssigned = item.slotStatus === "Assigned";
                  const hasConflict = item.schedulingConflict?.hasConflict;
                  const custodyLevel = item.custodyOfficer?.level ?? 2;
                  const canUserActOnItem = isAssigned || (currentUserLevel >= custodyLevel);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        isP1 && !isAssigned ? "border-l-4 border-l-[#ba1a1a] bg-[#fffcfc]" : ""
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-4 font-mono font-bold align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                            isP1
                              ? "bg-[#ffdad6] text-[#ba1a1a] animate-pulse"
                              : isP2
                              ? "bg-[#ffdcc3] text-[#904d00]"
                              : "bg-[#f2f4f6] text-[#464555]"
                          }`}
                        >
                          {isP1 && <Flame className="w-3 h-3" />}
                          Priority {item.priorityNum}
                        </span>
                        <div className="text-[10px] font-mono text-[#777587] mt-1 uppercase">
                          {item.riskLevel || (isP1 ? "Emergency" : isP2 ? "High Risk" : "Routine")}
                        </div>
                      </td>

                      {/* Dept & Location */}
                      <td className="py-3.5 px-4 font-mono align-top">
                        <div className="font-bold text-[#191c1e]">{item.department}</div>
                        <div className="text-[11px] text-[#5b5a6c] font-medium mt-0.5">{item.areaLoc}</div>
                      </td>

                      {/* Officer Custody */}
                      <td className="py-3.5 px-4 font-mono align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 border ${
                            item.custodyOfficer?.level === 4
                              ? "bg-[#f3e8ff] text-[#7c3aed] border-[#d8b4fe]"
                              : item.custodyOfficer?.level === 3
                              ? "bg-[#e0e0ff] text-[#3525cd] border-[#c7c4d8]"
                              : "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]"
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{item.custodyOfficer?.roleLabel || "Zonal Head"}</span>
                        </span>
                        <div className="text-[10px] text-[#777587] mt-0.5 font-sans">
                          {item.custodyOfficer?.level === 4
                            ? "COA Jurisdiction"
                            : item.custodyOfficer?.level === 3
                            ? "Dept Jurisdiction"
                            : "Zonal Jurisdiction"}
                        </div>
                      </td>

                      {/* Conflict & Consequence If Not Resolved in Time */}
                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <div className="font-semibold text-[#191c1e] text-[13px]">{item.description}</div>

                        {/* Assigned Slot Callout */}
                        {isAssigned && (
                          <div className="p-2 rounded text-[11px] font-sans leading-relaxed border bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]">
                            <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                              Sanctioned Possession Slot:
                            </span>
                            <span className="font-mono font-bold">
                              {item.resolutionNotes || item.recommendedSlot || "Immediate Emergency Possession Slotted"}
                            </span>
                          </div>
                        )}

                        {/* Consequence callout */}
                        {!isAssigned && item.consequenceIfNotResolved && (
                          <div
                            className={`p-2 rounded text-[11px] font-sans leading-relaxed border ${
                              isP1
                                ? "bg-[#fff0ed] text-[#ba1a1a] border-[#ffdad6]"
                                : isP2
                                ? "bg-[#fff8f0] text-[#904d00] border-[#ffdcc3]"
                                : "bg-[#f8fafc] text-[#464555] border-[#c7c4d8]"
                            }`}
                          >
                            <span className="font-bold uppercase tracking-wider block text-[10px] mb-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Issue If Not Resolved in Time:
                            </span>
                            <span>{item.consequenceIfNotResolved}</span>
                          </div>
                        )}
                      </td>

                      {/* Affected Trains (Priority Tier Order) */}
                      <td className="py-3.5 px-4 align-top">
                        {item.affectedTrains && item.affectedTrains.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-[#777587] uppercase font-bold">
                              {item.affectedTrains.length} Timetable Trains:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.affectedTrains.map((train, tIdx) => {
                                const isTier1 = train.priorityTier === 1;
                                const isTier2 = train.priorityTier === 2;
                                return (
                                  <span
                                    key={tIdx}
                                    title={`${train.trainName} (${train.scheduledSlot}) - ${train.impact}`}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 border ${
                                      isTier1
                                        ? "bg-[#e0e0ff] text-[#3525cd] border-[#c7c4d8]"
                                        : isTier2
                                        ? "bg-[#ffdcc3] text-[#904d00] border-[#ffdcc3]"
                                        : "bg-[#f2f4f6] text-[#464555] border-[#eceef0]"
                                    }`}
                                  >
                                    <Train className="w-2.5 h-2.5" />
                                    <span>{train.trainNo}</span>
                                    <span className="text-[9px] opacity-80">({train.status})</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[#777587]">0 Timetable Trains</span>
                        )}
                      </td>

                      {/* Slot & Scheduling Conflict Status */}
                      <td className="py-3.5 px-4 align-top space-y-1">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
                            <CheckCircle2 className="w-3 h-3" />
                            Assigned &amp; Slotted
                          </span>
                        ) : isP1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                            <AlertCircle className="w-3 h-3" />
                            Immediate Block
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef9c3] text-[#a16207]">
                            <Clock className="w-3 h-3" />
                            {item.slotStatus}
                          </span>
                        )}

                        {hasConflict && !isAssigned && (
                          <div className="text-[10px] font-mono font-bold text-[#3525cd] bg-[#e0e0ff] px-1.5 py-0.5 rounded border border-[#c7c4d8] flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            Overlap Flagged
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[#777587] text-[11px] align-top">
                        {item.timestamp}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right align-top">
                        {isAssigned ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dcfce7] text-[#15803d] border border-[#86efac] rounded text-[11px] font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
                            <span>Sanctioned</span>
                          </div>
                        ) : canUserActOnItem ? (
                          <button
                            id={`review-conflict-${item.id}`}
                            onClick={() => handleOpenModal(item)}
                            className="px-3 py-1.5 bg-[#3525cd] text-white text-[11px] font-bold uppercase tracking-wider rounded hover:bg-[#4f46e5] active:scale-[0.98] transition-all inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Review</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            id={`view-conflict-${item.id}`}
                            onClick={() => handleOpenModal(item)}
                            className="px-2.5 py-1 bg-[#fff0ed] text-[#ba1a1a] border border-[#ffdad6] rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 hover:bg-[#ffdad6] transition-all"
                            title={`Escalated to ${item.custodyOfficer?.roleLabel || 'Senior Officer'}. Only ${item.custodyOfficer?.roleLabel || 'Senior Officer'} or COA can approve.`}
                          >
                            <Lock className="w-3 h-3 text-[#ba1a1a]" />
                            <span>Locked</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#f8fafc] border-t border-[#c7c4d8] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#777587]">
          <span>Central Railway Multi-Tier Safety Integrity Level 4 (SIL-4) Monitored</span>
          <span className="text-[#3525cd] font-semibold">Automated AI Dispatch Fallback &amp; Schedule Defense Active</span>
        </div>
      </div>

      {/* Detailed Review & Conflict Prevention Modal */}
      {selectedItem && (() => {
        const isSelectedAssigned = selectedItem.slotStatus === "Assigned";
        const selectedCustodyLevel = selectedItem.custodyOfficer?.level ?? 2;
        const canUserActOnSelectedItem = isSelectedAssigned || (currentUserLevel >= selectedCustodyLevel);

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white border border-[#c7c4d8] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#eceef0] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        selectedItem.priorityNum === 1
                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                          : selectedItem.priorityNum === 2
                          ? "bg-[#ffdcc3] text-[#904d00]"
                          : "bg-[#f2f4f6] text-[#464555]"
                      }`}
                    >
                      Priority {selectedItem.priorityNum} Conflict
                    </span>
                    <span className="text-[11px] font-mono text-[#777587]">ID: {selectedItem.id.slice(0, 8)}</span>
                    <span className="text-[11px] font-mono font-bold text-[#3525cd] bg-[#e0e0ff] px-2 py-0.5 rounded">
                      Custody: {selectedItem.custodyOfficer?.roleLabel || "Zonal Head"}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#191c1e] mt-1">{selectedItem.description}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-[#777587] hover:text-[#191c1e] text-[20px] font-bold p-1 rounded hover:bg-[#f2f4f6]"
                >
                  ✕
                </button>
              </div>

              {/* Hierarchical Authority Restriction Alert */}
              {!canUserActOnSelectedItem && (
                <div className="p-3.5 bg-[#fff0ed] border border-[#ffdad6] rounded-lg flex items-start gap-2.5 text-[12px] text-[#ba1a1a]">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" />
                  <div>
                    <div className="font-bold uppercase tracking-wider font-mono text-[11px]">
                      Read-Only View: Escalated to {selectedItem.custodyOfficer?.roleLabel || "Senior Authority"}
                    </div>
                    <p className="mt-0.5 text-[#191c1e] text-[12px] leading-relaxed">
                      This defect has been forwarded to <strong>{selectedItem.custodyOfficer?.roleLabel}</strong>. Slot review and possession authorization is strictly restricted to <strong>{selectedItem.custodyOfficer?.roleLabel}</strong> or <strong>COA Central Dispatch</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* DB Location & Reporting Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8f9fc] p-3.5 rounded-lg border border-[#c7c4d8] text-[12px]">
                <div>
                  <span className="text-[#777587] text-[11px] block font-semibold">Location / Node:</span>
                  <span className="font-mono font-bold text-[#191c1e]">{selectedItem.areaLoc}</span>
                </div>
                <div>
                  <span className="text-[#777587] text-[11px] block font-semibold">Requesting Dept:</span>
                  <span className="font-mono font-bold text-[#3525cd]">{selectedItem.department}</span>
                </div>
                <div>
                  <span className="text-[#777587] text-[11px] block font-semibold">Reported Timestamp:</span>
                  <span className="font-mono text-[#191c1e]">{selectedItem.timestamp}</span>
                </div>
              </div>

              {/* Prominent Failure Consequence Section */}
              <div className="p-4 rounded-lg bg-[#fff0ed] border border-[#ffdad6] space-y-1.5">
                <div className="flex items-center gap-2 text-[#ba1a1a] font-bold uppercase text-[12px] tracking-wider font-mono">
                  <Flame className="w-4 h-4" />
                  <span>Operational Failure Consequence (If Not Resolved In Time)</span>
                </div>
                <p className="text-[13px] text-[#191c1e] leading-relaxed font-medium">
                  {selectedItem.consequenceIfNotResolved ||
                    "Imminent speed restriction and cascading block delay on downstream train paths."}
                </p>
              </div>

              {/* Corridor Timetable Trains in Priority Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-[#464555] flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-[#3525cd]" />
                    <span>Corridor Timetable Trains (Ranked by Priority Order)</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#777587]">
                    {selectedItem.affectedTrains?.length || 0} scheduled services
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-[#c7c4d8] rounded-lg p-2 bg-[#fafafa]">
                  {selectedItem.affectedTrains && selectedItem.affectedTrains.length > 0 ? (
                    selectedItem.affectedTrains.map((train, idx) => {
                      const isTier1 = train.priorityTier === 1;
                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded border border-[#eceef0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isTier1 ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#e0e0ff] text-[#3525cd]"
                                }`}
                              >
                                Tier {train.priorityTier} Priority
                              </span>
                              <span className="font-bold text-[#191c1e] text-[12px] font-mono">
                                {train.trainNo} – {train.trainName}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#5b5a6c] mt-0.5 font-sans">{train.impact}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-[11px] font-bold text-[#191c1e]">{train.scheduledSlot}</div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                                train.status === "Cancelled"
                                ? "bg-[#ffdad6] text-[#ba1a1a]"
                                : train.status === "Rescheduled"
                                ? "bg-[#ffdcc3] text-[#904d00]"
                                : "bg-[#dcfce7] text-[#15803d]"
                              }`}
                            >
                              {train.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-[#777587] font-mono text-[12px]">
                      No timetable trains directly clashing with this window.
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduling Conflict Detection & Prevention Panel */}
              {selectedItem.schedulingConflict?.hasConflict && (
                <div className="p-3.5 bg-[#e0e0ff] border border-[#c7c4d8] rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#3525cd] font-bold uppercase text-[11px] tracking-wider font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Scheduling Collision Detected: {selectedItem.schedulingConflict.conflictType}</span>
                  </div>
                  <p className="text-[12px] text-[#191c1e]">
                    {selectedItem.schedulingConflict.conflictDetails}
                  </p>
                  <div className="text-[11px] font-bold text-[#3525cd] flex items-center gap-1">
                    <span>Prevention Strategy:</span>
                    <span>{selectedItem.schedulingConflict.preventionAction}</span>
                  </div>
                </div>
              )}

              {/* Dispatch Action Notes */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                  AI Recommendation &amp; Dispatch Clearance Slot
                </label>
                <textarea
                  rows={2}
                  disabled={!canUserActOnSelectedItem}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className={`w-full border rounded-lg p-2.5 text-[12px] font-mono ${
                    canUserActOnSelectedItem
                      ? "bg-[#f2f4f6] border-[#c7c4d8] text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white"
                      : "bg-[#fafafa] border-[#e2e4e7] text-[#777587] cursor-not-allowed"
                  }`}
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eceef0]">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] text-[12px] font-bold uppercase rounded-md hover:bg-[#e0e3e5]"
                >
                  Close
                </button>

                {canUserActOnSelectedItem ? (
                  <div className="flex items-center gap-2">
                    {selectedItem.schedulingConflict?.hasConflict && (
                      <button
                        onClick={() => handleConfirmResolution("prevent_shift")}
                        className="px-3.5 py-1.5 bg-[#3525cd] text-white text-[12px] font-bold uppercase rounded-md hover:bg-[#4f46e5] flex items-center gap-1.5 shadow-xs"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Auto-Shift &amp; Prevent Collision</span>
                      </button>
                    )}

                    <button
                      id="confirm-resolution-btn"
                      onClick={() => handleConfirmResolution("assign")}
                      className="px-4 py-1.5 bg-[#006e1c] text-white text-[12px] font-bold uppercase rounded-md hover:bg-[#005313] flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Grant &amp; Assign Possession Slot</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#ba1a1a] bg-[#fff0ed] px-3 py-1.5 rounded border border-[#ffdad6]">
                    <Lock className="w-3.5 h-3.5 text-[#ba1a1a]" />
                    <span>Authority Restricted to {selectedItem.custodyOfficer?.roleLabel || "Senior Authority"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
