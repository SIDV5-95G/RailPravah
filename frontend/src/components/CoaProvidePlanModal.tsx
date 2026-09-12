import React, { useState } from "react";
import {
  ServiceRequestItem,
  MaintenanceSchedulePlan,
  MaintenancePlanSlot,
  MaintenancePeriodType,
} from "../types";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Send,
  Plus,
  Trash2,
  Layers,
  FileText,
  AlertCircle,
  CalendarDays,
  Check,
} from "lucide-react";

interface CoaProvidePlanModalProps {
  request: ServiceRequestItem;
  onClose: () => void;
  onDispatchPlan: (requestId: string, plan: MaintenanceSchedulePlan) => void;
}

export const CoaProvidePlanModal: React.FC<CoaProvidePlanModalProps> = ({
  request,
  onClose,
  onDispatchPlan,
}) => {
  const scheduleType: MaintenancePeriodType = request.timePeriodType || "weekly";
  const customLabel = request.customTimePeriod || "";

  // Helper to initialize default slots based on time period
  const initializeSlots = (): MaintenancePlanSlot[] => {
    const taskTitle = request.taskName || request.workType || request.description.substring(0, 40);
    const desc = request.description;
    const track = request.trackArea;
    const dept = request.department;

    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const d1 = new Date(now); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(now); d2.setDate(d2.getDate() + 3);
    const d3 = new Date(now); d3.setDate(d3.getDate() + 5);
    const d4 = new Date(now); d4.setDate(d4.getDate() + 7);

    if (scheduleType === "weekly") {
      // 3 shifts across a 7-day week
      return [
        {
          id: `slot-${Date.now()}-1`,
          date: fmt(d1),
          dayName: dayNames[d1.getDay()],
          startTime: "01:30",
          endTime: "04:30",
          timeSlot: "01:30 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Shift 1: Preparatory inspection & preliminary work. ${desc}`,
          status: "Sanctioned",
          machineryGangs: "Section Gang #4 + Equipment Truck",
          cautionOrder: "Speed restricted to 45 km/h",
          trainsAffected: 2,
        },
        {
          id: `slot-${Date.now()}-2`,
          date: fmt(d2),
          dayName: dayNames[d2.getDay()],
          startTime: "01:30",
          endTime: "04:30",
          timeSlot: "01:30 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Shift 2: Heavy engineering & component replacement. ${desc}`,
          status: "Sanctioned",
          machineryGangs: "Specialized Maintenance Vehicle",
          cautionOrder: "Speed restricted to 30 km/h",
          trainsAffected: 1,
        },
        {
          id: `slot-${Date.now()}-3`,
          date: fmt(d3),
          dayName: dayNames[d3.getDay()],
          startTime: "02:00",
          endTime: "05:00",
          timeSlot: "02:00 – 05:00 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Shift 3: Calibration, testing & track clearance.`,
          status: "Sanctioned",
          machineryGangs: "Track Testing Crew + Tower Car",
          cautionOrder: "Normal track speed restoration pending check",
          trainsAffected: 0,
        },
      ];
    } else if (scheduleType === "monthly") {
      // 4 cycles across upcoming month
      const m1 = new Date(now); m1.setDate(m1.getDate() + 2);
      const m2 = new Date(now); m2.setDate(m2.getDate() + 9);
      const m3 = new Date(now); m3.setDate(m3.getDate() + 16);
      const m4 = new Date(now); m4.setDate(m4.getDate() + 23);

      return [
        {
          id: `slot-${Date.now()}-1`,
          date: fmt(m1),
          dayName: dayNames[m1.getDay()],
          startTime: "01:00",
          endTime: "05:00",
          timeSlot: "01:00 – 05:00 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Week 1 Cycle: Initial corridor overhaul. ${desc}`,
          status: "Sanctioned",
          machineryGangs: "Heavy Machinery Gang A",
          cautionOrder: "30 km/h caution",
          trainsAffected: 4,
        },
        {
          id: `slot-${Date.now()}-2`,
          date: fmt(m2),
          dayName: dayNames[m2.getDay()],
          startTime: "01:00",
          endTime: "05:00",
          timeSlot: "01:00 – 05:00 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Week 2 Cycle: Second phase possession & component overhaul.`,
          status: "Sanctioned",
          machineryGangs: "Heavy Machinery Gang B",
          cautionOrder: "30 km/h caution",
          trainsAffected: 3,
        },
        {
          id: `slot-${Date.now()}-3`,
          date: fmt(m3),
          dayName: dayNames[m3.getDay()],
          startTime: "01:00",
          endTime: "05:00",
          timeSlot: "01:00 – 05:00 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Week 3 Cycle: Alignment stabilization & ballast packing.`,
          status: "Sanctioned",
          machineryGangs: "Tamping Machine Gang",
          cautionOrder: "45 km/h caution",
          trainsAffected: 3,
        },
        {
          id: `slot-${Date.now()}-4`,
          date: fmt(m4),
          dayName: dayNames[m4.getDay()],
          startTime: "01:30",
          endTime: "04:30",
          timeSlot: "01:30 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Week 4 Cycle: Final compliance review & full speed clearance test.`,
          status: "Sanctioned",
          machineryGangs: "Senior Inspection Unit",
          cautionOrder: "Normal speed restored",
          trainsAffected: 2,
        },
      ];
    } else if (scheduleType === "manual") {
      // 2 custom cycles over manual period
      return [
        {
          id: `slot-${Date.now()}-1`,
          date: fmt(d1),
          dayName: dayNames[d1.getDay()],
          startTime: "02:00",
          endTime: "04:30",
          timeSlot: "02:00 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Phase 1 (${customLabel || "Custom Period"}): ${desc}`,
          status: "Sanctioned",
          machineryGangs: "Specialist Squad",
          cautionOrder: "Caution order 40 km/h",
          trainsAffected: 2,
        },
        {
          id: `slot-${Date.now()}-2`,
          date: fmt(d4),
          dayName: dayNames[d4.getDay()],
          startTime: "02:00",
          endTime: "04:30",
          timeSlot: "02:00 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Phase 2 (${customLabel || "Custom Period"}): Finalization and handoff.`,
          status: "Sanctioned",
          machineryGangs: "Verification Crew",
          cautionOrder: "Caution order lifted",
          trainsAffected: 1,
        },
      ];
    } else {
      // None / Ad-hoc single slot
      return [
        {
          id: `slot-${Date.now()}-1`,
          date: fmt(d1),
          dayName: dayNames[d1.getDay()],
          startTime: "02:00",
          endTime: "04:30",
          timeSlot: "02:00 – 04:30 IST",
          trackArea: track,
          department: dept,
          taskName: taskTitle,
          description: `Single Scheduled Block: ${desc}`,
          status: "Sanctioned",
          machineryGangs: "Standard Section Team",
          cautionOrder: "Standard caution order",
          trainsAffected: 2,
        },
      ];
    }
  };

  const [slots, setSlots] = useState<MaintenancePlanSlot[]>(initializeSlots);
  const [specialInstructions, setSpecialInstructions] = useState(
    "Ensure OHE power isolation and earth bonding certificate before authorizing track gang. Train speed limited to 30 km/h on adjacent tracks."
  );
  const [sanctionCode] = useState(
    `COA-SANCT-${scheduleType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const getPeriodBadge = () => {
    switch (scheduleType) {
      case "weekly":
        return "Weekly Maintenance Plan (7-Day Calendar)";
      case "monthly":
        return "Monthly Maintenance Plan (Full Month Calendar)";
      case "manual":
        return `Custom Time Period Plan (${customLabel || "Manual Entry"})`;
      case "none":
        return "Ad-hoc / Single Window Maintenance";
    }
  };

  const handleAddSlot = () => {
    const taskTitle = request.taskName || request.workType || "Maintenance Block";
    const newSlot: MaintenancePlanSlot = {
      id: `slot-${Date.now()}`,
      date: "2026-09-15",
      dayName: "Tuesday",
      startTime: "02:00",
      endTime: "04:30",
      timeSlot: "02:00 – 04:30 IST",
      trackArea: request.trackArea,
      department: request.department,
      taskName: taskTitle,
      description: request.description,
      status: "Sanctioned",
      machineryGangs: "Assigned Maintenance Gang",
      cautionOrder: "Caution order in effect",
      trainsAffected: 2,
    };
    setSlots([...slots, newSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    if (slots.length <= 1) {
      alert("At least one scheduled slot is required in the maintenance plan.");
      return;
    }
    setSlots(slots.filter((s) => s.id !== id));
  };

  const handleUpdateSlot = (id: string, updates: Partial<MaintenancePlanSlot>) => {
    setSlots(
      slots.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.startTime || updates.endTime) {
          updated.timeSlot = `${updated.startTime} – ${updated.endTime} IST`;
        }
        if (updates.date) {
          const d = new Date(updates.date);
          if (!isNaN(d.getTime())) {
            updated.dayName = d.toLocaleDateString("en-US", { weekday: "long" });
          }
        }
        return updated;
      })
    );
  };

  const handleDispatch = () => {
    const taskName = request.taskName || request.workType || request.description.substring(0, 40);
    const plan: MaintenanceSchedulePlan = {
      scheduleType,
      periodLabel: getPeriodBadge(),
      startDate: slots[0]?.date || new Date().toISOString().split("T")[0],
      endDate: slots[slots.length - 1]?.date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      taskName,
      description: request.description,
      trackArea: request.trackArea,
      department: request.department,
      priority: request.priority,
      slots,
      dispatchedAt: new Date().toISOString().substring(0, 16).replace("T", " "),
      dispatchedBy: "COA Master Dispatch Desk (CSMT)",
      sanctionCode,
      specialInstructions,
    };

    onDispatchPlan(request.id, plan);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#c7c4d8]/80 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-[#191c1e] text-white p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#3525cd] text-white flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                COA Operations Office
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#ffdcc3] text-[#904d00]">
                {getPeriodBadge()}
              </span>
              <span className="text-xs text-[#777587] font-mono">
                Sanction Ref: {sanctionCode}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#3525cd]" />
              <span>Provide Maintenance Plan to Zonal Head</span>
            </h2>

            <p className="text-xs text-[#c7c4d8]">
              Formulate and sanction the requested {scheduleType} schedule in calendar format for the Zonal Head.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Summary Banner */}
        <div className="p-4 bg-[#f8f9fa] border-b border-[#eceef0] space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587]">
                Requested Task:
              </span>
              <h3 className="text-sm font-extrabold text-[#191c1e]">
                {request.taskName || "General Track Possession & Maintenance"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#e2dfff] text-[#3525cd]">
                {request.department}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ffdcc3] text-[#904d00]">
                {request.priority} Priority
              </span>
            </div>
          </div>

          <p className="text-xs text-[#464555] leading-relaxed">
            <strong>Work Description:</strong> {request.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#777587] font-mono pt-1">
            <span>Location: <strong>{request.trackArea}</strong></span>
            <span>•</span>
            <span>Requested Period: <strong>{scheduleType.toUpperCase()} {customLabel ? `(${customLabel})` : ""}</strong></span>
            <span>•</span>
            <span>Original Window: <strong>{request.preferredSlot}</strong></span>
          </div>
        </div>

        {/* Modal Body: Slot Builder & Calendar Formatter */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#3525cd]" />
                <span>
                  Configured Possession Slots ({slots.length} Blocks in {scheduleType.toUpperCase()} Calendar)
                </span>
              </h4>
              <p className="text-[11px] text-[#777587]">
                Adjust dates, timings, caution orders, and machinery allocations. These slots will appear in the Zonal Head's calendar.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSlot}
              className="px-3 py-1.5 bg-[#e2dfff] hover:bg-[#3525cd] text-[#3525cd] hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block Slot</span>
            </button>
          </div>

          {/* Slots List */}
          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="p-4 bg-white border border-[#c7c4d8]/70 rounded-xl space-y-3 shadow-2xs hover:border-[#3525cd]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#eceef0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#3525cd] text-white flex items-center justify-center font-mono text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#191c1e]">
                      {slot.dayName}, {slot.date} ({slot.startTime} – {slot.endTime} IST)
                    </span>
                  </div>

                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="text-[#ba1a1a] hover:text-red-700 p-1 rounded hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                      title="Remove Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => handleUpdateSlot(slot.id, { date: e.target.value })}
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#3525cd]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleUpdateSlot(slot.id, { startTime: e.target.value })}
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#3525cd]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleUpdateSlot(slot.id, { endTime: e.target.value })}
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#3525cd]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                      Machinery & Gang Allocation
                    </label>
                    <input
                      type="text"
                      value={slot.machineryGangs || ""}
                      onChange={(e) => handleUpdateSlot(slot.id, { machineryGangs: e.target.value })}
                      placeholder="e.g. Plasser BCM 800 + Section Gang"
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                      Caution Order & Traffic Speed
                    </label>
                    <input
                      type="text"
                      value={slot.cautionOrder || ""}
                      onChange={(e) => handleUpdateSlot(slot.id, { cautionOrder: e.target.value })}
                      placeholder="e.g. 30 km/h dead slow on UP line"
                      className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777587] mb-1">
                    Specific Task Scope for This Shift
                  </label>
                  <input
                    type="text"
                    value={slot.description}
                    onChange={(e) => handleUpdateSlot(slot.id, { description: e.target.value })}
                    className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-1.5 px-2.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* COA Special Traffic Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#464555] mb-1.5">
              COA Special Traffic Directives & Operating Instructions
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-lg p-2.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
              placeholder="Add safety conditions, power-cut clearance protocols, or suburban traffic bypass directives..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#f2f4f6] px-5 py-4 border-t border-[#c7c4d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#777587]">
            Sanctioning <strong>{slots.length} Possession Slots</strong> for Zonal Head Review.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#c7c4d8] text-[#464555] hover:bg-[#eceef0] font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDispatch}
              className="px-5 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Plan to Zonal Head</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
