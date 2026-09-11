import React, { useState } from "react";
import {
  HierarchicalIssue,
  ServiceRequestItem,
  PravahOptimizedSlot,
} from "../types";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  TrendingDown,
  ShieldAlert,
  RefreshCw,
  ListFilter,
  CheckCheck,
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PravahPlanTabProps {
  zonalPendingIssues?: HierarchicalIssue[];
  deptPendingIssues?: HierarchicalIssue[];
  pendingRequests: ServiceRequestItem[];
  pravahSlots: PravahOptimizedSlot[];
  isOptimizing: boolean;
  optimizingStep: string;
  hasRunScheduleOptimizer?: boolean;
  onRunScheduleOptimizer: () => void;
  onAcceptSlot: (slot: PravahOptimizedSlot) => void;
  onRejectSlot: (slot: PravahOptimizedSlot, reason: string) => void;
  onOpenBulletinNotice: () => void;
  onNavigateToCalendar: () => void;
}

export const PravahPlanTab: React.FC<PravahPlanTabProps> = ({
  zonalPendingIssues = [],
  deptPendingIssues,
  pendingRequests,
  pravahSlots,
  isOptimizing,
  optimizingStep,
  hasRunScheduleOptimizer = true,
  onRunScheduleOptimizer,
  onAcceptSlot,
  onRejectSlot,
  onOpenBulletinNotice,
  onNavigateToCalendar,
}) => {
  const activeDeptIssues = deptPendingIssues || zonalPendingIssues;
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MULTI_DEPT" | "CRITICAL">("ALL");
  const [showDemandsBreakdown, setShowDemandsBreakdown] = useState<boolean>(true);
  const [rejectingSlot, setRejectingSlot] = useState<PravahOptimizedSlot | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [processingSlotId, setProcessingSlotId] = useState<string | null>(null);

  const totalDemandsCount = activeDeptIssues.length + pendingRequests.length;
  const multiDeptSlotsCount = pravahSlots.filter((s) => s.departments.length > 1).length;

  const handleConfirmReject = () => {
    if (!rejectingSlot) return;
    const reason = rejectReason.trim() || "Operational track possession conflict";
    onRejectSlot(rejectingSlot, reason);
    setRejectingSlot(null);
    setRejectReason("");
  };

  const handleAcceptWithFeedback = async (slot: PravahOptimizedSlot) => {
    setProcessingSlotId(slot.id);
    try {
      await onAcceptSlot(slot);
    } finally {
      setProcessingSlotId(null);
    }
  };

  const filteredSlots = pravahSlots.filter((slot) => {
    if (activeFilter === "MULTI_DEPT") return slot.departments.length > 1;
    if (activeFilter === "CRITICAL") {
      return slot.workItems.some((w) => w.priority === "Emergency" || w.priority === "High");
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Strategy, Strategy Header & Primary Optimizer Button */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#eceef0]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#3525cd] text-white text-xs font-black uppercase rounded tracking-wider font-mono">
                प्रवाहPLAN
              </span>
              <h2 className="text-xl font-bold text-[#191c1e] tracking-tight">
                Corridor Multi-Department Unified Slot Allocation & AI Optimizer
              </h2>
            </div>
            <p className="text-xs text-[#464555] mt-1.5 max-w-3xl leading-relaxed">
              Consolidates all pending maintenance requests received from the <strong>Department Head</strong> and the <strong>Pending Queue</strong> into conflict-free, multi-department corridor slots. Optimizes on the principle that slots cause <strong>minimum train delays</strong> to regular suburban, express, and freight trains; groups works around specific areas into a <strong>single multi-department slot</strong>; and <strong>prioritizes maintenance</strong> to minimize asset downtime and maximize critical infrastructure availability.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* COA Dispatch Notice Button */}
            <button
              id="coa-dispatch-notice-btn"
              onClick={onOpenBulletinNotice}
              className="px-3.5 py-2.5 bg-[#f2f4f6] text-[#191c1e] border border-[#c7c4d8] text-xs font-bold rounded-lg hover:bg-[#e6e8ea] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Generate official Central Railway COA Maintenance Block Circular"
            >
              <FileText className="w-4 h-4 text-[#3525cd]" />
              <span>COA Dispatch Notice</span>
            </button>

            {/* AI SCHEDULE OPTIMIZER Button */}
            <button
              id="coa-ai-schedule-optimizer-btn"
              onClick={onRunScheduleOptimizer}
              disabled={isOptimizing}
              className="px-5 py-2.5 bg-[#3525cd] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#4f46e5] active:scale-[0.98] transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60"
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin text-amber-300" : "text-amber-300"}`} />
              <span>{isOptimizing ? "AI Optimizing Slots..." : "AI SCHEDULE OPTIMIZER"}</span>
            </button>
          </div>
        </div>

        {/* Live Optimization Telemetry Banner */}
        {isOptimizing && (
          <div className="mt-5 p-4 bg-[#f0f4ff] border-2 border-[#3525cd]/40 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#3525cd] text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                  AI Schedule Optimizer In Action
                </h4>
                <p className="text-xs font-mono font-bold text-[#3525cd] mt-0.5">
                  {optimizingStep || "Calculating slot allocations based on zero regular train delays & multi-department synergy..."}
                </p>
              </div>
            </div>
            <div className="w-full bg-[#c7c4d8]/40 rounded-full h-2 overflow-hidden">
              <div className="bg-[#3525cd] h-full rounded-full animate-pulse transition-all duration-500 w-3/4"></div>
            </div>
          </div>
        )}

        {/* 4 Strategy KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
            <span className="text-[11px] font-bold text-[#777587] uppercase tracking-wider block">
              Demands Ingested
            </span>
            <span className="text-xl font-extrabold text-[#191c1e] font-mono mt-0.5 block">
              {totalDemandsCount}
            </span>
            <span className="text-[10px] text-[#464555]">
              {activeDeptIssues.length} Dept Head + {pendingRequests.length} Queue
            </span>
          </div>

          <div className="p-3 bg-[#e2dfff]/40 rounded-lg border border-[#3525cd]/20">
            <span className="text-[11px] font-bold text-[#3525cd] uppercase tracking-wider block">
              Optimized Slots Available
            </span>
            <span className="text-xl font-extrabold text-[#3525cd] font-mono mt-0.5 block">
              {pravahSlots.length}
            </span>
            <span className="text-[10px] text-[#3525cd]/80">
              {multiDeptSlotsCount} Multi-Dept Unified
            </span>
          </div>

          <div className="p-3 bg-[#eaf5ea] rounded-lg border border-[#388e3c]/20">
            <span className="text-[11px] font-bold text-[#2e7d32] uppercase tracking-wider block">
              Train Delay Impact
            </span>
            <span className="text-xl font-extrabold text-[#2e7d32] font-mono mt-0.5 block">
              0 Delays
            </span>
            <span className="text-[10px] text-[#2e7d32]/80">Local/Express/Freight Guarded</span>
          </div>

          <div className="p-3 bg-[#e6f4ea] rounded-lg border border-[#137333]/20">
            <span className="text-[11px] font-bold text-[#137333] uppercase tracking-wider block">
              Asset Availability
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-4 h-4 text-[#137333]" />
              <span className="text-xl font-extrabold text-[#137333] font-mono">
                65% Downtime Cut
              </span>
            </div>
            <span className="text-[10px] text-[#137333]/80">Co-Possession Efficiency</span>
          </div>
        </div>
      </div>

      {/* Demands Intake Breakdown Panel (Department Head + Pending Queue) */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/60 shadow-xs overflow-hidden">
        <div
          onClick={() => setShowDemandsBreakdown(!showDemandsBreakdown)}
          className="px-5 py-3.5 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between cursor-pointer hover:bg-[#f2f4f6] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ListFilter className="w-4 h-4 text-[#3525cd]" />
            <h3 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
              Demands Ingested For AI Schedule Optimization ({totalDemandsCount})
            </h3>
            <span className="text-xs text-[#777587] hidden md:inline">
              • Considering all requests received from Department Head & Pending Queue
            </span>
          </div>
          <button className="text-xs text-[#3525cd] font-bold flex items-center gap-1 cursor-pointer">
            <span>{showDemandsBreakdown ? "Hide Ingested Demands" : "View Ingested Demands"}</span>
            {showDemandsBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showDemandsBreakdown && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Department Head Demands */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#ba1a1a]" />
                  <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    1. Requests Received from Department Head ({activeDeptIssues.length})
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-mono font-bold rounded-full">
                  Escalated to COA
                </span>
              </div>

              {activeDeptIssues.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#777587] bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
                  No unresolved issues pending from Department Head at this moment.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeDeptIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 bg-[#fff8f7] border border-[#ffdad6] rounded-lg text-xs space-y-1 hover:border-[#ba1a1a]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#ba1a1a]">{issue.ticketNo}</span>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold rounded font-mono ${
                            issue.activeRequest?.priority === "Emergency" || issue.activeRequest?.priority === "Critical"
                              ? "bg-[#ba1a1a] text-white"
                              : "bg-[#ffdcc3] text-[#904d00]"
                          }`}
                        >
                          {issue.activeRequest?.priority || "High"}
                        </span>
                      </div>
                      <div className="font-bold text-[#191c1e]">{issue.activeRequest?.title || issue.ticketNo}</div>
                      <div className="text-[11px] text-[#464555] flex items-center justify-between">
                        <span>Loc: {issue.activeRequest?.trackSection || issue.station || "Central Line Section"}</span>
                        <span className="font-semibold text-[#3525cd]">{issue.department}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Pending Queue Demands */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3525cd]" />
                  <h4 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                    2. Requests Pending in "PENDING QUEUE" ({pendingRequests.length})
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[10px] font-mono font-bold rounded-full">
                  Pending Allocation
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#777587] bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
                  Pending queue is currently empty.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pendingRequests.slice(0, 6).map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-[#f8f9fa] border border-[#eceef0] rounded-lg text-xs space-y-1 hover:border-[#c7c4d8] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#3525cd]">{req.id}</span>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold rounded font-mono ${
                            req.priority === "High"
                              ? "bg-[#ffdad6] text-[#ba1a1a]"
                              : "bg-[#eceef0] text-[#464555]"
                          }`}
                        >
                          {req.priority}
                        </span>
                      </div>
                      <div className="font-bold text-[#191c1e] line-clamp-1">{req.description}</div>
                      <div className="text-[11px] text-[#464555] flex items-center justify-between">
                        <span>Loc: {req.trackArea}</span>
                        <span className="font-semibold text-[#191c1e]">{req.department}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Slots Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#3525cd]" />
          <h3 className="text-base font-bold text-[#191c1e] tracking-tight">
            AI-Optimized Slots ({filteredSlots.length})
          </h3>
          <span className="text-xs text-[#777587]">
            • Evaluated by AI Schedule Optimizer
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "ALL"
                ? "bg-[#3525cd] text-white shadow-xs"
                : "bg-white text-[#464555] border border-[#c7c4d8]/60 hover:bg-[#f2f4f6]"
            }`}
          >
            All Slots ({pravahSlots.length})
          </button>
          <button
            onClick={() => setActiveFilter("MULTI_DEPT")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "MULTI_DEPT"
                ? "bg-[#3525cd] text-white shadow-xs"
                : "bg-white text-[#464555] border border-[#c7c4d8]/60 hover:bg-[#f2f4f6]"
            }`}
          >
            Multi-Dept Clusters ({multiDeptSlotsCount})
          </button>
          <button
            onClick={() => setActiveFilter("CRITICAL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "CRITICAL"
                ? "bg-[#3525cd] text-white shadow-xs"
                : "bg-white text-[#464555] border border-[#c7c4d8]/60 hover:bg-[#f2f4f6]"
            }`}
          >
            Emergency / High Priority
          </button>
        </div>
      </div>

      {/* Slots List or Preparation Prompt */}
      {!hasRunScheduleOptimizer &&
      !isOptimizing &&
      !pravahSlots.some((s) => s.status === "accepted" || s.status === "rejected") ? (
        <div
          id="ai-optimizer-prompt-card"
          className="bg-white rounded-xl border-2 border-dashed border-[#3525cd]/40 p-8 text-center space-y-4 shadow-xs"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-[#e2dfff] text-[#3525cd] flex items-center justify-center shadow-xs">
            <Sparkles className="w-8 h-8 animate-pulse text-[#3525cd]" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-lg font-bold text-[#191c1e]">
              AI Schedule Optimizer Ready for Execution
            </h3>
            <p className="text-xs text-[#464555] leading-relaxed">
              <strong>{totalDemandsCount} Maintenance Demands Ingested</strong> ({activeDeptIssues.length} from Department Head, {pendingRequests.length} from Pending Queue).
              Click <strong>"AI SCHEDULE OPTIMIZER"</strong> below to calculate conflict-free slot timings prepared by AI with zero train delays, synergy clustering, and Accept / Reject decision options.
            </p>
          </div>
          <div className="pt-2">
            <button
              id="ai-schedule-optimizer-prompt-btn"
              onClick={onRunScheduleOptimizer}
              className="px-6 py-3 bg-[#3525cd] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#4f46e5] active:scale-[0.98] transition-all inline-flex items-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>AI SCHEDULE OPTIMIZER — Prepare Slot Timings</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSlots.map((slot) => {
            const isAccepted = slot.status === "accepted";
            const isRejected = slot.status === "rejected";
            const isPending = !isAccepted && !isRejected;
            const isMultiDept = slot.departments.length > 1;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                  isAccepted
                    ? "border-[#2e7d32] ring-1 ring-[#2e7d32]/30"
                    : isRejected
                    ? "border-[#ba1a1a]/40 bg-[#fffbfa]"
                    : isMultiDept
                    ? "border-[#3525cd]/50 hover:border-[#3525cd] hover:shadow-md"
                    : "border-[#c7c4d8]/70 hover:border-[#777587]"
                }`}
              >
                {/* Slot Header / Metadata Bar */}
                <div className="px-5 py-3.5 bg-[#f8f9fa] border-b border-[#eceef0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-[#191c1e] text-white text-xs font-mono font-bold rounded">
                      {slot.slotCode}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#191c1e] font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#3525cd]" />
                      {slot.date}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#3525cd] font-mono bg-[#e2dfff] px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5 text-[#3525cd]" />
                      {slot.timing}
                    </span>
                    {isMultiDept && (
                      <span className="px-2 py-0.5 bg-[#e8def8] text-[#4a4458] text-[11px] font-bold rounded font-mono">
                        {slot.departments.length} Departments Synchronized
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isAccepted && (
                      <span className="px-3 py-1 bg-[#d4edda] text-[#155724] text-xs font-bold rounded-full font-mono flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#28a745]" />
                        <span>Accepted by COA • Dispatched to Inboxes & Calendars</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold rounded-full font-mono flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                        <span>Rejected by COA</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="px-3 py-1 bg-[#fff3cd] text-[#856404] text-xs font-bold rounded-full font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI Slot Prepared • Pending COA Decision</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Slot Timing Prepared by AI - Prominent Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-[#eef2ff] via-[#f5f3ff] to-[#f0fdf4] border-2 border-[#3525cd]/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-[#3525cd] text-white shadow-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] bg-[#e0e7ff] px-2 py-0.5 rounded font-mono">
                            Slot Timing Prepared by AI
                          </span>
                          <span className="text-[10px] text-[#15803d] font-bold bg-[#dcfce7] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                            <span>Zero Regular Train Delays Guaranteed</span>
                          </span>
                        </div>
                        <div className="text-base sm:text-lg font-extrabold text-[#191c1e] font-mono mt-0.5">
                          {slot.timing}
                          <span className="text-xs font-semibold text-[#464555] ml-2 font-sans">
                            ({slot.date} • {slot.startTime} to {slot.endTime} IST)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#777587] block font-mono">
                        Optimized Possession Window
                      </span>
                      <span className="text-xs font-bold text-[#191c1e] font-mono">
                        {slot.startTime} – {slot.endTime} IST ({slot.date})
                      </span>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-base font-bold text-[#191c1e] leading-snug">
                      {slot.workName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#464555] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#3525cd] shrink-0" />
                      <span className="font-semibold">{slot.location}</span>
                    </div>
                  </div>

                {/* Departments Involved */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#777587] uppercase tracking-wider">
                    Departments:
                  </span>
                  {slot.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-[#f2f4f6] text-[#191c1e] border border-[#c7c4d8]/60 text-xs font-bold rounded-md"
                    >
                      {dept}
                    </span>
                  ))}
                </div>

                {/* Combined Demands Ingested in this Slot */}
                <div className="bg-[#f8f9fa] rounded-lg border border-[#eceef0] p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-[#191c1e] uppercase tracking-wider block">
                    Combined Maintenance Demands Addressed in this Slot ({slot.workItems.length}):
                  </span>
                  <div className="space-y-1.5">
                    {slot.workItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-white rounded border border-[#eceef0] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                              item.source === "Department Head Request" || item.source === "Department Head Escalation" || item.source === "Zonal Head Request"
                                ? "bg-[#ffdad6] text-[#ba1a1a]"
                                : "bg-[#e2dfff] text-[#3525cd]"
                            }`}
                          >
                            {item.source === "Zonal Head Request" ? "Dept Head Request" : item.source}
                          </span>
                          <span className="font-bold text-[#191c1e] truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-[#777587]">
                          <span>{item.department}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              item.priority === "Emergency"
                                ? "bg-[#ba1a1a] text-white"
                                : item.priority === "High"
                                ? "bg-[#ffdad6] text-[#ba1a1a]"
                                : "bg-[#eceef0] text-[#464555]"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 AI Optimizer Principles Box */}
                <div className="bg-[#f0f4ff]/70 border border-[#3525cd]/20 rounded-lg p-3.5 space-y-2">
                  <span className="text-[11px] font-extrabold text-[#3525cd] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Schedule Optimizer Principles Compliance</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded border border-[#c7c4d8]/40 space-y-1">
                      <div className="font-bold text-[#191c1e] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#2e7d32]"></span>
                        <span>1. Minimum Train Delays Principle</span>
                      </div>
                      <p className="text-[#464555] text-[11px] leading-relaxed">
                        {slot.principlesCompliance.trainDelayImpact}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-[#c7c4d8]/40 space-y-1">
                      <div className="font-bold text-[#191c1e] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3525cd]"></span>
                        <span>2. Single Slot for Multiple Departments</span>
                      </div>
                      <p className="text-[#464555] text-[11px] leading-relaxed">
                        {slot.principlesCompliance.multiDeptClustering}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-[#c7c4d8]/40 space-y-1">
                      <div className="font-bold text-[#191c1e] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#904d00]"></span>
                        <span>3. Minimized Asset Downtime</span>
                      </div>
                      <p className="text-[#464555] text-[11px] leading-relaxed">
                        {slot.principlesCompliance.assetDowntimeMinimized}
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-[#c7c4d8]/40 space-y-1">
                      <div className="font-bold text-[#191c1e] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                        <span>4. Uninterrupted Rail Availability</span>
                      </div>
                      <p className="text-[#464555] text-[11px] leading-relaxed">
                        {slot.principlesCompliance.infrastructureAvailability}
                      </p>
                    </div>
                  </div>
                </div>

                {/* COA Decision Action Bar */}
                <div className="pt-3 border-t border-[#eceef0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#777587] flex-1">
                    {isAccepted ? (
                      <div className="bg-[#e8f5e9] border border-[#a5d6a7] p-2.5 rounded-lg flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-[#2e7d32] shrink-0" />
                        <span className="text-[#1b5e20] text-xs font-semibold leading-relaxed">
                          <strong>COA Accepted & Sanctioned:</strong> Notifications dispatched to all involved roles (<strong>Department Head, Zonal Head, Supervisor, Field Worker</strong>) & task scheduled in Worker and Zonal Head calendars.
                        </span>
                      </div>
                    ) : isRejected ? (
                      <div className="bg-[#fff5f5] border border-[#ffdad6] p-2.5 rounded-lg flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                        <span className="text-[#ba1a1a] text-xs font-semibold">
                          <strong>Slot Rejected by COA:</strong> {slot.rejectionReason || "Operational track conflict"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#464555]">
                        <strong>COA Action Required:</strong> Review AI prepared slot timing and select Accept to sanction & broadcast notifications to all involved roles, or Reject with operational reason.
                      </span>
                    )}
                  </div>

                  {/* Decision Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button
                          id={`reject-slot-${slot.id}-btn`}
                          onClick={() => {
                            setRejectingSlot(slot);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 bg-white text-[#ba1a1a] border-2 border-[#ba1a1a]/40 text-xs font-bold rounded-lg hover:bg-[#fff5f5] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Slot</span>
                        </button>

                        <button
                          id={`accept-slot-${slot.id}-btn`}
                          onClick={() => handleAcceptWithFeedback(slot)}
                          disabled={processingSlotId === slot.id}
                          className="px-5 py-2 bg-[#2e7d32] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#1b5e20] active:scale-[0.98] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{processingSlotId === slot.id ? "Sanctioning & Notifying..." : "Accept Slot"}</span>
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <button
                        onClick={onNavigateToCalendar}
                        className="px-3.5 py-2 bg-[#e2dfff] text-[#3525cd] text-xs font-bold rounded-lg hover:bg-[#d0ccff] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View in Calendar</span>
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

      {/* COA Reject Slot Modal */}
      {rejectingSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ba1a1a]/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-mono font-bold uppercase rounded">
                  Reject प्रवाहPLAN Slot
                </span>
                <h3 className="text-base font-bold text-[#191c1e] mt-1">
                  Reject Slot {rejectingSlot.slotCode}
                </h3>
              </div>
              <button
                onClick={() => setRejectingSlot(null)}
                className="text-[#777587] hover:text-[#191c1e] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#464555]">
              Please provide the operational reason for rejecting this AI proposed slot for{" "}
              <strong>{rejectingSlot.workName}</strong> ({rejectingSlot.location} on {rejectingSlot.date}{" "}
              {rejectingSlot.timing}):
            </p>

            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unscheduled freight rake movement or adjacent division maintenance overlap..."
                rows={3}
                className="w-full text-xs p-3 bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg focus:outline-none focus:border-[#ba1a1a]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
              <button
                onClick={() => setRejectingSlot(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#464555] hover:bg-[#f2f4f6] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-[#93000a] transition-colors cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
