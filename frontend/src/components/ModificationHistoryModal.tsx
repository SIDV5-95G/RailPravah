import React from "react";
import { HierarchicalIssue } from "../types";
import { X, History, FileText, ShieldCheck, UserCheck, Clock } from "lucide-react";

interface ModificationHistoryModalProps {
  issue: HierarchicalIssue;
  onClose: () => void;
}

export const ModificationHistoryModal: React.FC<ModificationHistoryModalProps> = ({
  issue,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#c7c4d8] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#3525cd] text-white">
              <History className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                  {issue.ticketNo}
                </span>
                <span className="text-xs font-bold text-[#191c1e]">{issue.station}</span>
              </div>
              <h3 className="text-base font-bold text-[#191c1e] mt-0.5">
                Complete Issue Modification & Escalation Audit Trail
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

        {/* Content Table */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-[#e6f4ea] border border-[#a8dab5] rounded-xl flex items-center justify-between text-[#137333]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Tamper-Proof Handover Log</span>
            </div>
            <span className="text-[11px] font-mono">
              Total Audited Events: <strong>{issue.modificationHistory.length}</strong>
            </span>
          </div>

          <div className="border border-[#c7c4d8] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f6] text-[#464555] font-bold text-[11px] uppercase tracking-wider border-b border-[#c7c4d8]">
                  <th className="p-3">Level</th>
                  <th className="p-3">Modified By</th>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Changes</th>
                  <th className="p-3">Remarks / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {issue.modificationHistory.map((rec) => {
                  const getBadge = (lvl: string) => {
                    switch (lvl) {
                      case "Worker":
                        return "bg-emerald-100 text-emerald-800 border-emerald-300";
                      case "Supervisor":
                        return "bg-amber-100 text-amber-800 border-amber-300";
                      case "Zonal Head":
                        return "bg-orange-100 text-orange-800 border-orange-300";
                      case "Department Head":
                        return "bg-rose-100 text-rose-800 border-rose-300";
                      case "COA Management":
                        return "bg-blue-100 text-blue-800 border-blue-300";
                      default:
                        return "bg-gray-100 text-gray-800 border-gray-300";
                    }
                  };

                  return (
                    <tr key={rec.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="p-3 align-top font-semibold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadge(
                            rec.level
                          )}`}
                        >
                          {rec.level}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <div className="font-bold text-[#191c1e]">{rec.modifiedBy.name}</div>
                        <div className="text-[10px] text-[#777587] font-mono">
                          {rec.modifiedBy.empId} • {rec.modifiedBy.role}
                        </div>
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] text-[#464555] whitespace-nowrap">
                        {rec.dateTime}
                      </td>
                      <td className="p-3 align-top font-sans text-[#191c1e]">
                        <p className="leading-snug">{rec.changes}</p>
                      </td>
                      <td className="p-3 align-top text-[#464555]">
                        <p className="italic bg-[#f8f9fa] p-2 rounded border border-[#eceef0] leading-snug">
                          "{rec.remarks}"
                        </p>
                        {rec.actionTaken && (
                          <span className="inline-block mt-1 font-mono text-[10px] text-[#3525cd] font-semibold">
                            ✓ {rec.actionTaken}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#f8f9fa] border-t border-[#eceef0] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
