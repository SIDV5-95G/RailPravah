import React from "react";
import { MaintenanceBlock, HierarchyRole } from "../types";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface DependencyManagementCardProps {
  block: MaintenanceBlock;
  userRole: HierarchyRole;
  onUpdateDependency?: (updatedDeps: any) => void;
  onApproveOperations?: () => void;
}

export const DependencyManagementCard: React.FC<DependencyManagementCardProps> = ({
  block,
  userRole,
  onApproveOperations,
}) => {
  const deps = block.dependencies || {
    engineeringReady: true,
    electricalIsolationReady: true,
    signalProtectionReady: true,
    operationsApproved: false,
    waitingOn: "Operations Block Approval",
  };

  const isAllReady =
    deps.engineeringReady &&
    deps.electricalIsolationReady &&
    deps.signalProtectionReady &&
    deps.operationsApproved;

  const canApproveOperations =
    userRole === "COA" || userRole === "Zonal Head" || userRole === "Department Head";

  return (
    <div className="bg-white border border-[#c7c4d8] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef0] pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#e2dfff] text-[#3525cd] rounded-md">
            <Radio className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                {block.code}
              </span>
              <h3 className="text-sm font-bold text-[#191c1e]">{block.title}</h3>
            </div>
            <span className="text-[11px] text-[#777587] font-mono">
              Corridor: {block.corridor} ({block.startHour.toFixed(2)}h – {(block.startHour + block.durationHours).toFixed(2)}h)
            </span>
          </div>
        </div>

        {/* Current Interlocking Status */}
        <div className="flex items-center gap-2">
          {isAllReady ? (
            <span className="px-2.5 py-1 bg-[#dcfce7] text-[#15803d] border border-[#86efac] text-[11px] font-mono font-bold rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BLOCK APPROVED & INTERLOCKED</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#fff8f6] text-[#ba1a1a] border border-[#ffdad6] text-[11px] font-mono font-bold rounded-full flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>WAITING FOR OPERATIONS</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Dependency Step Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Engineering */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between ${
            deps.engineeringReady
              ? "bg-[#f0fdf4] border-[#86efac] text-[#166534]"
              : "bg-[#fef9c3] border-[#fde047] text-[#854d0e]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase mb-1">
              <span>1. Engineering</span>
              {deps.engineeringReady ? (
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              ) : (
                <Clock className="w-4 h-4 text-[#ca8a04]" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#191c1e]">Track Work & Machine</div>
            <span className="text-[10px] text-[#464555] block mt-0.5">
              {deps.engineeringReady ? "✓ Team & Tamping Unit Ready" : "Standby for mobilization"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold mt-2 text-[#166534]">
            STATUS: {deps.engineeringReady ? "READY" : "PENDING"}
          </span>
        </div>

        {/* Step 2: Electrical */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between ${
            deps.electricalIsolationReady
              ? "bg-[#f0fdf4] border-[#86efac] text-[#166534]"
              : "bg-[#fef9c3] border-[#fde047] text-[#854d0e]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase mb-1">
              <span>2. Electrical (TRD)</span>
              {deps.electricalIsolationReady ? (
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              ) : (
                <Clock className="w-4 h-4 text-[#ca8a04]" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#191c1e]">OHE Power Isolation</div>
            <span className="text-[10px] text-[#464555] block mt-0.5">
              {deps.electricalIsolationReady ? "✓ 25 kV AC Isolation Ready" : "Feeder clearance pending"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold mt-2 text-[#166534]">
            STATUS: {deps.electricalIsolationReady ? "ISOLATED" : "STANDBY"}
          </span>
        </div>

        {/* Step 3: S&T */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between ${
            deps.signalProtectionReady
              ? "bg-[#f0fdf4] border-[#86efac] text-[#166534]"
              : "bg-[#fef9c3] border-[#fde047] text-[#854d0e]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase mb-1">
              <span>3. Signal & Telecom</span>
              {deps.signalProtectionReady ? (
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              ) : (
                <Clock className="w-4 h-4 text-[#ca8a04]" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#191c1e]">Signal Protection</div>
            <span className="text-[10px] text-[#464555] block mt-0.5">
              {deps.signalProtectionReady ? "✓ Track Circuit Clamped" : "Interlocking check in progress"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold mt-2 text-[#166534]">
            STATUS: {deps.signalProtectionReady ? "PROTECTED" : "STANDBY"}
          </span>
        </div>

        {/* Step 4: Operations */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between ${
            deps.operationsApproved
              ? "bg-[#f0fdf4] border-[#86efac] text-[#166534]"
              : "bg-[#fff8f6] border-[#ffdad6] text-[#ba1a1a]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase mb-1">
              <span>4. Operations</span>
              {deps.operationsApproved ? (
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
              ) : (
                <Lock className="w-4 h-4 text-[#ba1a1a]" />
              )}
            </div>
            <div className="text-xs font-semibold text-[#191c1e]">Traffic Block Sanction</div>
            <span className="text-[10px] text-[#464555] block mt-0.5">
              {deps.operationsApproved ? "✓ Corridor possession granted" : "Awaiting Section Controller sanction"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold mt-2 text-[#ba1a1a]">
            STATUS: {deps.operationsApproved ? "SANCTIONED" : "PENDING SANCTION"}
          </span>
        </div>
      </div>

      {/* Operations Approval Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#eceef0] text-xs">
        <div className="text-[11px] text-[#777587]">
          {deps.operationsApproved ? (
            <span className="text-[#15803d] font-semibold">
              🔒 Approved Block: Section interlocking lock engaged. Safety protocol verified.
            </span>
          ) : (
            <span>
              All physical prerequisites verified. Ready for Chief Controller / Operations approval.
            </span>
          )}
        </div>

        {!deps.operationsApproved && onApproveOperations && (
          <button
            id="operations-grant-sanction-btn"
            onClick={onApproveOperations}
            disabled={!canApproveOperations}
            title={
              canApproveOperations
                ? "Grant Operations Block Sanction"
                : "Only COA, Zonal Head, or Department Head can grant Operations Sanction"
            }
            className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669] transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Grant Operations Block Sanction</span>
          </button>
        )}
      </div>
    </div>
  );
};
