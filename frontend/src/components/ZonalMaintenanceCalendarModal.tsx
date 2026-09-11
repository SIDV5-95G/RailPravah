import React, { useState } from "react";
import { MaintenanceSchedulePlan, MaintenancePlanSlot } from "../types";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Layers,
  FileText,
  Info,
  CalendarDays,
  List,
} from "lucide-react";

interface ZonalMaintenanceCalendarModalProps {
  plan: MaintenanceSchedulePlan;
  onClose: () => void;
}

export const ZonalMaintenanceCalendarModal: React.FC<ZonalMaintenanceCalendarModalProps> = ({
  plan,
  onClose,
}) => {
  // View mode: "week" | "month" | "list"
  const defaultMode = plan.scheduleType === "monthly" ? "month" : "week";
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">(defaultMode);
  const [selectedSlot, setSelectedSlot] = useState<MaintenancePlanSlot | null>(
    plan.slots[0] || null
  );

  // Month parsing for Month View
  const baseDate = plan.slots[0] ? new Date(plan.slots[0].date) : new Date(2026, 8, 7);
  const [currentYear, setCurrentYear] = useState(baseDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(baseDate.getMonth()); // 0-11

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  // Map of date string -> slots
  const slotsByDate: { [dateStr: string]: MaintenancePlanSlot[] } = {};
  plan.slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });

  // Helper for Weekly View: generate 7 days for the schedule
  const weekDays = React.useMemo(() => {
    if (plan.slots.length === 0) return [];
    // Find earliest slot date
    const sortedSlots = [...plan.slots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startDate = new Date(sortedSlots[0].date);
    // Align to Monday of that week
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(startDate.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().substring(0, 10);
      days.push({
        dateStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDayName: d.toLocaleDateString("en-US", { weekday: "long" }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        isToday: dateStr === new Date().toISOString().substring(0, 10),
        slots: slotsByDate[dateStr] || [],
      });
    }
    return days;
  }, [plan.slots]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#c7c4d8]/80 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#191c1e] to-[#2b2d42] text-white p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#3525cd] text-white flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                COA Sanctioned Plan
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {plan.periodLabel || `${plan.scheduleType.toUpperCase()} PLAN`}
              </span>
              <span className="text-xs text-white/60 font-mono">
                Sanction Ref: {plan.sanctionCode}
              </span>
            </div>

            {/* Task Name & Description Prominently Displayed */}
            <div className="pt-1">
              <span className="text-[11px] uppercase tracking-wider text-white/60 font-bold block">
                Scheduled Maintenance Task:
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight break-words">
                {plan.taskName}
              </h2>
            </div>

            <p className="text-xs text-white/80 leading-relaxed max-w-3xl pt-0.5">
              <strong className="text-white/95">Work Description & Scope:</strong> {plan.description}
            </p>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Schedule Notice"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Metadata Strip */}
        <div className="bg-[#f8f9fa] border-b border-[#eceef0] px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[#464555]">
            <span className="flex items-center gap-1 font-semibold text-[#191c1e]">
              <Layers className="w-3.5 h-3.5 text-[#3525cd]" />
              <span>Dept: <strong>{plan.department}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#777587]" />
              <span>Corridor: <strong>{plan.trackArea}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#777587]" />
              <span>Total Slots: <strong>{plan.slots.length} Blocks</strong></span>
            </span>
            <span>•</span>
            <span className="text-[#777587]">
              Issued By: <strong>{plan.dispatchedBy}</strong>
            </span>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1 bg-[#e2dfff]/60 p-1 rounded-lg border border-[#c7c4d8]/40">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "week"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#3525cd] hover:bg-white/60"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week Format</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "month"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#3525cd] hover:bg-white/60"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month Format</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-[#3525cd] text-white shadow-xs"
                  : "text-[#3525cd] hover:bg-white/60"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Slot Roster</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ================================================================= */}
          {/* WEEKLY CALENDAR VIEW FORMAT                                      */}
          {/* ================================================================= */}
          {viewMode === "week" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#3525cd]" />
                    <span>Weekly Maintenance Calendar for: {plan.taskName}</span>
                  </h3>
                  <p className="text-[11px] text-[#777587]">
                    7-Day possession schedule synchronized with Central Railway Traffic Dispatch.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#3525cd] bg-[#e2dfff] px-2.5 py-1 rounded-md">
                  7-Day Continuous Cycle
                </span>
              </div>

              {/* 7-Day Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {weekDays.map((day) => {
                  const hasSlots = day.slots.length > 0;
                  const isSelected = selectedSlot && day.slots.some((s) => s.id === selectedSlot.id);

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => {
                        if (hasSlots) {
                          setSelectedSlot(day.slots[0]);
                        }
                      }}
                      className={`min-h-[140px] p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#f3e8ff] border-[#7c3aed] ring-2 ring-[#7c3aed]/40 shadow-sm"
                          : hasSlots
                          ? "bg-white border-[#3525cd]/40 hover:border-[#3525cd] shadow-xs cursor-pointer hover:bg-[#f8fafc]"
                          : "bg-[#f8f9fa] border-[#eceef0] opacity-65"
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#eceef0]">
                        <span className="font-bold text-xs uppercase text-[#464555]">
                          {day.dayName}
                        </span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            hasSlots
                              ? "bg-[#3525cd] text-white"
                              : "text-[#777587]"
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      {/* Slot Content */}
                      <div className="py-2 flex-1 space-y-1.5">
                        {hasSlots ? (
                          day.slots.map((s) => (
                            <div
                              key={s.id}
                              className="p-1.5 rounded-lg bg-[#e2dfff] border border-[#3525cd]/20 text-[11px] space-y-1"
                            >
                              <div className="flex items-center gap-1 text-[#3525cd] font-bold">
                                <Clock className="w-3 h-3" />
                                <span className="font-mono text-[10px]">{s.startTime} - {s.endTime}</span>
                              </div>
                              <div className="font-semibold text-[#191c1e] text-[10px] line-clamp-2">
                                {s.taskName}
                              </div>
                              <span className="inline-block px-1.5 py-0.2 bg-[#3525cd] text-white text-[9px] font-bold rounded">
                                Sanctioned
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center justify-center text-[10px] text-[#a09eaf] italic text-center py-4">
                            Normal traffic (No block)
                          </div>
                        )}
                      </div>

                      {/* Day Footer */}
                      <div className="text-[10px] font-mono text-[#777587] text-center pt-1 border-t border-[#eceef0]/60">
                        {day.monthName} {day.dayNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MONTHLY CALENDAR VIEW FORMAT                                     */}
          {/* ================================================================= */}
          {viewMode === "month" && (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[#191c1e]">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <span className="text-xs text-[#777587]">
                    Monthly Possession Plan: <strong>{plan.taskName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear((y) => y - 1);
                      } else {
                        setCurrentMonth((m) => m - 1);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#eceef0] text-[#191c1e] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear((y) => y + 1);
                      } else {
                        setCurrentMonth((m) => m + 1);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#eceef0] text-[#191c1e] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="border border-[#c7c4d8]/70 rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 bg-[#f2f4f6] text-[#464555] text-[11px] font-bold uppercase text-center border-b border-[#c7c4d8]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                    <div key={w} className="py-2">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-[#eceef0] text-xs">
                  {/* Leading empty days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[75px] bg-[#f8f9fa]/50 p-2" />
                  ))}

                  {/* Days in Month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const slotsForDay = slotsByDate[dateStr] || [];
                    const hasSlots = slotsForDay.length > 0;
                    const isSelected = selectedSlot && slotsForDay.some((s) => s.id === selectedSlot.id);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => {
                          if (hasSlots) {
                            setSelectedSlot(slotsForDay[0]);
                          }
                        }}
                        className={`min-h-[75px] p-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#f3e8ff] ring-2 ring-[#7c3aed] ring-inset"
                            : hasSlots
                            ? "bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer"
                            : "hover:bg-[#f8f9fa]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-bold ${
                              hasSlots ? "text-[#3525cd]" : "text-[#777587]"
                            }`}
                          >
                            {dayNum}
                          </span>
                          {hasSlots && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>

                        {hasSlots ? (
                          <div className="mt-1 space-y-1">
                            {slotsForDay.map((s) => (
                              <div
                                key={s.id}
                                className="p-1 rounded bg-[#3525cd] text-white text-[9px] font-bold leading-tight truncate shadow-2xs"
                                title={`${s.taskName} (${s.startTime} - ${s.endTime})`}
                              >
                                {s.startTime}-{s.endTime} • Block
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SLOT ROSTER / LIST VIEW FORMAT                                   */}
          {/* ================================================================= */}
          {viewMode === "list" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <List className="w-4 h-4 text-[#3525cd]" />
                <span>Chronological Slot Possession Roster</span>
              </h3>

              <div className="space-y-2.5">
                {plan.slots.map((s, idx) => {
                  const isSelected = selectedSlot?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSlot(s)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#f3e8ff] border-[#7c3aed] ring-2 ring-[#7c3aed]/40 shadow-xs"
                          : "bg-white border-[#eceef0] hover:border-[#3525cd]/40 hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#e2dfff] text-[#3525cd] flex flex-col items-center justify-center font-mono shrink-0">
                          <span className="text-[10px] uppercase font-bold leading-none">{s.dayName.substring(0, 3)}</span>
                          <span className="text-sm font-extrabold leading-none mt-0.5">{s.date.split("-")[2]}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#191c1e]">
                              Shift #{idx + 1}: {s.taskName}
                            </span>
                            <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              Sanctioned
                            </span>
                          </div>
                          <p className="text-xs text-[#464555] line-clamp-1 mt-0.5">
                            {s.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#777587] font-mono mt-1">
                            <span>Window: {s.startTime} – {s.endTime} IST</span>
                            <span>•</span>
                            <span>Track: {s.trackArea}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlot(s);
                        }}
                        className="px-3 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-md hover:bg-[#4f46e5] self-start sm:self-auto cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SELECTED SLOT INSPECTOR CARD                                     */}
          {/* ================================================================= */}
          {selectedSlot && (
            <div className="bg-gradient-to-br from-[#f8f9fa] to-[#eceef0] border border-[#c7c4d8]/80 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c7c4d8]/60 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#7c3aed] bg-[#f3e8ff] px-2 py-0.5 rounded">
                    Selected Possession Slot Details
                  </span>
                  <h4 className="text-base font-bold text-[#191c1e] mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#3525cd]" />
                    <span>
                      {selectedSlot.dayName}, {selectedSlot.date}: {selectedSlot.startTime} – {selectedSlot.endTime} IST
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    COA Confirmed
                  </span>
                </div>
              </div>

              {/* Task Details for this specific slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#777587] block">
                      Target Task:
                    </span>
                    <p className="text-xs font-bold text-[#191c1e]">{selectedSlot.taskName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#777587] block">
                      Detailed Task Scope & Reason:
                    </span>
                    <p className="text-xs text-[#464555] leading-relaxed">{selectedSlot.description}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#777587] block">
                      Track Section & Direction:
                    </span>
                    <p className="text-xs font-semibold text-[#191c1e]">{selectedSlot.trackArea}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-white/70 p-3 rounded-lg border border-[#c7c4d8]/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777587]">Department:</span>
                    <strong className="text-[#191c1e]">{selectedSlot.department}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777587]">Machinery & Gang:</span>
                    <strong className="text-[#191c1e]">
                      {selectedSlot.machineryGangs || "Dedicated Section Gang + Machinery"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777587]">Caution Order:</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px]">
                      {selectedSlot.cautionOrder || "30 km/h on UP/DOWN line"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777587]">Train Impact:</span>
                    <span className="font-mono text-[#191c1e]">
                      {selectedSlot.trainsAffected ? `${selectedSlot.trainsAffected} mail/suburban trains` : "Minimal suburban impact"}
                    </span>
                  </div>
                </div>
              </div>

              {plan.specialInstructions && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>COA Special Traffic Directive:</strong> {plan.specialInstructions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f2f4f6] px-5 py-3 border-t border-[#c7c4d8] flex items-center justify-between text-xs">
          <span className="text-[#777587] font-mono">
            Plan Reference: <strong>{plan.sanctionCode}</strong> • Central Railway Mumbai Division
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#191c1e] hover:bg-[#3525cd] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Calendar View
          </button>
        </div>
      </div>
    </div>
  );
};
