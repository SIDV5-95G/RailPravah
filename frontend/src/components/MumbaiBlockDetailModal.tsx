import React, { useState } from "react";
import { MaintenanceBlock, HierarchyRole, DepartmentName } from "../types";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Layers,
  Wrench,
  Zap,
  Radio,
  Train,
  Check,
  X,
} from "lucide-react";

interface MumbaiBlockDetailModalProps {
  block: MaintenanceBlock;
  userRole: HierarchyRole;
  userDepartment: DepartmentName;
  onClose: () => void;
  onUpdateBlock: (updatedBlock: MaintenanceBlock) => void;
  onNavigateToWhySlot?: (code?: string) => void;
  onNavigateToWhatIf?: () => void;
}

export const MumbaiBlockDetailModal: React.FC<MumbaiBlockDetailModalProps> = ({
  block,
  userRole,
  userDepartment,
  onClose,
  onUpdateBlock,
  onNavigateToWhySlot,
  onNavigateToWhatIf,
}) => {
  const [startHour, setStartHour] = useState(block.startHour);
  const [durationHours, setDurationHours] = useState(block.durationHours);
  const [team, setTeam] = useState(block.team);
  const [reportedIssueText, setReportedIssueText] = useState("");
  const [hasChanged, setHasChanged] = useState(false);
  const [aiValidationNotice, setAiValidationNotice] = useState<{
    severity: "warning" | "success" | "neutral";
    conflicts: number;
    efficiency: string;
    message: string;
  } | null>(null);

  // Role permissions calculation
  const isCoa = userRole === "COA";
  const isDepartmentHead = userRole === "Department Head" && userDepartment === block.department;
  const isZonalHead = userRole === "Zonal Head";
  const isSupervisor = userRole === "Supervisor";
  const isTechnician = userRole === "Technician";

  const isApproved =
    block.status === "Approved" ||
    block.status === "Operations Approved" ||
    block.status === "Active" ||
    block.status === "Completed";

  const canEditSchedule =
    isCoa ||
    isZonalHead ||
    (isDepartmentHead && !isApproved) ||
    (isSupervisor && (block.status === "Draft" || block.status === "Requested"));

  const canApprove =
    isCoa ||
    isZonalHead ||
    (isDepartmentHead && (block.status === "AI Optimized" || block.status === "Pending Approval"));

  const canExecute = isTechnician || isSupervisor || isCoa || isZonalHead;

  // Real-time AI evaluation when user tweaks start time or duration
  const handleTimeChange = (newStart: number, newDuration: number) => {
    setStartHour(newStart);
    setDurationHours(newDuration);
    setHasChanged(true);

    // AI Validation
    if (newStart >= 3.0 && newStart <= 4.5 && block.corridor === "DR – GC") {
      setAiValidationNotice({
        severity: "warning",
        conflicts: 2,
        efficiency: "-18%",
        message:
          "Moving into the 03:30–04:30 window introduces direct conflict with scheduled Freight FRT-990 & suburban traffic. Recommended optimal slot is 01:30–04:30.",
      });
    } else if (newStart >= 1.0 && newStart <= 2.0) {
      setAiValidationNotice({
        severity: "success",
        conflicts: 0,
        efficiency: "+85%",
        message: "Optimal low-traffic shadow slot. All department crews and equipment clear.",
      });
    } else {
      setAiValidationNotice({
        severity: "neutral",
        conflicts: 1,
        efficiency: "-5%",
        message: "Sub-optimal window with moderate headway compression.",
      });
    }
  };

  const handleApplyAiRecommendedSlot = () => {
    setStartHour(1.5);
    setDurationHours(3.0);
    setAiValidationNotice({
      severity: "success",
      conflicts: 0,
      efficiency: "+85%",
      message: "AI Recommended Slot 01:30–04:30 applied (+85% Efficiency, Zero Collisions).",
    });
    setHasChanged(true);
  };

  const handleSaveBlock = () => {
    const updated: MaintenanceBlock = {
      ...block,
      startHour,
      durationHours,
      team,
      status: isApproved ? block.status : "AI Optimized",
      aiRationale: aiValidationNotice ? aiValidationNotice.message : block.aiRationale,
    };
    onUpdateBlock(updated);
    onClose();
  };

  const handleApproveBlock = () => {
    const isFullSanction = isCoa || isZonalHead;
    const updated: MaintenanceBlock = {
      ...block,
      status: isFullSanction ? "Approved" : "Department Approved",
      dependencies: {
        engineeringReady: true,
        electricalIsolationReady: true,
        signalProtectionReady: true,
        operationsApproved: isFullSanction,
        waitingOn: isFullSanction ? undefined : "Operations Block Approval",
      },
    };
    onUpdateBlock(updated);
    onClose();
  };

  const handleRejectBlock = () => {
    const updated: MaintenanceBlock = {
      ...block,
      status: "Cancelled",
    };
    onUpdateBlock(updated);
    onClose();
  };

  const handleStartTask = () => {
    const updated: MaintenanceBlock = {
      ...block,
      status: "Active",
      actualStartTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onUpdateBlock(updated);
    onClose();
  };

  const handleCompleteTask = () => {
    const updated: MaintenanceBlock = {
      ...block,
      status: "Completed",
      actualEndTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onUpdateBlock(updated);
    onClose();
  };

  const handleAddReportedIssue = () => {
    if (!reportedIssueText.trim()) return;
    const currentIssues = block.reportedIssues || [];
    const updated: MaintenanceBlock = {
      ...block,
      reportedIssues: [...currentIssues, reportedIssueText.trim()],
    };
    onUpdateBlock(updated);
    setReportedIssueText("");
  };

  const workflowStages = [
    "Requested",
    "AI Analysis",
    "AI Optimized",
    "Dept Approval",
    "Ops Approval",
    "Approved",
    "Active",
    "Completed",
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "Requested":
        return 0;
      case "AI Analysis":
        return 1;
      case "AI Optimized":
        return 2;
      case "Department Approved":
      case "Pending Approval":
        return 3;
      case "Operations Approved":
        return 4;
      case "Approved":
        return 5;
      case "Active":
        return 6;
      case "Completed":
        return 7;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(block.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eceef0] pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#3525cd] text-white text-[10px] font-mono font-bold uppercase rounded">
                {block.department}
              </span>
              <span className="px-2 py-0.5 bg-[#f2f4f6] text-[#464555] text-[10px] font-mono font-semibold rounded border border-[#c7c4d8]">
                {block.corridor} ({block.trackLine})
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                  block.status === "Approved" || block.status === "Active"
                    ? "bg-[#dcfce7] text-[#166534]"
                    : block.status === "Cancelled"
                    ? "bg-[#ffdad6] text-[#ba1a1a]"
                    : "bg-[#fef3c7] text-[#92400e]"
                }`}
              >
                {block.status}
              </span>
              {isApproved && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#137333]">
                  <Lock className="w-3 h-3" />
                  <span>LOCKED / APPROVED BLOCK</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#191c1e] mt-1.5">{block.title}</h2>
            <div className="text-xs text-[#777587] font-mono">
              Block Code: <strong>{block.code}</strong> • Sub-Dept: {block.subDepartment}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777587] hover:text-[#191c1e] text-lg font-bold p-1 rounded hover:bg-[#f2f4f6] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 7-Stage Approval Workflow Visual Tracker */}
        <div className="space-y-1.5 bg-[#f8f9fa] p-3 rounded-lg border border-[#eceef0]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555] block">
            Central Railway 7-Stage Workflow
          </span>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pt-1 pb-1">
            {workflowStages.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={stage} className="flex items-center gap-1 shrink-0">
                  <div
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isCurrent
                        ? "bg-[#3525cd] text-white shadow-xs"
                        : isPast
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-[#e6e8ea] text-[#777587]"
                    }`}
                  >
                    {isPast && <Check className="w-2.5 h-2.5" />}
                    <span>{stage}</span>
                  </div>
                  {idx < workflowStages.length - 1 && (
                    <ArrowRight className="w-2.5 h-2.5 text-[#c7c4d8]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Department Dependency Checklist */}
        <div className="p-3.5 bg-white rounded-lg border border-[#c7c4d8]/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#191c1e] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3525cd]" />
              <span>Multi-Department Safety & Block Dependency Matrix</span>
            </span>
            {block.dependencies?.waitingOn && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded">
                WAITING ON: {block.dependencies.waitingOn}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div
              className={`p-2 rounded border flex flex-col justify-between ${
                block.dependencies?.engineeringReady
                  ? "bg-[#dcfce7]/60 border-[#86efac] text-[#166534]"
                  : "bg-[#f8f9fa] border-[#eceef0] text-[#777587]"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Wrench className="w-3 h-3 text-[#3525cd]" />
                <span>1. Engineering</span>
              </div>
              <div className="text-[10px] font-mono mt-1">
                {block.dependencies?.engineeringReady ? "✓ Track Work Ready" : "⏳ Pending Prep"}
              </div>
            </div>

            <div
              className={`p-2 rounded border flex flex-col justify-between ${
                block.dependencies?.electricalIsolationReady
                  ? "bg-[#dcfce7]/60 border-[#86efac] text-[#166534]"
                  : "bg-[#fff8f6] border-[#ffdad6] text-[#ba1a1a]"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Zap className="w-3 h-3 text-[#d97706]" />
                <span>2. Traction (TRD)</span>
              </div>
              <div className="text-[10px] font-mono mt-1 font-bold">
                {block.dependencies?.electricalIsolationReady
                  ? "✓ 25kV Isolated"
                  : "⏳ OHE Isolation Req"}
              </div>
            </div>

            <div
              className={`p-2 rounded border flex flex-col justify-between ${
                block.dependencies?.signalProtectionReady
                  ? "bg-[#dcfce7]/60 border-[#86efac] text-[#166534]"
                  : "bg-[#f8f9fa] border-[#eceef0] text-[#777587]"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Radio className="w-3 h-3 text-[#0284c7]" />
                <span>3. S&T Protection</span>
              </div>
              <div className="text-[10px] font-mono mt-1">
                {block.dependencies?.signalProtectionReady
                  ? "✓ Signal Interlocked"
                  : "⏳ Awaiting Shunt"}
              </div>
            </div>

            <div
              className={`p-2 rounded border flex flex-col justify-between ${
                block.dependencies?.operationsApproved
                  ? "bg-[#dcfce7]/60 border-[#86efac] text-[#166534]"
                  : "bg-[#fef3c7] border-[#fde68a] text-[#92400e]"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Train className="w-3 h-3 text-[#4b5563]" />
                <span>4. Operations</span>
              </div>
              <div className="text-[10px] font-mono mt-1 font-bold">
                {block.dependencies?.operationsApproved ? "✓ Block Sanctioned" : "⏳ Sanction Pending"}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Team Interactive Adjuster */}
        <div className="p-3.5 bg-[#f8f9fa] rounded-lg border border-[#eceef0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3525cd]" />
              <span>Block Timing & Resource Assignment</span>
            </span>
            {!canEditSchedule && (
              <span className="text-[10px] font-mono text-[#777587]">
                🔒 Read-only for role ({userRole})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#777587] font-semibold mb-1">Start Hour (IST):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="23.5"
                disabled={!canEditSchedule}
                value={startHour}
                onChange={(e) => handleTimeChange(parseFloat(e.target.value) || 0, durationHours)}
                className="w-full bg-white border border-[#c7c4d8] rounded p-1.5 font-mono font-bold text-[#191c1e] disabled:bg-[#e6e8ea]"
              />
              <span className="text-[10px] text-[#777587] font-mono block mt-0.5">
                {Math.floor(startHour)}:{startHour % 1 !== 0 ? "30" : "00"} IST
              </span>
            </div>

            <div>
              <label className="block text-[#777587] font-semibold mb-1">Duration (Hours):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                disabled={!canEditSchedule}
                value={durationHours}
                onChange={(e) => handleTimeChange(startHour, parseFloat(e.target.value) || 1)}
                className="w-full bg-white border border-[#c7c4d8] rounded p-1.5 font-mono font-bold text-[#191c1e] disabled:bg-[#e6e8ea]"
              />
              <span className="text-[10px] text-[#777587] font-mono block mt-0.5">
                Window: {durationHours.toFixed(1)} hrs (End: {(startHour + durationHours).toFixed(1)}h)
              </span>
            </div>

            <div>
              <label className="block text-[#777587] font-semibold mb-1">Assigned Team / Crew:</label>
              <input
                type="text"
                disabled={!canEditSchedule && !isSupervisor}
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  setHasChanged(true);
                }}
                className="w-full bg-white border border-[#c7c4d8] rounded p-1.5 font-sans font-semibold text-[#191c1e] disabled:bg-[#e6e8ea]"
              />
            </div>
          </div>

          {/* AI Immediate Validation Feedback */}
          {aiValidationNotice && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                aiValidationNotice.severity === "warning"
                  ? "bg-[#fff8f6] border-[#ffdad6] text-[#ba1a1a]"
                  : aiValidationNotice.severity === "success"
                  ? "bg-[#dcfce7] border-[#86efac] text-[#166534]"
                  : "bg-[#f2f4f6] border-[#c7c4d8] text-[#191c1e]"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold">
                  {aiValidationNotice.severity === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#3525cd]" />
                  )}
                  <span>
                    Change Impact • Conflicts: {aiValidationNotice.conflicts} • Efficiency:{" "}
                    {aiValidationNotice.efficiency}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{aiValidationNotice.message}</p>
              </div>

              {aiValidationNotice.severity === "warning" && (
                <button
                  onClick={handleApplyAiRecommendedSlot}
                  className="px-2.5 py-1 bg-[#3525cd] text-white text-[10px] font-bold uppercase rounded shrink-0 hover:bg-[#4f46e5] cursor-pointer"
                >
                  Accept AI (01:30–04:30)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Technician Issue Log / Task Execution Controls */}
        {isTechnician && (
          <div className="p-3 bg-[#e0f2fe]/40 rounded-lg border border-[#0284c7]/30 space-y-2">
            <span className="text-xs font-bold text-[#0369a1] block">
              Technician Live Task Execution & Issue Logging
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log field observation or equipment defect..."
                value={reportedIssueText}
                onChange={(e) => setReportedIssueText(e.target.value)}
                className="flex-1 bg-white border border-[#c7c4d8] rounded p-1.5 text-xs text-[#191c1e]"
              />
              <button
                onClick={handleAddReportedIssue}
                className="px-3 py-1.5 bg-[#0284c7] text-white text-xs font-bold rounded hover:bg-[#0369a1] cursor-pointer"
              >
                Log Issue
              </button>
            </div>
            {block.reportedIssues && block.reportedIssues.length > 0 && (
              <div className="space-y-1 pt-1">
                {block.reportedIssues.map((iss, i) => (
                  <div
                    key={i}
                    className="text-[11px] bg-white p-1.5 rounded border border-[#eceef0] text-[#ba1a1a] font-mono"
                  >
                    ⚠ {iss}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls by Role */}
        <div className="pt-3 border-t border-[#eceef0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onNavigateToWhySlot && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWhySlot(block.code);
                }}
                className="px-3 py-1.5 bg-[#e2dfff] text-[#3525cd] text-xs font-semibold rounded hover:bg-[#d0ccff] flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>WhySlot Rationale</span>
              </button>
            )}
            {onNavigateToWhatIf && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWhatIf();
                }}
                className="px-3 py-1.5 bg-[#ffdcc3] text-[#904d00] text-xs font-semibold rounded hover:bg-[#ffcaa1] flex items-center gap-1 cursor-pointer"
              >
                <span>What-If Delay Impact</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Technician Actions */}
            {canExecute && block.status === "Approved" && (
              <button
                onClick={handleStartTask}
                className="px-3.5 py-1.5 bg-[#137333] text-white text-xs font-bold rounded hover:bg-[#0f5b28] cursor-pointer"
              >
                Start Task on Track
              </button>
            )}
            {canExecute && block.status === "Active" && (
              <button
                onClick={handleCompleteTask}
                className="px-3.5 py-1.5 bg-[#137333] text-white text-xs font-bold rounded hover:bg-[#0f5b28] cursor-pointer"
              >
                Complete & Clear Block
              </button>
            )}

            {/* Approval Controls */}
            {canApprove && (
              <>
                <button
                  onClick={handleRejectBlock}
                  className="px-3 py-1.5 bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold rounded hover:bg-[#ffb4ab] cursor-pointer"
                >
                  Reject Block
                </button>
                <button
                  onClick={handleApproveBlock}
                  className="px-3.5 py-1.5 bg-[#137333] text-white text-xs font-bold rounded hover:bg-[#0f5b28] cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isCoa || isZonalHead ? "Sanction & Approve Block" : "Dept Endorse"}</span>
                </button>
              </>
            )}

            {/* Save Modified Timing */}
            {hasChanged && canEditSchedule && (
              <button
                onClick={handleSaveBlock}
                className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded hover:bg-[#4f46e5] cursor-pointer"
              >
                Save Block Modifications
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
