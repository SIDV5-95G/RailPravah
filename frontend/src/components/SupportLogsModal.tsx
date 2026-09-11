import React, { useState } from "react";
import appLogo from "../assets/logo.png";
import { HelpCircle, History, Terminal, Phone, Mail, ShieldCheck, Database, RefreshCw } from "lucide-react";

interface SupportLogsModalProps {
  isOpen: boolean;
  type: "support" | "logs";
  onClose: () => void;
}

export const SupportLogsModal: React.FC<SupportLogsModalProps> = ({ isOpen, type: initialType, onClose }) => {
  const [activeTab, setActiveTab] = useState<"support" | "logs">(initialType);

  if (!isOpen) return null;

  const systemLogs = [
    { time: "10:28:44", level: "INFO", message: "Railप्रवाह AI Matrix synchronized with CSMT Divisional Signal Control." },
    { time: "10:24:12", level: "SUCCESS", message: "Slot Optimization Engine deployed: 18 blocks matched with zero conflicts." },
    { time: "10:18:05", level: "WARN", message: "GapSense alert triggered: REQ-892 (DR-GC) freight overlap detected." },
    { time: "10:14:22", level: "CRITICAL", message: "Urgency Queue: Emergency Power Block Request received at KM-45.2." },
    { time: "09:55:00", level: "INFO", message: "What-if simulation model loaded (Gemini 2.5 Flash / SIL-4 validation)." },
    { time: "08:30:19", level: "INFO", message: "Automatic train describer telemetry feed connected (Central Line UP/DOWN)." },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-[#c7c4d8] rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={appLogo}
              alt="Railप्रवाह"
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-[16px] font-bold text-[#191c1e]">
                {activeTab === "support" ? "Central Line Control Room Support" : "Division System & Audit Logs"}
              </h2>
              <p className="text-[11px] text-[#777587]">Railप्रवाह Mumbai Division Operational Telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#777587] hover:text-[#191c1e] text-[18px] font-bold">
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#eceef0] text-[12px] font-bold">
          <button
            onClick={() => setActiveTab("support")}
            className={`py-2 px-4 border-b-2 uppercase tracking-wider ${
              activeTab === "support"
                ? "border-[#3525cd] text-[#3525cd]"
                : "border-transparent text-[#777587] hover:text-[#191c1e]"
            }`}
          >
            Emergency & Dispatch Support
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-2 px-4 border-b-2 uppercase tracking-wider ${
              activeTab === "logs"
                ? "border-[#3525cd] text-[#3525cd]"
                : "border-transparent text-[#777587] hover:text-[#191c1e]"
            }`}
          >
            System Event Logs
          </button>
        </div>

        {/* Content */}
        {activeTab === "support" ? (
          <div className="space-y-3.5 text-[13px]">
            <div className="bg-[#f8f9fc] border border-[#c7c4d8] rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#3525cd] font-bold text-[14px]">
                <Phone className="w-4 h-4" />
                <span>Divisional Rail Manager (DRM) Control Desk</span>
              </div>
              <div className="text-[12px] text-[#464555] space-y-1 font-mono">
                <p>Hotline (CSMT Control): +91 22 2262 0123 / Ext 4880</p>
                <p>Traction Power Controller (TPC): Ext 4892</p>
                <p>Chief Controller Operations (CCO): Ext 4810</p>
              </div>
            </div>

            <div className="bg-[#f8f9fc] border border-[#c7c4d8] rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[#006e1c] font-bold text-[14px]">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Dispatch Technical Helpdesk</span>
              </div>
              <p className="text-[12px] text-[#464555]">
                For telemetry sync errors, GapSense threshold overrides, or server restart assistance, contact the Railप्रवाह Technical Engineering Cell at{" "}
                <span className="font-mono text-[#3525cd]">dispatch-tech@railpravah.gov.in</span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#191c1e] text-[#f2f4f6] p-3.5 rounded-lg font-mono text-[11px] space-y-2 max-h-64 overflow-y-auto">
              {systemLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#777587] shrink-0">{log.time}</span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.level === "CRITICAL"
                        ? "text-[#ba1a1a]"
                        : log.level === "WARN"
                        ? "text-[#ffdcc3]"
                        : log.level === "SUCCESS"
                        ? "text-[#4ade80]"
                        : "text-[#93c5fd]"
                    }`}
                  >
                    [{log.level}]
                  </span>
                  <span className="text-[#e2e8f0]">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end border-t border-[#eceef0]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3525cd] text-white text-[12px] font-bold uppercase tracking-wider rounded hover:bg-[#4f46e5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
