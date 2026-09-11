import React, { useState, useEffect, useCallback } from "react";
import { WhySlotDetail, UserRole, UserProfile } from "../types";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  Train,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
  Database,
  Layers,
  Lock,
} from "lucide-react";

interface WhySlotScreenProps {
  slots?: WhySlotDetail[];
  userRole?: UserRole | string;
  currentUser?: UserProfile;
  onApproveSlot: (slotCode: string, calendarBlock?: any) => void;
  onRejectSlot: (slotCode: string) => void;
  onNavigateToWhatIf?: (slotCode: string) => void;
}

export const WhySlotScreen: React.FC<WhySlotScreenProps> = ({
  slots: initialSlots = [],
  userRole = "coa_admin",
  currentUser,
  onApproveSlot,
  onRejectSlot,
  onNavigateToWhatIf,
}) => {
  const [dbSlots, setDbSlots] = useState<WhySlotDetail[]>(initialSlots);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch AI proposals from database (/api/coa/whyslot-proposals)
  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/coa/whyslot-proposals");
      const data = await res.json();
      if (data.success && Array.isArray(data.proposals)) {
        setDbSlots(data.proposals);
        if (data.proposals.length > 0 && !selectedSlotId) {
          setSelectedSlotId(data.proposals[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch /api/coa/whyslot-proposals:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSlotId]);

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 5000);
    return () => clearInterval(interval);
  }, [fetchProposals]);

  useEffect(() => {
    if (dbSlots.length > 0 && (!selectedSlotId || !dbSlots.some((s) => s.id === selectedSlotId))) {
      setSelectedSlotId(dbSlots[0].id);
    }
  }, [dbSlots, selectedSlotId]);

  const currentSlot = dbSlots.find((s) => s.id === selectedSlotId) || dbSlots[0];

  const handleApprove = async (slot: WhySlotDetail) => {
    try {
      const res = await fetch(`/api/coa/whyslot-proposals/${slot.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.userRole || (userRole as string) || "coa_admin",
          "x-user-empid": currentUser?.empId || "",
        },
        body: JSON.stringify({
          slotCode: slot.slotCode,
          location: slot.location,
          timeWindow: slot.timeWindow,
          date: slot.scheduledDate || "2026-09-08",
          workName: slot.isCluster
            ? `[CLUSTER] Joint Possession: ${slot.departmentLabel || slot.departments?.join(' + ')} (${slot.location})`
            : `AI Slot ${slot.slotCode}: ${slot.location}`,
          department: slot.departmentLabel || (slot.departments && slot.departments.length > 0 ? slot.departments.join(' + ') : "Engineering Department"),
          departments: slot.departments,
          isCluster: slot.isCluster,
          clusterId: slot.clusterId,
          priority: slot.priority,
          complaintId: (slot as any).complaintId,
          complaintIds: slot.complaintIds,
          trainsAffected: slot.trainsAffectedCount,
        }),
      });
      const data = await res.json();
      setDbSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: "approved" as const } : s))
      );
      onApproveSlot(slot.slotCode, data.calendarBlock);
      setActionFeedback(
        slot.isCluster
          ? `Clustered Task ${slot.slotCode} (${slot.departmentLabel}) has been APPROVED and scheduled in timetable.`
          : `Slot ${slot.slotCode} has been APPROVED and added to Central Line Timetable.`
      );
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e) {
      console.warn("Approve error:", e);
    }
  };

  const handleReject = async (slot: WhySlotDetail) => {
    try {
      await fetch(`/api/coa/whyslot-proposals/${slot.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Rejected by COA traffic controller",
        }),
      });
      setDbSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: "rejected" as const } : s))
      );
      onRejectSlot(slot.slotCode);
      setActionFeedback(`Slot ${slot.slotCode} has been REJECTED. Recalculating alternatives.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e) {
      console.warn("Reject error:", e);
    }
  };

  if (!currentSlot) {
    return (
      <div id="whyslot-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#e2dfff] text-[#3525cd] font-mono">
                Explainable AI (XAI)
              </span>
              <span className="text-[11px] text-[#777587] font-mono">Central Railway Dispatch Intelligence</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#191c1e] tracking-tight mt-1 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-[#e2dfff] text-[#3525cd]">
                <Brain className="w-5 h-5" />
              </span>
              WhySlot: AI Slot Reasoning Engine
            </h1>
          </div>
        </div>

        <div className="bg-white border border-[#c7c4d8] rounded-xl p-12 text-center max-w-xl mx-auto space-y-4 my-8 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#e2dfff] text-[#3525cd] flex items-center justify-center">
            <Brain className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#191c1e]">No Active AI Slot Proposals</h3>
          <p className="text-xs text-[#464555] leading-relaxed">
            All current maintenance corridors are synchronized in the database.
          </p>
          <button
            onClick={fetchProposals}
            className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-md cursor-pointer hover:bg-[#2515b0]"
          >
            Refresh Database Proposals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="whyslot-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="p-3 bg-[#dcfce7] border border-[#86efac] text-[#166534] rounded-lg text-xs font-mono flex items-center justify-between animate-fadeIn">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Main Two-Column Layout (Matching User Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: PLANNED AI SLOT PROPOSALS */}
        <div className="lg:col-span-4 bg-white border border-[#c7c4d8] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-[#c7c4d8]/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777587]">
              Planned AI Slot Proposals
            </span>
            <button
              onClick={fetchProposals}
              disabled={isLoading}
              className="text-[#777587] hover:text-[#191c1e] p-1 cursor-pointer"
              title="Refresh from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-3">
            {dbSlots.map((slot) => {
              const isSelected = slot.id === currentSlot.id;
              const isHigh = slot.priority.toUpperCase().includes("HIGH") || slot.priority.toUpperCase().includes("CRITICAL");
              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-4 rounded-xl transition-all cursor-pointer border-2 ${
                    isSelected
                      ? "border-[#3525cd] bg-[#fdfdff] shadow-xs"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-[#191c1e] tracking-tight">
                        {slot.slotCode}
                      </span>
                      {slot.isCluster && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-mono flex items-center gap-1 shadow-2xs">
                          <Layers className="w-2.5 h-2.5" />
                          CLUSTER
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                        isHigh
                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                          : "bg-[#e2dfff] text-[#3525cd]"
                      }`}
                    >
                      {slot.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Department Tags */}
                  {slot.departments && slot.departments.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-1.5">
                      {slot.departments.map((d) => {
                        const isTrd = d.toLowerCase().includes("trd") || d.toLowerCase().includes("ohe") || d.toLowerCase().includes("electrical");
                        const isSnt = d.toLowerCase().includes("s&t") || d.toLowerCase().includes("signal");
                        return (
                          <span
                            key={d}
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                              isTrd
                                ? "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]"
                                : isSnt
                                ? "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]"
                                : "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                            }`}
                          >
                            {d}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3525cd] font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{slot.scheduledDateFormatted || slot.scheduledDate || "08 Sep 2026 (Tuesday)"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#777587] mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.timeWindow} (IST)</span>
                  </div>

                  <div className="text-[13px] font-bold text-[#191c1e] mb-3">
                    {slot.location}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-[11px] font-mono font-bold">
                    <span className="text-[#16a34a]">
                      Score: {slot.score}/100
                    </span>
                    <span
                      className={`uppercase tracking-wider text-[10px] ${
                        slot.status === "approved"
                          ? "text-[#16a34a]"
                          : slot.status === "rejected"
                          ? "text-[#ba1a1a]"
                          : "text-[#3525cd]"
                      }`}
                    >
                      {slot.status === "approved"
                        ? "APPROVED"
                        : slot.status === "rejected"
                        ? "REJECTED"
                        : "PENDING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI RECOMMENDATION DETAILS */}
        <div className="lg:col-span-8 bg-white border border-[#c7c4d8] rounded-2xl p-6 shadow-xs space-y-6">
          {/* Header Row: Title & Score Pill */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#c7c4d8]/40 pb-5">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#777587] mb-1">
                AI Recommendation Details
              </span>
              <h2 className="text-[22px] font-bold text-[#191c1e] tracking-tight">
                Optimization Reasoning: {currentSlot.slotCode}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e2dfff] text-[#3525cd] font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentSlot.scheduledDateFormatted || currentSlot.scheduledDate || "08 Sep 2026 (Tuesday)"}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#475569] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#3525cd]" />
                  {currentSlot.timeWindow} IST (Indian Standard Time)
                </span>
              </div>
            </div>

            {/* Score & Confidence Badge */}
            <div className="flex items-center border border-[#c7c4d8] rounded-xl px-4 py-2 bg-white shadow-2xs self-start divide-x divide-[#c7c4d8]">
              <div className="pr-4">
                <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#777587]">
                  AI Score
                </span>
                <span className="text-[20px] font-bold text-[#16a34a] font-mono leading-none mt-0.5 block">
                  {currentSlot.score}<span className="text-[13px] text-[#777587]">/100</span>
                </span>
              </div>
              <div className="pl-4">
                <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#777587]">
                  Confidence
                </span>
                <span className="text-[15px] font-bold text-[#3525cd] font-mono leading-none mt-1 block">
                  {currentSlot.confidence || "High"}
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Department Clustered Slot Banner */}
          {currentSlot.isCluster && (
            <div className="bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-[#fdf4ff] border-2 border-[#818cf8] p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-[#4f46e5] text-white shadow-xs">
                    <Layers className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] block font-mono">
                      Multi-Department Joint Clustered Possession
                    </span>
                    <h3 className="text-[15px] font-extrabold text-[#1e1b4b]">
                      Synchronized Departments: {currentSlot.departmentLabel || currentSlot.departments?.join(" + ")}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-[11px] font-mono font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac] px-2.5 py-1 rounded-md">
                    ⚡ 2-in-1 Consolidated Slot
                  </span>
                </div>
              </div>

              {/* Combined Department Tasks List */}
              {currentSlot.combinedTasks && currentSlot.combinedTasks.length > 0 && (
                <div className="pt-2 border-t border-[#c7d2fe]/70 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338ca] block font-mono">
                    Concurrent Work Items Executed in Single Block:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentSlot.combinedTasks.map((task, idx) => {
                      const cleanPri = (task.priority || "High").split(/[\.\,\s]/)[0];
                      const cleanTitle = (task.title || "").replace(/\[.*?\]/g, "").trim();
                      const isTrd = task.department.toLowerCase().includes("trd") || task.department.toLowerCase().includes("ohe") || task.department.toLowerCase().includes("electrical");
                      const isSnt = task.department.toLowerCase().includes("s&t") || task.department.toLowerCase().includes("signal");

                      return (
                        <div
                          key={idx}
                          className="bg-white/95 border border-[#c7d2fe] p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs overflow-hidden"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded shrink-0 border ${
                                isTrd
                                  ? "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]"
                                  : isSnt
                                  ? "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]"
                                  : "bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]"
                              }`}
                            >
                              {task.department}
                            </span>
                            <span className="text-xs font-bold text-[#1e293b] truncate" title={cleanTitle}>
                              {cleanTitle}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 uppercase border ${
                              cleanPri.toLowerCase().includes("emerg")
                                ? "bg-red-100 text-red-800 border-red-200"
                                : cleanPri.toLowerCase().includes("high")
                                ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                                : "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]"
                            }`}
                          >
                            {cleanPri}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3 Metrics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. TRAINS AFFECTED */}
            <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[#777587]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">
                    Trains Affected
                  </span>
                  <Train className="w-4 h-4 text-[#777587]" />
                </div>
                <div className="text-[36px] font-bold text-[#191c1e] font-mono mt-1 leading-none">
                  {currentSlot.trainsAffectedCount || currentSlot.trainsAffectedList?.length || 3}
                </div>
              </div>

              {/* Train Status Pills */}
              <div className="space-y-1.5 pt-1">
                {(currentSlot.trainsAffectedList || [
                  { name: "12124 Deccan Qn", status: "Rescheduled", color: "secondary" },
                  { name: "11009 Sinhagad", status: "Regulated", color: "primary" },
                  { name: "Local 90432", status: "Cancelled", color: "error" },
                ]).slice(0, 3).map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border border-[#e2e8f0] rounded px-2 py-1 bg-[#f8fafc] text-[11px]"
                  >
                    <span className="font-mono font-medium text-[#464555] truncate max-w-[85px]">
                      {t.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                        t.status === "Cancelled" || t.color === "error"
                          ? "bg-[#fee2e2] text-[#b91c1c]"
                          : t.status === "Rescheduled" || t.color === "secondary"
                          ? "bg-[#fef3c7] text-[#b45309]"
                          : "bg-[#e0e7ff] text-[#3730a3]"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TIME EFFICIENCY */}
            <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[#15803d]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#15803d]">
                    Time Efficiency
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#15803d]" />
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[32px] font-bold text-[#15803d] font-mono leading-none">
                    +{currentSlot.netGainMinutes || 33}m
                  </span>
                  <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-bold font-mono px-2 py-0.5 rounded">
                    +85% Net
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f1f5f9] space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Saved Delay:</span>
                  <span className="font-bold text-[#15803d]">+{currentSlot.savedMinutes || 45}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Local Shunting:</span>
                  <span className="font-bold text-[#b91c1c]">-{currentSlot.wastedMinutes || 12}m</span>
                </div>
              </div>
            </div>

            {/* 3. TRAVELER IMPACT */}
            <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[#777587]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider">
                    Traveler Impact
                  </span>
                  <Users className="w-4 h-4 text-[#777587]" />
                </div>

                <div className="text-[24px] font-bold text-[#854d0e] mt-1 leading-none">
                  {currentSlot.travelerImpactLevel || "Moderate"}
                </div>
              </div>

              <p className="text-[11.5px] text-[#464555] leading-relaxed line-clamp-4">
                {currentSlot.travelerImpactText ||
                  "Cancellation of Local 90432 will increase platform density at Dadar by an estimated 15% between 14:15 and 14:30. Surrounding services have capacity to absorb the overflow within 20 minutes."}
              </p>
            </div>
          </div>

          {/* OPTIMIZATION JUSTIFICATION Container */}
          <div className="bg-white border border-[#c7c4d8] rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#191c1e]">
              <ShieldCheck className="w-5 h-5 text-[#3525cd]" />
              <span className="text-[12.5px] font-bold uppercase tracking-wider">
                Optimization Justification
              </span>
            </div>

            <div className="space-y-3 text-[13px] text-[#334155] leading-relaxed">
              {(currentSlot.justificationParagraphs && currentSlot.justificationParagraphs.length > 0) ? (
                currentSlot.justificationParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))
              ) : (
                <>
                  <p>
                    The proposed maintenance slot leverages a historical lull in freight traffic on the down line between CSMT and DR. By shifting the block start time forward by 15 minutes, we avoid compounding delays on the 12124 Deccan Queen.
                  </p>
                  <p>
                    Alternative scenarios (Slot-B, Slot-C) were evaluated. While they avoid cancelling the local service, they increase the overall track occupation time by 40 minutes due to necessary switching operations, leading to a cascading delay effect entering the evening peak hours.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-[#c7c4d8]/50 space-y-4">
            <div className="text-[11px] font-mono text-[#777587]">
              Central Line AI Rule-Set v4.2 • Verification Protocol: Active
            </div>

            {currentSlot.isCluster && !(userRole === "coa_admin" || userRole === "coa") ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#e2e8f0] text-[#475569]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block font-mono">
                      Approval Authority: COA Control Only
                    </span>
                    <p className="text-xs font-semibold text-[#1e293b]">
                      This multi-department clustered possession is visible to all departments, but can only be sanctioned by <strong>COA Traffic Controller</strong>.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1] text-xs font-mono font-bold whitespace-nowrap self-start sm:self-center">
                  Awaiting COA Sanction
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  id="reject-slot-btn"
                  onClick={() => handleReject(currentSlot)}
                  disabled={currentSlot.status === "rejected"}
                  className={`px-5 py-2.5 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentSlot.status === "rejected"
                      ? "bg-[#f8fafc] text-[#94a3b8] border border-[#cbd5e1] cursor-not-allowed"
                      : "border-2 border-[#ba1a1a] text-[#ba1a1a] bg-white hover:bg-[#fff5f5] active:scale-[0.98]"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>{currentSlot.status === "rejected" ? "Slot Rejected" : "Reject Slot"}</span>
                </button>

                <button
                  id="approve-slot-btn"
                  onClick={() => handleApprove(currentSlot)}
                  disabled={currentSlot.status === "approved"}
                  className={`px-6 py-2.5 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentSlot.status === "approved"
                      ? "bg-[#16a34a] text-white opacity-80 cursor-not-allowed"
                      : "bg-[#047857] hover:bg-[#065f46] text-white shadow-xs active:scale-[0.98]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {currentSlot.status === "approved"
                      ? (currentSlot.isCluster ? "Clustered Slot Approved & Scheduled" : "Slot Approved & Scheduled")
                      : (currentSlot.isCluster
                        ? `Approve Clustered Slot (${currentSlot.departments?.join(' + ') || 'Joint'}) on ${currentSlot.scheduledDateFormatted?.split(' ')[0] || '08'} ${currentSlot.scheduledDateFormatted?.split(' ')[1] || 'Sep'} (IST)`
                        : `Approve & Schedule on ${currentSlot.scheduledDateFormatted?.split(' ')[0] || '08'} ${currentSlot.scheduledDateFormatted?.split(' ')[1] || 'Sep'} (IST)`)}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
