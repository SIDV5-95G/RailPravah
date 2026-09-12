import React, { useState, useMemo, useEffect } from "react";
import { CalendarBlock } from "../types";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Zap,
  Radio,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Wrench,
  Eye,
  ArrowRight,
  X,
  Filter,
  Users,
  Compass,
} from "lucide-react";

export interface ScheduledCalendarWorkItem {
  id: string;
  slotCode: string;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  durationHours: number;
  durationLabel: string;
  title: string;
  category: "P-Way" | "TRD / OHE" | "S&T" | "Civil / USFD" | "Operations";
  departmentLabel: string;
  location: string;
  trackSection: string;
  kilometerPost: string;
  workDescription: string;
  machineryGangs: string;
  priority: "Critical" | "High" | "Medium" | "Low" | "Emergency";
  status: "In-Progress" | "Sanctioned" | "Upcoming" | "Completed" | "Pending";
  authorizedPersonnel: string;
  personnelDesignation?: string;
  contactPhone?: string;
  cautionOrder?: string;
  powerCutRequired?: boolean;
  powerStatus?: string;
  tools?: string[];
  safetyBrief?: string[];
  delayImpact?: string;
  isCluster?: boolean;
  departments?: string[];
  principlesCompliance?: {
    trainDelayImpact?: string;
    multiDeptClustering?: string;
    assetDowntimeMinimized?: string;
  };
}

export interface DayCalendarSchedule {
  dateString: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayName: string;
  dayNumber: number;
  monthName: string;
  monthNumber: number; // 0-11
  year: number;
  isSunday: boolean;
  totalHours: number;
  workItems: ScheduledCalendarWorkItem[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper to generate realistic railway schedule for any day
function generateBaseScheduleForDate(year: number, month: number, day: number): DayCalendarSchedule {
  const dateObj = new Date(year, month, day);
  const dayOfWeek = dateObj.getDay();
  const isSunday = dayOfWeek === 0;
  const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    dateString,
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    dayNumber: day,
    monthName: MONTH_NAMES[month],
    monthNumber: month,
    year,
    isSunday,
    totalHours: 0,
    workItems: [],
  };
}

export interface UnifiedDailyScheduleCalendarProps {
  role?: "coa" | "zonal" | "department" | "supervisor" | "worker";
  roleTitle?: string;
  calendarBlocks?: CalendarBlock[];
  defaultYear?: number;
  defaultMonth?: number; // 0-indexed (8 = September)
  defaultDay?: number;
  onNavigateToBlockDetail?: (blockId: string) => void;
}

export const UnifiedDailyScheduleCalendar: React.FC<UnifiedDailyScheduleCalendarProps> = ({
  role = "coa",
  roleTitle = "COA Control Office Application",
  calendarBlocks,
  defaultYear,
  defaultMonth,
  defaultDay,
  onNavigateToBlockDetail,
}) => {
  const today = useMemo(() => new Date(), []);
  const initialYear = defaultYear ?? today.getFullYear();
  const initialMonth = defaultMonth ?? today.getMonth(); // 0-indexed
  const initialDay = defaultDay ?? today.getDate();

  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "day">("month");

  // Filter & Search State
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Modal State
  const [inspectModalItem, setInspectModalItem] = useState<ScheduledCalendarWorkItem | null>(null);

  // Live database calendar blocks synchronization
  const [fetchedBlocks, setFetchedBlocks] = useState<CalendarBlock[]>([]);
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await fetch(`/api/coa/calendar?year=${currentYear}&month=${currentMonth + 1}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.blocks)) {
          setFetchedBlocks(data.blocks);
        }
      } catch (err) {
        console.warn("Could not load /api/coa/calendar:", err);
      }
    };
    loadBlocks();
    // Refresh calendar periodically every 2 minutes (120,000ms)
    const interval = setInterval(loadBlocks, 120000);
    return () => clearInterval(interval);
  }, [currentYear, currentMonth]);

  // Combine parent-provided blocks and live database fetched blocks with robust deduplication
  const effectiveCalendarBlocks = useMemo(() => {
    const blockMap = new Map<string, CalendarBlock>();
    const all = [
      ...(calendarBlocks && Array.isArray(calendarBlocks) ? calendarBlocks : []),
      ...fetchedBlocks,
    ];

    all.forEach((b) => {
      // Determine canonical key
      const descSlot = b.description?.match(/(SLOT-[A-Z0-9\-]+|CLUSTER-[A-Z0-9\-]+)/i)?.[0];
      const slotCode = (b as any).slotCode || descSlot || '';
      const normSlot = slotCode.toUpperCase().trim();

      let key = b.id;
      if (normSlot && normSlot !== 'SLOT-' && !normSlot.startsWith('SLOT-PRV-')) {
        key = `slot_${normSlot}_${b.date || ''}`;
      } else if (b.station && b.date && b.startTime) {
        key = `loc_${b.station}_${b.date}_${b.startTime}_${b.endTime || ''}`;
      }

      if (blockMap.has(key)) {
        const existing = blockMap.get(key)!;
        const existingSlot = (existing as any).slotCode;
        const newSlot = (b as any).slotCode;
        // Keep the one with explicit slotCode or richer metadata
        if (!existingSlot && newSlot) {
          blockMap.set(key, b);
        }
      } else {
        blockMap.set(key, b);
      }
    });

    return Array.from(blockMap.values());
  }, [calendarBlocks, fetchedBlocks]);

  // Total days in currently selected month & year
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of week for current month (0 = Sun, 1 = Mon, ... 6 = Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Helper to parse duration hours from start & end time
  const getDurationHours = (start?: string, end?: string): number => {
    if (!start || !end) return 2.5;
    const [sh, sm] = start.split(":").map((n) => parseInt(n, 10) || 0);
    const [eh, em] = end.split(":").map((n) => parseInt(n, 10) || 0);
    let dur = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (dur <= 0) dur += 24;
    return Math.round(dur * 10) / 10 || 2.5;
  };

  // Generate calendar days for current month with rich data merged from database
  const calendarDays = useMemo(() => {
    const days: DayCalendarSchedule[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const schedule = generateBaseScheduleForDate(currentYear, currentMonth, d);

      // Merge all database `calendarBlocks` (including WhySlot approved AI proposals & emergency possessions)
      if (effectiveCalendarBlocks.length > 0) {
        const matchingBlocks = effectiveCalendarBlocks.filter((b) => b.date === schedule.dateString);
        if (matchingBlocks.length > 0) {
          const mappedBlocks: ScheduledCalendarWorkItem[] = matchingBlocks.map((b, idx) => {
            const deptStr = (b.department || "").toLowerCase();
            const isCluster = (b as any).isCluster || deptStr.includes("+") || deptStr.includes("&") || (b.title && b.title.toLowerCase().includes("cluster"));
            let cat: "P-Way" | "TRD / OHE" | "S&T" | "Civil / USFD" = "P-Way";
            if (deptStr.includes("trd") || deptStr.includes("traction") || deptStr.includes("electrical")) {
              cat = "TRD / OHE";
            } else if (deptStr.includes("s&t") || deptStr.includes("signal") || deptStr.includes("telecom")) {
              cat = "S&T";
            } else if (deptStr.includes("civil") || deptStr.includes("bridge") || deptStr.includes("usfd")) {
              cat = "Civil / USFD";
            }

            const isEmergency = b.priority === "Emergency" || b.status === "emergency";
            const isApproved = b.status === "approved";
            const taskTitle = (b as any).taskName || b.title;
            const taskDesc = b.description || taskTitle;
            const durHours = getDurationHours(b.startTime, b.endTime);
            const rawSlotCode = (b as any).slotCode || b.description?.match(/(SLOT-[A-Z0-9\-]+|CLUSTER-[A-Z0-9\-]+)/i)?.[0];
            const cleanSlotCode = b.clusterId ? `BLK-CR-${b.clusterId}` : (rawSlotCode || `SLOT-PRV-${b.id.substring(0, 8)}`);

            return {
              id: `block-${b.id}-${idx}`,
              slotCode: cleanSlotCode,
              timeSlot: `${b.startTime} – ${b.endTime} IST`,
              startTime: b.startTime,
              endTime: b.endTime,
              durationHours: durHours,
              durationLabel: `${durHours} hours (${b.startTime} to ${b.endTime})`,
              title: taskTitle,
              category: cat,
              isCluster,
              departmentLabel: b.department || "Multi-Department Combined",
              departments: (b as any).departments || (b.department ? b.department.split(/[\+\&]/).map((s: string) => s.trim()) : ["Engineering"]),
              location: b.station,
              trackSection: b.station,
              kilometerPost: "Designated Sanctioned Corridor Sector",
              workDescription: taskDesc,
              machineryGangs: (b as any).machineryGangs || (isCluster ? `Integrated Joint Gangs (${b.department})` : `Combined Gang (${b.department})`),
              priority: isEmergency ? "Emergency" : b.priority === "Critical" ? "Critical" : "High",
              status: isEmergency ? "In-Progress" : isApproved ? "Sanctioned" : "Upcoming",
              authorizedPersonnel: "COA Master Traffic Controller (प्रवाहPlan Sanctioned)",
              personnelDesignation: "Central Railway Traffic Control Operations",
              contactPhone: "+91 22 2262 0123",
              cautionOrder: (b as any).cautionOrder || (isCluster
                ? "Speed restriction active; 0 train delays verified under synchronized multi-department possession."
                : (b.trainsAffected && b.trainsAffected > 0
                  ? `Speed restriction active; ${b.trainsAffected} mail/freight trains safely regulated.`
                  : "Zero passenger trains affected. Scheduled in night shadow lull.")),
              powerCutRequired: deptStr.includes("ohe") || deptStr.includes("trd"),
              powerStatus: deptStr.includes("ohe") || deptStr.includes("trd")
                ? "25kV OHE Power Cut Isolated & Earthed"
                : "Track Live with Protected Safety Detonators",
              delayImpact: isCluster
                ? "0 train delays: Combined multi-department possession halved track occupation time."
                : "0 regular suburban train delays. Synchronized under Unified Corridor Matrix.",
              principlesCompliance: {
                trainDelayImpact: "0 Regular Train Delays: Night shadow window bypasses suburban peak commuters.",
                multiDeptClustering: isCluster ? `Single Slot for Multiple Departments (${b.department}) synchronized.` : undefined,
                assetDowntimeMinimized: "Asset downtime compressed significantly under unified possession.",
              },
            };
          });

          schedule.workItems = mappedBlocks;
        }
      }

      // Calculate total hours scheduled for this day
      schedule.totalHours = Math.round(schedule.workItems.reduce((acc, item) => acc + item.durationHours, 0) * 10) / 10;
      days.push(schedule);
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, effectiveCalendarBlocks]);

  // Active selected day's schedule
  const activeDaySchedule = useMemo(() => {
    const found = calendarDays.find((d) => d.dayNumber === selectedDay);
    return found || calendarDays[0] || generateBaseScheduleForDate(currentYear, currentMonth, 1);
  }, [calendarDays, selectedDay, currentYear, currentMonth]);

  // Filtered work items for selected day based on category, status, and search query
  const filteredWorkItems = useMemo(() => {
    return activeDaySchedule.workItems.filter((item) => {
      const matchCat =
        categoryFilter === "ALL" ||
        item.category === categoryFilter ||
        (categoryFilter === "P-Way" && item.category === "P-Way") ||
        (categoryFilter === "TRD" && item.category === "TRD / OHE") ||
        (categoryFilter === "S&T" && item.category === "S&T") ||
        (categoryFilter === "Civil" && item.category === "Civil / USFD");

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "In-Progress" && (item.status === "In-Progress" || item.priority === "Emergency")) ||
        (statusFilter === "Sanctioned" && item.status === "Sanctioned") ||
        (statusFilter === "Upcoming" && (item.status === "Upcoming" || item.status === "Pending"));

      const matchSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slotCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.workDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.machineryGangs.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchStatus && matchSearch;
    });
  }, [activeDaySchedule, categoryFilter, statusFilter, searchQuery]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleJumpToCurrentMonth = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September 2026 (app timeframe)
    setSelectedDay(2);
  };

  const handleJumpToAugust = () => {
    setCurrentYear(2026);
    setCurrentMonth(7); // August 2026
    setSelectedDay(29);
  };

  // Role Accent Styling
  const getRoleTheme = () => {
    switch (role) {
      case "zonal":
        return {
          badgeBg: "bg-[#f3e8ff]",
          badgeText: "text-[#7c3aed]",
          borderAccent: "border-[#7c3aed]",
          primaryBg: "bg-[#7c3aed]",
          primaryHover: "hover:bg-[#6d28d9]",
          lightBg: "bg-[#f3e8ff]",
          textAccent: "text-[#7c3aed]",
          ringAccent: "ring-[#7c3aed]",
          tag: "ZONAL HEAD MASTER ROSTER",
        };
      case "department":
        return {
          badgeBg: "bg-[#ffe4e6]",
          badgeText: "text-[#be123c]",
          borderAccent: "border-[#be123c]",
          primaryBg: "bg-[#be123c]",
          primaryHover: "hover:bg-[#9f1239]",
          lightBg: "bg-[#ffe4e6]",
          textAccent: "text-[#be123c]",
          ringAccent: "ring-[#be123c]",
          tag: "DEPARTMENT SANCTIONS ROSTER",
        };
      case "supervisor":
        return {
          badgeBg: "bg-[#dbeafe]",
          badgeText: "text-[#1e40af]",
          borderAccent: "border-[#1e40af]",
          primaryBg: "bg-[#1e40af]",
          primaryHover: "hover:bg-[#1d4ed8]",
          lightBg: "bg-[#dbeafe]",
          textAccent: "text-[#1e40af]",
          ringAccent: "ring-[#1e40af]",
          tag: "SUPERVISOR SECTION ROSTER",
        };
      case "coa":
      default:
        return {
          badgeBg: "bg-[#e2dfff]",
          badgeText: "text-[#3525cd]",
          borderAccent: "border-[#3525cd]",
          primaryBg: "bg-[#3525cd]",
          primaryHover: "hover:bg-[#4f46e5]",
          lightBg: "bg-[#e2dfff]",
          textAccent: "text-[#3525cd]",
          ringAccent: "ring-[#3525cd]",
          tag: "COA MASTER CORRIDOR POSSESSION ROSTER",
        };
    }
  };

  const theme = getRoleTheme();

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "P-Way":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "TRD / OHE":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "S&T":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "Civil / USFD":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "P-Way":
        return <HardHat className="w-3.5 h-3.5 text-amber-700" />;
      case "TRD / OHE":
        return <Zap className="w-3.5 h-3.5 text-purple-700" />;
      case "S&T":
        return <Radio className="w-3.5 h-3.5 text-blue-700" />;
      case "Civil / USFD":
        return <Layers className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6" id="unified-daily-schedule-calendar">
      {/* 1. Header Card with Role Badge & Standard Directive */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eceef0] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 ${theme.badgeBg} ${theme.badgeText} text-[11px] font-mono font-bold rounded-md uppercase tracking-wider`}>
                {theme.tag}
              </span>
              <span className="text-xs text-[#777587] font-mono">
                Mumbai Central Railway Division Corridor Schedule
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#191c1e] mt-1 flex items-center gap-2">
              <CalendarIcon className={`w-5 h-5 ${theme.textAccent}`} />
              <span>{roleTitle} • Daily Maintenance & Possession Calendar</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] border border-[#cbd5e1] rounded-xl text-[#334155] font-semibold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3525cd]" />
              <span>Controlled Night Shadow & Sanctioned Possessions (2–4 Hours)</span>
            </div>
          </div>
        </div>

        {/* 2. Top Navigation Toolbar: Month Selectors, Prev/Next, Today Jump, View Toggles */}
        <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-3.5 rounded-xl">
          {/* Month & Year Selection Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#191c1e] font-mono">Month:</span>
              <select
                id="cal-month-select"
                value={currentMonth}
                onChange={(e) => {
                  setCurrentMonth(Number(e.target.value));
                  setSelectedDay(1);
                }}
                className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-bold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#3525cd] cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#191c1e] font-mono">Year:</span>
              <select
                id="cal-year-select"
                value={currentYear}
                onChange={(e) => {
                  setCurrentYear(Number(e.target.value));
                  setSelectedDay(1);
                }}
                className="px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-bold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#3525cd] cursor-pointer"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Prev / Next Month Buttons */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-white hover:bg-[#f1f5f9] text-[#475569] hover:text-[#0f172a] rounded-lg transition-colors border border-[#cbd5e1] cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-white hover:bg-[#f1f5f9] text-[#475569] hover:text-[#0f172a] rounded-lg transition-colors border border-[#cbd5e1] cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                title="Next Month"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Jump Buttons: Current Month / Today and August PravahPlan Slots */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleJumpToCurrentMonth}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs border ${
                currentMonth === 8 && currentYear === 2026
                  ? `${theme.primaryBg} text-white ${theme.borderAccent}`
                  : "bg-white text-[#3525cd] border-[#cbd5e1] hover:bg-[#f1f5f9]"
              }`}
            >
              <span>★ Current Month (Sep 2026)</span>
            </button>

            <button
              type="button"
              onClick={handleJumpToAugust}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs border ${
                currentMonth === 7 && currentYear === 2026
                  ? "bg-[#3525cd] text-white border-[#3525cd]"
                  : "bg-white text-[#464555] border-[#cbd5e1] hover:bg-[#f1f5f9]"
              }`}
              title="View August 2026 प्रवाहPlan Sanctioned Slots"
            >
              <span>Aug 2026 (PravahPlan Slots)</span>
            </button>

            {/* View Mode Toggle: Month vs Day Timeline */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-[#cbd5e1] ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => setCalendarViewMode("month")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  calendarViewMode === "month"
                    ? `${theme.primaryBg} text-white shadow-2xs`
                    : "text-[#64748b] hover:text-[#191c1e]"
                }`}
              >
                Month Grid
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode("day")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  calendarViewMode === "day"
                    ? `${theme.primaryBg} text-white shadow-2xs`
                    : "text-[#64748b] hover:text-[#191c1e]"
                }`}
              >
                Day Timeline
              </button>
            </div>
          </div>
        </div>

        {/* 3. Month Grid: Shows Work Directly on Cells with Month Calendar */}
        {calendarViewMode === "month" && (
          <div className="mt-5 space-y-5">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#191c1e] text-sm">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <span className="text-[11px] text-[#64748b] font-mono">
                    ({daysInMonth} Days Scheduled)
                  </span>
                </div>
                <div className="text-xs text-[#777587]">
                  Click any day to inspect full maintenance work & possession breakdown below.
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#64748b] pb-1">
                <div className="py-1">Sun</div>
                <div className="py-1">Mon</div>
                <div className="py-1">Tue</div>
                <div className="py-1">Wed</div>
                <div className="py-1">Thu</div>
                <div className="py-1">Fri</div>
                <div className="py-1">Sat</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {/* Empty offset days for start of month */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div
                    key={`blank-${idx}`}
                    className="min-h-[110px] rounded-xl bg-[#f8fafc]/50 border border-dashed border-[#e2e8f0] hidden lg:block opacity-40"
                  />
                ))}

                {/* Day Cells */}
                {calendarDays.map((day) => {
                  const isSelected = day.dayNumber === selectedDay;
                  const hasEmergency = day.workItems.some((w) => w.priority === "Emergency");
                  const hasLive = day.workItems.some((w) => w.status === "In-Progress");

                  return (
                    <div
                      key={`day-${day.dayNumber}`}
                      onClick={() => setSelectedDay(day.dayNumber)}
                      className={`min-h-[110px] p-2 rounded-xl flex flex-col justify-between text-left transition-all border cursor-pointer relative ${
                        isSelected
                          ? `bg-white ${theme.borderAccent} ring-2 ${theme.ringAccent} ring-offset-1 shadow-md`
                          : "bg-white text-[#1e293b] border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
                      }`}
                    >
                      {/* Cell Header: Day Number & Hours / Count Badge */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? `${theme.primaryBg} text-white`
                              : "text-[#1e293b] bg-[#f1f5f9]"
                          }`}
                        >
                          {String(day.dayNumber).padStart(2, "0")}
                        </span>

                        <div className="flex items-center gap-1">
                          {hasEmergency && (
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" title="Emergency Work" />
                          )}
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? `${theme.badgeBg} ${theme.badgeText}`
                                : "bg-[#f1f5f9] text-[#64748b]"
                            }`}
                          >
                            {day.totalHours > 0 ? `${day.totalHours}h` : `${day.workItems.length} tasks`}
                          </span>
                        </div>
                      </div>

                      {/* Scheduled Work Pills Rendered Directly on the Calendar Cell */}
                      <div className="space-y-1 my-1.5 overflow-hidden">
                        {day.workItems.slice(0, 2).map((item) => {
                          const isTrack = item.category === "P-Way";
                          const isTrd = item.category === "TRD / OHE";
                          const isSnt = item.category === "S&T";
                          const isCluster = item.isCluster || item.departmentLabel?.includes("+");

                          return (
                            <div
                              key={item.id}
                              className={`p-1 rounded text-[9.5px] font-semibold truncate leading-tight border transition-colors ${
                                item.priority === "Emergency"
                                  ? "bg-[#fee2e2] text-[#991b1b] border-[#f87171]"
                                  : isCluster
                                  ? "bg-gradient-to-r from-[#eef2ff] to-[#f5f3ff] text-[#4338ca] border-[#818cf8]"
                                  : isTrack
                                  ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                                  : isTrd
                                  ? "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]"
                                  : isSnt
                                  ? "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]"
                                  : "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]"
                              }`}
                              title={`${item.timeSlot} • ${item.title} (${item.location})`}
                            >
                              <div className="flex items-center justify-between text-[8.5px] font-mono leading-none mb-0.5 opacity-90">
                                <span>{item.startTime || item.timeSlot.split(" ")[0]}</span>
                                <span className={`uppercase font-bold ${isCluster ? "text-[#4338ca] font-extrabold" : ""}`}>
                                  {isCluster ? `CLUSTER • ${item.departmentLabel}` : item.category}
                                </span>
                              </div>
                              <div className="truncate font-medium">
                                {isCluster ? `[CLUSTER] ${item.departmentLabel}: ${item.title.replace(/\[.*?\]/g, '').trim()}` : item.title}
                              </div>
                            </div>
                          );
                        })}

                        {day.workItems.length > 2 && (
                          <div className="text-[9px] font-mono font-bold text-[#64748b] bg-[#f1f5f9] px-1 py-0.5 rounded text-center">
                            +{day.workItems.length - 2} more works...
                          </div>
                        )}
                      </div>

                      {/* Cell Footer: Section or Corridor */}
                      <div className="text-[9px] font-mono text-[#777587] truncate border-t border-[#eceef0] pt-0.5">
                        {day.workItems[0]?.location ? day.workItems[0].location.split("(")[0].trim() : "Standard Shadow"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend Bar */}
              <div className="pt-3 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-3 text-xs font-mono text-[#464555]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#fef3c7] border border-[#fde68a]" />
                  <span>P-Way Track Work</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f3e8ff] border border-[#e9d5ff]" />
                  <span>TRD Catenary 25kV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#e0f2fe] border border-[#bae6fd]" />
                  <span>Signal & Telecom (S&T)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#ecfdf5] border border-[#a7f3d0]" />
                  <span>Civil / USFD Flaw Testing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span>Emergency Restoration</span>
                </div>
              </div>
            </div>

            {/* 4. SELECTED DATE WORK DETAILS (IN THE SAME TAB, SIMILAR TO WORKER CALENDAR) */}
            <div className="bg-white border border-[#c7c4d8]/70 rounded-2xl p-5 shadow-xs space-y-4">
              {/* Selected Date Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eceef0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded-md">
                      SELECTED DATE WORK DETAILS
                    </span>
                    <span className="text-xs font-mono text-[#64748b]">
                      Controlled Night Shadow & Sanctioned Possession
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191c1e] mt-1">
                    {activeDaySchedule.dayName}, {activeDaySchedule.dayNumber} {activeDaySchedule.monthName} {activeDaySchedule.year}
                  </h3>
                  <p className="text-xs text-[#777587]">
                    {activeDaySchedule.workItems.length > 0
                      ? `${activeDaySchedule.workItems.length} sanctioned maintenance operation(s) scheduled for this day • Total ${activeDaySchedule.totalHours} hours`
                      : "No maintenance tasks scheduled for this day."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode("day")}
                    className={`px-3.5 py-2 ${theme.primaryBg} ${theme.primaryHover} text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Open Hourly Timeline</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar for Day's Works */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search this day's work by title, corridor, gang, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#3525cd]"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "P-Way", "TRD", "S&T", "Civil"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? `${theme.primaryBg} text-white ${theme.borderAccent} shadow-2xs`
                          : "bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  {["ALL", "Sanctioned", "In-Progress", "Upcoming"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer border ${
                        statusFilter === st
                          ? "bg-[#191c1e] text-white border-[#191c1e]"
                          : "bg-white text-[#64748b] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards Grid: Detailed List of Tasks for Selected Date */}
              {filteredWorkItems.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-[#f8fafc] rounded-xl border border-dashed border-[#c7c4d8]">
                  <div className="w-10 h-10 rounded-full bg-[#e2dfff] text-[#3525cd] flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <h5 className="text-sm font-bold text-[#191c1e]">No scheduled tasks match the selected filter</h5>
                  <p className="text-xs text-[#777587] max-w-md mx-auto">
                    Try resetting your category/status filters, or select a date with scheduled operations.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                      setSearchQuery("");
                      setSelectedDay(2); // Jump to active day
                    }}
                    className={`px-3.5 py-1.5 ${theme.primaryBg} text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs`}
                  >
                    Reset Filters & View 02 Sep
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWorkItems.map((item, index) => {
                    const isLive = item.status === "In-Progress" || item.priority === "Emergency";

                    return (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-[#c7c4d8]/80 hover:border-[#3525cd] rounded-xl p-4 shadow-xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          {/* Card Top: Badges & Timing */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-[#191c1e] text-white font-mono font-bold text-[10px] flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-mono font-bold text-xs bg-[#191c1e] text-white px-2 py-0.5 rounded-md">
                                {item.slotCode}
                              </span>
                              {item.isCluster && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white flex items-center gap-1 shadow-2xs">
                                  <Layers className="w-3 h-3" />
                                  <span>CLUSTER ({item.departmentLabel})</span>
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1 ${getCategoryBadgeColor(
                                  item.category
                                )}`}
                              >
                                {getCategoryIcon(item.category)}
                                <span>{item.isCluster ? item.departmentLabel : item.category}</span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.priority === "Emergency"
                                    ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                                    : item.priority === "Critical"
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "bg-blue-100 text-blue-900 border border-blue-300"
                                }`}
                              >
                                {item.priority}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isLive
                                    ? "bg-[#dcfce7] text-[#166534] animate-pulse"
                                    : "bg-[#fef9c3] text-[#a16207]"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-xs font-bold text-[#3525cd] bg-[#e2dfff]/60 px-2 py-1 rounded-md font-mono">
                                <Clock className="w-3.5 h-3.5 text-[#3525cd]" />
                                <span>{item.timeSlot}</span>
                              </div>
                            </div>
                          </div>

                          {/* Task Name & Scope */}
                          <div className="pt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587] block mb-0.5">
                              Task Name:
                            </span>
                            <h4 className="text-sm font-extrabold text-[#191c1e] leading-snug">
                              {item.title}
                            </h4>
                          </div>

                          {/* Work Description */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587] block mb-0.5">
                              Task Description:
                            </span>
                            <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                              {item.workDescription}
                            </p>
                          </div>

                          {/* Location & Machine Details Table */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#f8fafc] p-2.5 rounded-lg border border-[#eceef0]">
                            <div>
                              <span className="text-[#777587] block font-mono">Section & Station:</span>
                              <span className="font-bold text-[#191c1e] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#3525cd] shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </span>
                            </div>

                            <div>
                              <span className="text-[#777587] block font-mono">Machinery & Crew:</span>
                              <span className="font-semibold text-[#191c1e] truncate block">
                                {item.machineryGangs}
                              </span>
                            </div>

                            <div>
                              <span className="text-[#777587] block font-mono">Authorized In-Charge:</span>
                              <span className="font-semibold text-[#191c1e] truncate block">
                                {item.authorizedPersonnel}
                              </span>
                            </div>

                            <div>
                              <span className="text-[#777587] block font-mono">Train Delay Impact:</span>
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block text-[10px]">
                                0 Regular Train Delays
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Quick Actions */}
                        <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between gap-2">
                          <div className="text-[11px] font-mono text-[#64748b]">
                            {item.kilometerPost}
                          </div>
                          <button
                            type="button"
                            onClick={() => setInspectModalItem(item)}
                            className="px-2.5 py-1 text-xs font-bold text-[#3525cd] hover:bg-[#e2dfff]/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Full Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Day Timeline View (Hour-by-Hour schedule) */}
        {calendarViewMode === "day" && (
          <div className="mt-5 space-y-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#3525cd]" />
                  <div>
                    <h3 className="text-base font-bold text-[#191c1e]">
                      24-Hour Corridor Possession Timeline for {activeDaySchedule.dayName}, {activeDaySchedule.dayNumber} {activeDaySchedule.monthName} {activeDaySchedule.year}
                    </h3>
                    <p className="text-xs text-[#777587]">
                      Detailed chronological breakdown of possession blocks across Suburban Mumbai Corridors.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCalendarViewMode("month")}
                  className="px-3 py-1.5 text-xs font-bold text-[#3525cd] bg-[#e2dfff] hover:bg-[#d0cbff] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Month Grid</span>
                </button>
              </div>

              {/* Hourly Schedule Blocks */}
              <div className="space-y-3">
                {activeDaySchedule.workItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#c7c4d8]/70 bg-[#f8fafc] hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eceef0] pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-[#3525cd] text-white px-2 py-0.5 rounded-md">
                          {item.slotCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryBadgeColor(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-[#191c1e]">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#3525cd] bg-white px-2.5 py-1 rounded-md border border-[#cbd5e1]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.timeSlot}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#464555] leading-relaxed">
                      {item.workDescription}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[#777587] text-[11px] block font-mono">Location:</span>
                        <span className="font-semibold text-[#191c1e]">{item.location}</span>
                      </div>
                      <div>
                        <span className="text-[#777587] text-[11px] block font-mono">Machinery & Crew:</span>
                        <span className="font-semibold text-[#191c1e]">{item.machineryGangs}</span>
                      </div>
                      <div>
                        <span className="text-[#777587] text-[11px] block font-mono">Operational Safeguard:</span>
                        <span className="font-semibold text-emerald-700">0 Regular Train Delays</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Full Block Detail Modal */}
      {inspectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#c7c4d8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#f8fafc] to-white border-b border-[#eceef0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#3525cd] text-white px-2 py-0.5 rounded">
                      {inspectModalItem.slotCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getCategoryBadgeColor(inspectModalItem.category)}`}>
                      {inspectModalItem.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#191c1e] mt-1">
                    {inspectModalItem.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="p-1.5 hover:bg-[#f2f4f6] text-[#777587] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="p-3 bg-[#f8fafc] border border-[#eceef0] rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">Work Scope & Method Statement</span>
                <p className="text-xs text-[#191c1e] leading-relaxed">{inspectModalItem.workDescription}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-[#eceef0] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">Time Slot & Duration</span>
                  <div className="font-bold text-sm text-[#3525cd]">{inspectModalItem.timeSlot}</div>
                  <div className="text-[11px] text-[#464555]">Duration: {inspectModalItem.durationLabel}</div>
                </div>

                <div className="p-3 bg-white border border-[#eceef0] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">Corridor & Track Section</span>
                  <div className="font-bold text-sm text-[#191c1e]">{inspectModalItem.location}</div>
                  <div className="text-[11px] text-[#464555]">{inspectModalItem.kilometerPost}</div>
                </div>

                <div className="p-3 bg-white border border-[#eceef0] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">Machinery & Gang Deployment</span>
                  <div className="font-semibold text-xs text-[#191c1e]">{inspectModalItem.machineryGangs}</div>
                </div>

                <div className="p-3 bg-white border border-[#eceef0] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777587]">Authorized In-Charge</span>
                  <div className="font-semibold text-xs text-[#191c1e]">{inspectModalItem.authorizedPersonnel}</div>
                  <div className="text-[11px] text-[#777587]">{inspectModalItem.personnelDesignation}</div>
                  {inspectModalItem.contactPhone && (
                    <div className="text-[11px] font-mono text-[#3525cd]">Tel: {inspectModalItem.contactPhone}</div>
                  )}
                </div>
              </div>

              {/* Operations Safeguard & Principle Compliance */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">
                  Operations & Suburban Commuter Safeguard
                </span>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {inspectModalItem.cautionOrder || "Scheduled during historical low-traffic night window to guarantee 0 regular train cancellations."}
                </p>
                {inspectModalItem.powerStatus && (
                  <div className="text-[11px] text-emerald-800 font-mono mt-1">
                    Power Status: {inspectModalItem.powerStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8fafc] border-t border-[#eceef0] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectModalItem(null)}
                className="px-4 py-2 bg-[#191c1e] hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDailyScheduleCalendar;
