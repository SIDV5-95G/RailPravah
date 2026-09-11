import React from "react";
import { MaintenanceBlock, HierarchyRole, DepartmentName } from "../types";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Users,
  Train,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

interface CollaborativeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  corridorCode: string; // e.g. "DR – GC"
  requestedBlocks: MaintenanceBlock[];
  onAcceptCollaboration: (mergedBlock: MaintenanceBlock) => void;
  onRejectCollaboration?: () => void;
}

export const CollaborativeSlotModal: React.FC<CollaborativeSlotModalProps> = ({
  isOpen,
  onClose,
  corridorCode,
  requestedBlocks,
  onAcceptCollaboration,
  onRejectCollaboration,
}) => {
  if (!isOpen) return null;

  // The AI Collaborative Package
  const recommendedBlock: MaintenanceBlock = {
    id: `blk-collab-${Date.now()}`,
    code: "CLUST-MUM-01",
    title: "AI Collaborative Multi-Dept Maintenance Window",
    corridor: corridorCode,
    trackLine: "Down Fast",
    department: "Engineering",
    subDepartment: "Track Maintenance",
    team: "Multi-Department Combined Task Force",
    activity: "Integrated Track Tamping, OHE Inspection & Signal Maintenance",
    startHour: 1.5, // 01:30 - 04:30
    durationHours: 3.0,
    status: "AI Optimized",
    type: "clustered-task",
    priority: "High",
    isCollaborative: true,
    clusterId: "CLUST-MUM-01",
    partnerDepartments: ["Engineering", "Electrical / Traction", "Signal & Telecom"],
    savedMinutes: 180,
    efficiencyGain: 85,
    dependencies: {
      engineeringReady: true,
      electricalIsolationReady: true,
      signalProtectionReady: true,
      operationsApproved: true,
    },
    aiRationale:
      "Combined 3 separate departmental requests into a single unified 01:30–04:30 window. Decreased blocks required from 3 → 1, saving 180 minutes of track possession and avoiding 28 train delays.",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eceef0] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#dcfce7] text-[#15803d]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-[#dcfce7] text-[#15803d] rounded">
                Cross-Department AI Engine
              </span>
              <h2 className="text-[18px] font-bold text-[#191c1e] tracking-tight mt-1">
                AI Collaborative Maintenance Opportunity
              </h2>
              <span className="text-[12px] font-mono text-[#777587]">
                Corridor: <strong className="text-[#191c1e]">{corridorCode}</strong> (Dadar – Ghatkopar)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777587] hover:text-[#191c1e] p-1 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Individual requests vs Joint Window summary */}
        <div className="space-y-3">
          <div className="text-[12px] font-semibold text-[#464555]">
            Multiple departments requested maintenance on the SAME corridor within overlapping timelines:
          </div>

          {/* 3 Department Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg space-y-1 text-xs">
              <span className="text-[10px] font-mono font-bold text-[#0284c7] uppercase">Engineering</span>
              <div className="font-bold text-[#191c1e]">Track Tamping</div>
              <div className="font-mono text-[#464555]">02:00 – 05:00 (3.0h)</div>
              <span className="text-[10px] text-[#777587]">CSM-09 Heavy Tamping</span>
            </div>

            <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-lg space-y-1 text-xs">
              <span className="text-[10px] font-mono font-bold text-[#d97706] uppercase">Electrical / Traction</span>
              <div className="font-bold text-[#191c1e]">OHE Inspection</div>
              <div className="font-mono text-[#464555]">03:00 – 04:30 (1.5h)</div>
              <span className="text-[10px] text-[#777587]">Tower Wagon & Isolation</span>
            </div>

            <div className="p-3 bg-[#f5f3ff] border border-[#ddd6fe] rounded-lg space-y-1 text-xs">
              <span className="text-[10px] font-mono font-bold text-[#7c3aed] uppercase">Signal & Telecom</span>
              <div className="font-bold text-[#191c1e]">Signal Maintenance</div>
              <div className="font-mono text-[#464555]">02:30 – 04:00 (1.5h)</div>
              <span className="text-[10px] text-[#777587]">Axle Counter & Interlock</span>
            </div>
          </div>
        </div>

        {/* AI Recommendation Box */}
        <div className="p-4 bg-[#f0fdf4] border-2 border-[#16a34a] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-ping"></span>
              <h3 className="text-[14px] font-bold text-[#166534] uppercase tracking-wide">
                Recommended Unified Common Block
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-[#16a34a] text-white text-[11px] font-mono font-bold rounded">
              +85% Expected Efficiency
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#86efac]/40 text-xs font-mono">
            <div>
              <span className="text-[#464555] block text-[10px]">CORRIDOR:</span>
              <strong className="text-[#191c1e] text-[13px]">{corridorCode}</strong>
            </div>
            <div>
              <span className="text-[#464555] block text-[10px]">TIME WINDOW:</span>
              <strong className="text-[#15803d] text-[13px]">01:30 – 04:30</strong>
            </div>
            <div>
              <span className="text-[#464555] block text-[10px]">BLOCKS SAVED:</span>
              <strong className="text-[#191c1e] text-[13px]">3 Blocks &rarr; 1 Block</strong>
            </div>
            <div>
              <span className="text-[#464555] block text-[10px]">TRACK RECOVERED:</span>
              <strong className="text-[#15803d] text-[13px]">+180 minutes</strong>
            </div>
          </div>

          {/* Key Benefits Checklist */}
          <div className="pt-2 border-t border-[#86efac]/40 space-y-1.5 text-xs text-[#166534]">
            <span className="font-bold block uppercase text-[10px] tracking-wider text-[#14532d]">
              Collaborative Benefits:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Blocks required: 3 &rarr; 1 Unified Block</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Coordination effort: Reduced by 70%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Train disruption: 0 suburban cancellations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Resource utilization: Highly Improved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#eceef0] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-[#777587] font-mono">
            Participating: Engineering ✓ | TRD ✓ | S&T ✓ | Operations Pending
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onRejectCollaboration) onRejectCollaboration();
                onClose();
              }}
              className="px-3.5 py-2 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e0e3e5] transition-colors cursor-pointer"
            >
              Reject / Keep Separate
            </button>
            <button
              id="accept-ai-collaborative-plan-btn"
              onClick={() => {
                onAcceptCollaboration(recommendedBlock);
                onClose();
              }}
              className="px-4 py-2 bg-[#006e1c] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#005313] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept AI Collaborative Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
