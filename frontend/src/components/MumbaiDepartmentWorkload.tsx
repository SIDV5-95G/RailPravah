import React from "react";
import { DEPARTMENT_WORKLOAD_STATS } from "../mockData";
import { Users, AlertTriangle, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

export const MumbaiDepartmentWorkload: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[10px] font-bold font-mono uppercase rounded">
              Mumbai Division
            </span>
            <span className="text-xs text-[#777587] font-medium">Multi-Department Workforce Capacity</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#191c1e] mt-0.5 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3525cd]" />
            <span>Department Workload & Crew Utilization</span>
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#777587] font-mono">
          <TrendingUp className="w-3.5 h-3.5 text-[#3525cd]" />
          <span>Real-time Active Shift Matrix</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEPARTMENT_WORKLOAD_STATS.map((dept) => {
          let barColor = "bg-[#3525cd]";
          let textColor = "text-[#3525cd]";
          if (dept.department === "Electrical / Traction") {
            barColor = "bg-[#d97706]";
            textColor = "text-[#d97706]";
          } else if (dept.department === "Signal & Telecom") {
            barColor = "bg-[#0284c7]";
            textColor = "text-[#0284c7]";
          } else if (dept.department === "Operations") {
            barColor = "bg-[#4b5563]";
            textColor = "text-[#4b5563]";
          }

          return (
            <div
              key={dept.department}
              className={`p-3 rounded-lg border transition-all ${
                dept.warning
                  ? "bg-[#fff8f6] border-[#ffdad6]"
                  : "bg-[#f8f9fa] border-[#eceef0] hover:border-[#c7c4d8]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#191c1e] truncate">{dept.department}</span>
                <span className={`text-xs font-mono font-black ${textColor}`}>
                  {dept.percentage}%
                </span>
              </div>

              {/* Workload Progress Bar */}
              <div className="w-full h-2 bg-[#e6e8ea] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${dept.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#777587] mb-1.5">
                <span>Active Crews:</span>
                <span className="font-mono font-semibold text-[#191c1e]">
                  {dept.activeCrews} / {dept.totalCrews} deployed
                </span>
              </div>

              {dept.note && (
                <div
                  className={`p-1.5 rounded text-[10px] leading-tight flex items-start gap-1 ${
                    dept.warning
                      ? "bg-[#ffdad6]/60 text-[#ba1a1a] font-semibold"
                      : "bg-white text-[#464555] border border-[#eceef0]"
                  }`}
                >
                  {dept.warning ? (
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#3525cd] shrink-0 mt-0.5" />
                  )}
                  <span>{dept.note}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
