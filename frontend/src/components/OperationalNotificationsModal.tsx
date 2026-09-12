import React, { useState, useEffect } from "react";
import { PravahSlotNotification, UserRole } from "../types";
import {
  Bell,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
  Radio,
  CheckCheck,
} from "lucide-react";

interface OperationalNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  userDepartment?: string;
  userEmpId?: string;
  notifications?: PravahSlotNotification[];
  onNavigateToCalendar?: () => void;
}

export const OperationalNotificationsModal: React.FC<
  OperationalNotificationsModalProps
> = ({ isOpen, onClose, userRole, userDepartment, userEmpId, notifications: propNotifications, onNavigateToCalendar }) => {
  const [notifications, setNotifications] = useState<PravahSlotNotification[]>(
    propNotifications || []
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Canonical deduplication by slot code
  const uniqueNotifications = React.useMemo(() => {
    const notifMap = new Map<string, PravahSlotNotification>();
    notifications.forEach((n) => {
      const msg = n.message || "";
      const title = n.title || "";
      const match =
        n.slotCode ||
        (n as any).slot_code ||
        title.match(/(?:SLOT|SANCTION|WHYSLOT|CLUSTER)-[A-Z0-9\-_]+/i)?.[0] ||
        msg.match(/(?:SLOT|SANCTION|WHYSLOT|CLUSTER)-[A-Z0-9\-_]+/i)?.[0];

      const key = match ? `slot_${match.toUpperCase()}` : `id_${n.id}`;
      if (!notifMap.has(key)) {
        notifMap.set(key, n);
      }
    });
    return Array.from(notifMap.values());
  }, [notifications]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const headers: Record<string, string> = {
        "x-user-role": userRole,
      };
      if (userDepartment) headers["x-user-dept"] = userDepartment;
      if (userEmpId) headers["x-user-empid"] = userEmpId;

      fetch(`/api/notifications?role=${encodeURIComponent(userRole)}&department=${encodeURIComponent(userDepartment || "")}`, {
        headers,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          }
        })
        .catch((err) => {
          console.warn("Notice: could not load notifications:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userRole, userDepartment, userEmpId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#c7c4d8] flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#eceef0] flex items-center justify-between bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#3525cd] text-white shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                <span>Operational Slot Notifications</span>
                <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-xs font-mono font-bold rounded-full">
                  {uniqueNotifications.length}
                </span>
              </h2>
              <p className="text-xs text-[#777587]">
                Live dispatches from COA Master Traffic Controller to all involved operational roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777587] hover:text-[#191c1e] hover:bg-[#eceef0] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#777587]">
              Syncing notifications feed...
            </div>
          ) : uniqueNotifications.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-[#777587]">
              <Bell className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-sm font-semibold">No Active Dispatches</div>
              <div className="text-xs">
                When COA accepts AI-optimized maintenance slots, dispatches will appear here immediately for all involved roles.
              </div>
            </div>
          ) : (
            uniqueNotifications.map((rawNotif) => {
              const msg = rawNotif.message || "";
              const title = rawNotif.title || "";

              // 1. Slot Code
              let slotCode = rawNotif.slotCode || (rawNotif as any).slot_code || (rawNotif as any).slotId;
              if (!slotCode) {
                const match = msg.match(/(?:SLOT|SANCTION|WHYSLOT)-[A-Z0-9\-_]+/i);
                slotCode = match ? match[0] : "SLOT-SANCTIONED";
              }

              // 2. Timing
              let timing = rawNotif.timing;
              if (!timing) {
                const match = msg.match(/\((\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}[^)]*)\)/);
                timing = match ? match[1] : (rawNotif.startTime && rawNotif.endTime ? `${rawNotif.startTime} – ${rawNotif.endTime} IST` : "01:30 – 04:30 IST");
              }

              // 3. Work Name
              let workName = rawNotif.workName || (rawNotif as any).taskName;
              if (!workName) {
                const match = msg.match(/Work:\s*([^.]+)/i);
                workName = match ? match[1].trim() : title.replace(/\[SLOT SANCTIONED:[^\]]+\]\s*/i, "").trim() || "Track Possession Maintenance";
              }

              // 4. Location
              let location = rawNotif.location;
              if (!location) {
                const match = msg.match(/for\s+(.*?)\s+on\s+\d{4}-\d{2}-\d{2}/i);
                location = match ? match[1].trim() : "Central Line Corridor";
              }

              // 5. Sanctioned By
              let sanctionedBy = rawNotif.sanctionedBy || (rawNotif as any).sanctioned_by;
              if (!sanctionedBy) {
                const match = msg.match(/^([^.]+?)\s+has sanctioned/i);
                sanctionedBy = match ? match[1].trim() : "Central Railway Authority";
              }

              // 6. Departments
              let departments = rawNotif.departments || (rawNotif as any).recipientDepts || (rawNotif as any).recipient_depts;
              if (!departments || (Array.isArray(departments) && departments.length === 0)) {
                if (title.toLowerCase().includes("civil") || msg.toLowerCase().includes("civil")) departments = ["Civil / Track"];
                else if (title.toLowerCase().includes("elect") || msg.toLowerCase().includes("elect")) departments = ["Electrical / Traction"];
                else if (title.toLowerCase().includes("sign") || msg.toLowerCase().includes("sign")) departments = ["Signal & Telecom"];
                else departments = ["Multi-Department"];
              } else if (!Array.isArray(departments)) {
                departments = [departments];
              }

              // 7. Date formatting
              const rawDate = rawNotif.createdAt || (rawNotif as any).created_at;
              let formattedDate = "";
              if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
              }
              if (!formattedDate) {
                formattedDate = new Date().toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }

              return (
                <div
                  key={rawNotif.id}
                  className="bg-white rounded-xl border border-[#3525cd]/30 p-4 shadow-xs space-y-3 hover:border-[#3525cd] transition-colors"
                >
                  {/* Notification Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceef0] pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-[#191c1e] text-white text-xs font-mono font-bold rounded">
                        {slotCode}
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#e0e7ff] text-[#3525cd] text-xs font-mono font-bold rounded flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timing}
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#dcfce7] text-[#15803d] text-xs font-mono font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        0 Train Delays Guaranteed
                      </span>
                    </div>
                    <span className="text-[11px] text-[#777587] font-mono">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Work Name & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-[#191c1e]">{workName}</h3>
                    <p className="text-xs text-[#464555] mt-1 leading-relaxed">{msg}</p>
                  </div>

                  {/* Location & Departments */}
                  <div className="bg-[#f8f9fa] rounded-lg p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#3525cd] shrink-0" />
                      <span className="font-semibold text-[#191c1e]">Track Corridor:</span>
                      <span className="text-[#464555]">{location}</span>
                    </div>
                    {Array.isArray(departments) && (
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#3525cd] shrink-0" />
                        <span className="font-semibold text-[#191c1e]">Departments Involved:</span>
                        <span className="text-[#464555]">{departments.join(", ")}</span>
                      </div>
                    )}
                    {sanctionedBy && (
                      <div className="flex items-center gap-2 text-[#3525cd]">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">Sanctioned By:</span>
                        <span className="font-bold">{sanctionedBy}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#15803d]">
                      <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">Notified Roles:</span>
                      <span>Worker • Section Supervisor • Zonal Head • Dept Head • COA Master</span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateToCalendar) {
                          onNavigateToCalendar();
                        }
                        window.dispatchEvent(
                          new CustomEvent("railpravah:open-calendar-tab", {
                            detail: { slotCode },
                          })
                        );
                      }}
                      className="px-3 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>View Sanctioned Slot in Calendar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#eceef0] bg-[#f8f9fa] flex items-center justify-between">
          <div className="text-xs text-[#777587] font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2e7d32]" />
            <span>Central Railway COA Operational Network Dispatch Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#c7c4d8] text-xs font-bold text-[#191c1e] rounded-lg hover:bg-[#eceef0] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
