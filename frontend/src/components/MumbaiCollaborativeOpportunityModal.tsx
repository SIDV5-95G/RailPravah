import React from "react";
import { Sparkles, Layers, CheckCircle2, ShieldCheck, ArrowRight, Wrench, Zap, Radio, Clock, TrendingUp } from "lucide-react";

interface MumbaiCollaborativeOpportunityModalProps {
  onAccept: () => void;
  onModify: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const MumbaiCollaborativeOpportunityModal: React.FC<MumbaiCollaborativeOpportunityModalProps> = ({
  onAccept,
  onModify,
  onReject,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-[#eceef0] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#dcfce7] text-[#166534] text-[10px] font-bold font-mono uppercase rounded border border-[#86efac]">
                AI Collaborative Maintenance Opportunity
              </span>
              <span className="text-xs text-[#777587] font-mono">DR – GC Corridor</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#191c1e] mt-1">
              Multi-Department Joint Shadow Block Recommendation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#777587] hover:text-[#191c1e] text-lg font-bold p-1 rounded hover:bg-[#f2f4f6] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 3 Department Requests into 1 Unified Block */}
        <div className="space-y-3">
          <p className="text-xs text-[#464555] leading-relaxed">
            Instead of executing 3 separate track possessions on the Dadar–Ghatkopar line, Central Railway AI has synchronized the work windows into a single non-intrusive mega shadow block:
          </p>

          <div className="space-y-2 p-3 bg-[#f8f9fa] rounded-lg border border-[#eceef0] text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-[#eceef0]">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-[#3525cd]" />
                <span className="font-bold text-[#191c1e]">Engineering (P-Way):</span>
                <span className="text-[#464555]">Track Tamping (REQ-892)</span>
              </div>
              <span className="font-mono text-[#3525cd] font-semibold">02:00 – 05:00</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border border-[#eceef0]">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                <span className="font-bold text-[#191c1e]">Electrical / Traction:</span>
                <span className="text-[#464555]">OHE Inspection (REQ-893)</span>
              </div>
              <span className="font-mono text-[#d97706] font-semibold">03:00 – 04:30</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border border-[#eceef0]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#0284c7]" />
                <span className="font-bold text-[#191c1e]">Signal & Telecom:</span>
                <span className="text-[#464555]">Signal Maintenance (REQ-894)</span>
              </div>
              <span className="font-mono text-[#0284c7] font-semibold">02:30 – 04:00</span>
            </div>
          </div>

          {/* Unified AI Block Result */}
          <div className="p-3.5 bg-[#e2dfff]/40 rounded-lg border border-[#3525cd]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3525cd] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Common Unified Block</span>
              </span>
              <span className="px-2 py-0.5 bg-[#3525cd] text-white text-[10px] font-mono font-bold rounded">
                01:30 – 04:30 IST (3.0h)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2 rounded border border-[#3525cd]/20 text-center">
                <span className="text-[10px] text-[#777587] block font-medium">Blocks Required</span>
                <strong className="text-xs text-[#191c1e] font-mono">3 &rarr; 1 Block</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#3525cd]/20 text-center">
                <span className="text-[10px] text-[#777587] block font-medium">Coordination</span>
                <strong className="text-xs text-[#137333]">✓ Synchronized</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#3525cd]/20 text-center">
                <span className="text-[10px] text-[#777587] block font-medium">Train Disruption</span>
                <strong className="text-xs text-[#137333]">Zero Delays</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#3525cd]/20 text-center">
                <span className="text-[10px] text-[#777587] block font-medium">Efficiency Gain</span>
                <strong className="text-xs text-[#3525cd] font-mono">+85%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-[#eceef0] flex items-center justify-end gap-2.5">
          <button
            onClick={onReject}
            className="px-3.5 py-1.5 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
          >
            Reject Proposal
          </button>
          <button
            onClick={onModify}
            className="px-3.5 py-1.5 bg-[#ffdcc3] text-[#904d00] text-xs font-bold rounded hover:bg-[#ffcaa1] cursor-pointer"
          >
            Modify Window
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded hover:bg-[#4f46e5] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accept AI Collaborative Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
