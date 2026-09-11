import React from "react";
import { MUMBAI_NOTIFICATIONS } from "../mockData";
import { Bell, AlertTriangle, Sparkles, Clock, CheckCircle2, ShieldCheck, Zap, X } from "lucide-react";

interface MumbaiNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotificationCorridor: (corridor: string) => void;
}

export const MumbaiNotificationsDrawer: React.FC<MumbaiNotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectNotificationCorridor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#eceef0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#e2dfff] text-[#3525cd]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#191c1e]">Mumbai Maintenance Feed</h3>
              <span className="text-[11px] text-[#777587] font-mono">Central Line Real-time Telemetry</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777587] hover:text-[#191c1e] rounded hover:bg-[#e6e8ea] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {MUMBAI_NOTIFICATIONS.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onSelectNotificationCorridor(notif.corridor);
                onClose();
              }}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer hover:shadow-xs ${
                notif.type === "conflict"
                  ? "bg-[#fff8f6] border-[#ffdad6] hover:border-[#ba1a1a]"
                  : notif.type === "opportunity"
                  ? "bg-[#f0fdf4] border-[#bbf7d0] hover:border-[#16a34a]"
                  : notif.type === "ai-slot"
                  ? "bg-[#e2dfff]/40 border-[#3525cd]/30 hover:border-[#3525cd]"
                  : "bg-[#f8f9fa] border-[#eceef0] hover:border-[#c7c4d8]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    notif.type === "conflict"
                      ? "bg-[#ffdad6] text-[#ba1a1a]"
                      : notif.type === "opportunity"
                      ? "bg-[#dcfce7] text-[#166534]"
                      : notif.type === "ai-slot"
                      ? "bg-[#e2dfff] text-[#3525cd]"
                      : "bg-[#fef3c7] text-[#92400e]"
                  }`}
                >
                  {notif.badge}
                </span>
                <span className="text-[10px] text-[#777587] font-mono">{notif.time}</span>
              </div>
              <h4 className="text-xs font-bold text-[#191c1e] mt-1">{notif.title}</h4>
              <p className="text-[11px] text-[#464555] mt-0.5 leading-relaxed">{notif.description}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#3525cd]">
                <span>Corridor: {notif.corridor}</span>
                <span className="font-bold underline">Filter Planner &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#eceef0] bg-[#f8f9fa] text-center">
          <span className="text-[11px] text-[#777587] font-mono">
            Connected to Central Railway Network Control Center
          </span>
        </div>
      </div>
    </div>
  );
};
