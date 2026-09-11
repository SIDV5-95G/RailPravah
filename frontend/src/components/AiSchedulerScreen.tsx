import React, { useState, useEffect } from "react";
import appLogo from "../assets/logo.png";
import {
  MaintenanceBlock,
  HierarchyRole,
  DepartmentName,
  SubDepartmentName,
  CorridorStatus,
  MumbaiCorridor,
} from "../types";
import {
  MUMBAI_CENTRAL_LINE_CORRIDORS,
  DEPARTMENT_HIERARCHY_CONFIG,
  INITIAL_MUMBAI_BLOCKS,
} from "../mockData";
import { MumbaiCorridorMap } from "./MumbaiCorridorMap";
import { MumbaiDepartmentWorkload } from "./MumbaiDepartmentWorkload";
import { MumbaiBlockDetailModal } from "./MumbaiBlockDetailModal";
import { MumbaiCollaborativeOpportunityModal } from "./MumbaiCollaborativeOpportunityModal";
import { MumbaiNotificationsDrawer } from "./MumbaiNotificationsDrawer";
import {
  Sparkles,
  Layers,
  Check,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Wrench,
  Zap,
  Radio,
  Train,
  Bell,
  Lock,
  Plus,
  ArrowRight,
  Maximize2,
  TrendingUp,
  Activity,
} from "lucide-react";

interface AiSchedulerScreenProps {
  timelineBlocks?: any[];
  onAddBlock?: (block: any) => void;
  onNavigateToWhySlot?: (slotCode?: string) => void;
  onNavigateToWhatIf?: (slotCode?: string) => void;
  onNavigateToConflictGuard?: () => void;
  onOptimizeScheduleWithAI?: () => Promise<void>;
  isOptimizing?: boolean;
}

export const AiSchedulerScreen: React.FC<AiSchedulerScreenProps> = ({
  onNavigateToWhySlot,
  onNavigateToWhatIf,
  onNavigateToConflictGuard,
  onOptimizeScheduleWithAI,
  isOptimizing = false,
}) => {
  // 1. Top Bar State: Date, Division, Corridor, Department, Role, View
  const [selectedDate, setSelectedDate] = useState("2026-08-29");
  const [selectedDivision] = useState("Mumbai Central / Central Railway");
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState("ALL");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("ALL");
  const [userRole, setUserRole] = useState<HierarchyRole>("COA");
  const [viewMode, setViewMode] = useState<"All Departments" | "My Department">("All Departments");
  const [userDepartment, setUserDepartment] = useState<DepartmentName>("Engineering");

  // 2. Schedule Data State
  const [blocks, setBlocks] = useState<MaintenanceBlock[]>(INITIAL_MUMBAI_BLOCKS);
  const [dbCorridors, setDbCorridors] = useState<MumbaiCorridor[]>(MUMBAI_CENTRAL_LINE_CORRIDORS);
  const [expandedCorridors, setExpandedCorridors] = useState<Record<string, boolean>>({
    "DR – GC": true,
    "GC – VK": true,
    "CSTM – BY": false,
    "BY – DR": false,
    "VK – TNA": false,
    "TNA – KYN": false,
  });

  // Fetch live corridors from database once on mount
  useEffect(() => {
    const loadCorridors = async () => {
      try {
        const res = await fetch("/api/coa/corridors");
        const data = await res.json();
        if (data.success && Array.isArray(data.corridors) && data.corridors.length > 0) {
          setDbCorridors(data.corridors);
        }
      } catch (err) {
        console.warn("Error fetching corridors:", err);
      }
    };
    loadCorridors();
  }, []);

  // 3. Modals & Drawers
  const [selectedBlockForModal, setSelectedBlockForModal] = useState<MaintenanceBlock | null>(null);
  const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);

  // 4. Feedback & Notifications
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "warning" | "info";
    text: string;
  } | null>(null);

  // 5. Interactive Time Shift State
  const [dragFeedback, setDragFeedback] = useState<{
    blockId: string;
    newSlot: string;
    conflicts: number;
    efficiency: string;
    aiRecommendation: string;
  } | null>(null);

  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  const currentTimeHour = 8.4; // 08:24 IST

  // Toggle corridor expansion
  const toggleCorridorExpand = (corridorCode: string) => {
    setExpandedCorridors((prev) => ({
      ...prev,
      [corridorCode]: !prev[corridorCode],
    }));
  };

  // Filtered corridors list
  const visibleCorridors = dbCorridors.filter((c) =>
    selectedCorridorFilter === "ALL" ? true : c.code === selectedCorridorFilter
  );

  // Filter blocks according to Department & View mode
  const getCorridorDepartmentBlocks = (corridorCode: string, dept: DepartmentName) => {
    return blocks.filter((b) => {
      if (b.corridor !== corridorCode) return false;
      if (b.department !== dept) return false;
      if (viewMode === "My Department" && b.department !== userDepartment) return false;
      if (selectedDepartmentFilter !== "ALL" && b.department !== selectedDepartmentFilter) return false;
      return true;
    });
  };

  // Accept GapSense AI Recommended Slot for DR-GC
  const handleAcceptAiRecommendedSlot = () => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === "blk-dr-gc-eng") {
          return {
            ...b,
            startHour: 1.5,
            durationHours: 3.0,
            status: "AI Optimized",
            type: "ai-planned",
            conflictsWith: [],
            aiRationale: "Accepted GapSense AI recommendation (01:30–04:30 IST, +85% Efficiency, Zero Collisions).",
            efficiencyGain: 85,
          };
        }
        return b;
      })
    );
    setToastMessage({
      type: "success",
      text: "GapSense AI Slot 01:30–04:30 applied to REQ-892 on DR–GC corridor (+85% Efficiency).",
    });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Accept Collaborative Mega Shadow Block
  const handleAcceptCollaborationPlan = () => {
    setBlocks((prev) => {
      // Replace independent DR-GC requests with one synchronized shadow block
      const filtered = prev.filter(
        (b) => b.id !== "blk-dr-gc-eng" && b.id !== "blk-dr-gc-elec" && b.id !== "blk-dr-gc-snt"
      );
      const unifiedMegaBlock: MaintenanceBlock = {
        id: "blk-dr-gc-unified",
        code: "CL-90 (DR-GC Joint)",
        title: "Dadar-Ghatkopar Joint Integrated Shadow Block",
        corridor: "DR – GC",
        trackLine: "Down Fast",
        department: "Engineering",
        subDepartment: "Track Maintenance",
        team: "Joint P-Way, TRD & S&T Combined Unit",
        activity: "Track Tamping",
        startHour: 1.5, // 01:30
        durationHours: 3.0, // 04:30
        status: "Approved",
        type: "clustered-task",
        priority: "High",
        isCollaborative: true,
        partnerDepartments: ["Engineering", "Electrical / Traction", "Signal & Telecom"],
        savedMinutes: 140,
        dependencies: {
          engineeringReady: true,
          electricalIsolationReady: true,
          signalProtectionReady: true,
          operationsApproved: true,
        },
        aiRationale: "3 Department Requests (Eng, Elec, S&T) synchronized into 1 common window with 0 train disruption.",
        efficiencyGain: 88,
      };
      return [unifiedMegaBlock, ...filtered];
    });
    setCollaborationModalOpen(false);
    setToastMessage({
      type: "success",
      text: "AI Collaborative Maintenance Plan accepted: 3 blocks unified into 1 common window (Saved 140 mins).",
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Update a single block from modal or inline interactions
  const handleUpdateBlock = (updatedBlock: MaintenanceBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
    setToastMessage({
      type: "info",
      text: `Block ${updatedBlock.code} updated successfully.`,
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inline Quick Shift Time / Simulate Drag Action
  const handleQuickShiftTime = (blockId: string, deltaHours: number) => {
    const target = blocks.find((b) => b.id === blockId);
    if (!target) return;

    const newStart = Math.max(0, Math.min(20, target.startHour + deltaHours));
    const newEnd = newStart + target.durationHours;

    const updatedBlocks = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          startHour: newStart,
        };
      }
      return b;
    });
    setBlocks(updatedBlocks);

    // AI Validation Impact feedback
    if (newStart >= 3.0 && newStart <= 5.0 && target.corridor === "DR – GC") {
      setDragFeedback({
        blockId: target.id,
        newSlot: `${newStart.toFixed(1)}h – ${newEnd.toFixed(1)}h`,
        conflicts: 2,
        efficiency: "-12%",
        aiRecommendation: "01:30 – 04:30 IST",
      });
    } else {
      setDragFeedback(null);
    }
  };

  // Get visual style for Gantt block
  const getBlockStyle = (block: MaintenanceBlock) => {
    const leftPercent = (block.startHour / 24) * 100;
    const widthPercent = (block.durationHours / 24) * 100;

    let bgClass = "bg-[#3525cd] text-white border-[#2715b5]";
    if (block.type === "clustered-task") {
      bgClass = "bg-[#006e1c] text-white border-[#005313] shadow-xs";
    } else if (block.type === "scheduled-train") {
      bgClass = "bg-[#31303e] text-white/95 border-[#1e1d28]";
    } else if (block.type === "conflict-rejected") {
      bgClass = "bg-[#ffdad6] text-[#ba1a1a] border-dashed border-[#ba1a1a]";
    } else if (block.department === "Electrical / Traction") {
      bgClass = "bg-[#d97706] text-white border-[#b45309]";
    } else if (block.department === "Signal & Telecom") {
      bgClass = "bg-[#0284c7] text-white border-[#0369a1]";
    }

    return {
      left: `${Math.max(0, Math.min(95, leftPercent))}%`,
      width: `${Math.max(4, Math.min(100 - leftPercent, widthPercent))}%`,
      bgClass,
    };
  };

  const departments: DepartmentName[] = [
    "Engineering",
    "Electrical / Traction",
    "Signal & Telecom",
    "Operations",
  ];

  return (
    <div id="mumbai-common-block-planner" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Division Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#3525cd] text-white font-mono">
              Central Railway • Mumbai Division
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e2dfff] text-[#3525cd] font-mono">
              One Common Block Planner
            </span>
            <span className="text-[11px] text-[#777587] font-mono">IST (UTC+05:30) • Real-time (08:24)</span>
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#191c1e] tracking-tight mt-1 flex items-center gap-2.5">
            <img
              src={appLogo}
              alt="Central Railway Logo"
              className="w-7 h-7 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <span>Mumbai Central Line Maintenance & Block Management System</span>
          </h1>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setNotificationsDrawerOpen(true)}
            className="px-3 py-2 bg-white border border-[#c7c4d8] text-[#191c1e] text-xs font-bold rounded-md hover:bg-[#f2f4f6] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-[#3525cd]" />
            <span>Feed (6)</span>
          </button>

          <button
            onClick={() => setCollaborationModalOpen(true)}
            className="px-3 py-2 bg-[#dcfce7] border border-[#86efac] text-[#166534] text-xs font-bold rounded-md hover:bg-[#bbf7d0] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#16a34a]" />
            <span>Collaboration Plan</span>
          </button>

          <button
            id="scheduler-ai-optimize-btn"
            onClick={onOptimizeScheduleWithAI}
            disabled={isOptimizing}
            className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#4f46e5] active:scale-[0.98] transition-all flex items-center gap-2 shadow-xs disabled:opacity-75 cursor-pointer"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Optimizing Matrix...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Optimize Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Department Selection & Role Filter Bar */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#3525cd]" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded p-1.5 font-mono font-bold text-[#191c1e] text-xs"
            />
          </div>

          {/* Division */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1">
              Division
            </label>
            <div className="p-1.5 bg-[#f2f4f6] rounded border border-[#eceef0] font-semibold text-[#191c1e] truncate text-xs">
              Mumbai Central (CR)
            </div>
          </div>

          {/* Corridor Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1">
              Corridor
            </label>
            <select
              value={selectedCorridorFilter}
              onChange={(e) => setSelectedCorridorFilter(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded p-1.5 font-mono font-bold text-[#191c1e] text-xs"
            >
              <option value="ALL">All Corridors (CSTM–KYN)</option>
              {dbCorridors.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.fromCode} &rarr; {c.toCode})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded p-1.5 font-sans font-bold text-[#191c1e] text-xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Role Switcher */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#3525cd]" />
              <span>Role Permissions</span>
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as HierarchyRole)}
              className="w-full bg-[#e2dfff]/40 border border-[#3525cd]/40 rounded p-1.5 font-sans font-bold text-[#3525cd] text-xs"
            >
              <option value="COA">COA (Full Access & Central Operations)</option>
              <option value="Department Head">Department Head (Dept Edit)</option>
              <option value="Zonal Head">Zonal Head (Zonal Approval & Policy)</option>
              <option value="Supervisor">Supervisor (Request / Draft)</option>
              <option value="Technician">Technician (Task Execution)</option>
            </select>
          </div>

          {/* View Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#777587] uppercase tracking-wider mb-1">
              View Filter
            </label>
            <div className="flex bg-[#f2f4f6] rounded border border-[#c7c4d8] p-0.5">
              <button
                onClick={() => setViewMode("All Departments")}
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  viewMode === "All Departments"
                    ? "bg-[#3525cd] text-white shadow-xs"
                    : "text-[#464555] hover:text-[#191c1e]"
                }`}
              >
                All Depts
              </button>
              <button
                onClick={() => setViewMode("My Department")}
                className={`flex-1 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  viewMode === "My Department"
                    ? "bg-[#3525cd] text-white shadow-xs"
                    : "text-[#464555] hover:text-[#191c1e]"
                }`}
              >
                My Dept
              </button>
            </div>
          </div>
        </div>

        {/* Active Role Rights Indicator */}
        <div className="mt-3 pt-2.5 border-t border-[#eceef0] flex items-center justify-between text-[11px] text-[#777587] flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-[#191c1e]">Active Permissions ({userRole}):</span>
            {userRole === "COA" && (
              <span className="text-[#137333]">
                ✓ View all corridors • ✓ View all depts • ✓ Control Organization of Application (COA) • ✓ Sanction & approve all blocks
              </span>
            )}
            {userRole === "Department Head" && (
              <span className="text-[#3525cd]">
                ✓ View all depts • ✓ Create dept blocks • ✓ Edit own dept blocks • ✓ Approve own dept requests
              </span>
            )}
            {userRole === "Zonal Head" && (
              <span className="text-[#7c3aed]">
                ✓ View all zones & corridors • ✓ Multi-department strategic approval • ✓ High-priority & mega shadow block sanction
              </span>
            )}
            {userRole === "Supervisor" && (
              <span className="text-[#d97706]">
                ✓ View assigned corridor • ✓ Create maintenance requests • ✓ Modify draft requests • ✓ Assign teams
              </span>
            )}
            {userRole === "Technician" && (
              <span className="text-[#0284c7]">
                ✓ View assigned tasks • ✓ Start task • ✓ Complete task • ✓ Report issue (Read-only on approved blocks)
              </span>
            )}
          </div>
          {viewMode === "My Department" && (
            <span className="font-bold text-[#3525cd]">
              Filtering view to: <strong>{userDepartment}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-xs ${
            toastMessage.type === "success"
              ? "bg-[#dcfce7] border-[#86efac] text-[#166534]"
              : toastMessage.type === "warning"
              ? "bg-[#fff8f6] border-[#ffdad6] text-[#ba1a1a]"
              : "bg-[#e0f2fe] border-[#bae6fd] text-[#0369a1]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[11px] font-bold uppercase underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Top Cards: Active Blocks, Pending, AI Optimized, Conflicts, Completed Today + Corridor Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#c7c4d8]/60 shadow-xs">
          <div className="flex items-center justify-between text-[#777587] text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Active Blocks</span>
            <Activity className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#191c1e]">8</div>
          <span className="text-[10px] text-[#137333] font-semibold">Live on tracks</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#c7c4d8]/60 shadow-xs">
          <div className="flex items-center justify-between text-[#777587] text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Pending Approval</span>
            <Clock className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#d97706]">5</div>
          <span className="text-[10px] text-[#777587]">Awaiting Chief Controller</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#c7c4d8]/60 shadow-xs">
          <div className="flex items-center justify-between text-[#777587] text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>AI Optimized</span>
            <Sparkles className="w-4 h-4 text-[#3525cd]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#3525cd]">12</div>
          <span className="text-[10px] text-[#3525cd] font-semibold">+85% Avg efficiency</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#c7c4d8]/60 shadow-xs">
          <div className="flex items-center justify-between text-[#777587] text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#ba1a1a]">3</div>
          <span className="text-[10px] text-[#ba1a1a] font-semibold">1 Critical (DR–GC)</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#c7c4d8]/60 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#777587] text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#191c1e]">18</div>
          <span className="text-[10px] text-[#137333] font-semibold">100% Punctuality kept</span>
        </div>
      </div>

      {/* Corridor Status Quick Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#c7c4d8]/60 shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <span className="font-bold text-[#191c1e] text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
          <MapPinIcon className="w-3.5 h-3.5 text-[#3525cd]" />
          <span>Corridor Status:</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {dbCorridors.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCorridorFilter(c.code)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                c.status === "Conflict"
                  ? "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]"
                  : c.status === "AI Optimized"
                  ? "bg-[#e2dfff] text-[#3525cd] border-[#3525cd]"
                  : "bg-[#f2f4f6] text-[#464555] border-[#c7c4d8]"
              }`}
            >
              <span>{c.code}: </span>
              <span className="uppercase">{c.status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mumbai Central Line Interactive Map Component */}
      <MumbaiCorridorMap
        selectedCorridor={selectedCorridorFilter}
        onSelectCorridor={(code) => setSelectedCorridorFilter(code)}
        corridors={dbCorridors}
      />

      {/* AI Conflict Detection Alert Banner: REQ-892 on DR-GC */}
      {blocks.some((b) => b.id === "blk-dr-gc-eng" && b.status === "Requested") && (
        <div
          id="gapsense-conflict-banner"
          className="bg-[#fff8f6] border border-[#ffdad6] border-l-4 border-l-[#ba1a1a] rounded-xl p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#ffdad6] text-[#ba1a1a] shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-bold uppercase tracking-wider rounded font-mono">
                    ⚠ Gap Sense Conflict
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#191c1e]">
                    REQ-892 (DR &rarr; GC Sector • 02:00–05:00)
                  </span>
                </div>
                <p className="text-xs text-[#191c1e] font-semibold">
                  Conflicts with: <strong className="text-[#ba1a1a]">🚆 Scheduled Train Movement (03:30–04:00)</strong>
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#ba1a1a] font-mono">
                  <span>⚠ Also detects: Electrical overlap (REQ-893)</span>
                  <span>•</span>
                  <span>⚠ S&T overlap (REQ-894)</span>
                </div>
              </div>
            </div>

            {/* AI Next Best Slot Card */}
            <div className="bg-white p-3.5 rounded-lg border border-[#c7c4d8]/60 shadow-xs max-w-md w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3525cd] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next Best Slot</span>
                </span>
                <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[10px] font-mono font-bold rounded">
                  +85% Expected Efficiency
                </span>
              </div>
              <div className="font-mono font-black text-sm text-[#191c1e]">
                DR &rarr; GC • 01:30 – 04:30 IST (3.0h)
              </div>
              <div className="text-[11px] text-[#464555] space-y-0.5">
                <div>✓ Lower scheduled train traffic in night lull</div>
                <div>✓ Engineering, Electrical & S&T teams available</div>
                <div>✓ Required tower wagon & track machines ready</div>
                <div>✓ No major conflicting block on adjacent lines</div>
              </div>
              <div className="pt-2 border-t border-[#eceef0] flex items-center justify-end gap-2">
                {onNavigateToWhySlot && (
                  <button
                    onClick={() => onNavigateToWhySlot("REQ-892")}
                    className="px-2.5 py-1 bg-[#f2f4f6] text-[#3525cd] text-[11px] font-bold rounded hover:bg-[#e6e8ea] cursor-pointer"
                  >
                    WhySlot?
                  </button>
                )}
                {onNavigateToWhatIf && (
                  <button
                    onClick={() => onNavigateToWhatIf("REQ-892")}
                    className="px-2.5 py-1 bg-[#ffdcc3] text-[#904d00] text-[11px] font-bold rounded hover:bg-[#ffcaa1] cursor-pointer"
                  >
                    What-If?
                  </button>
                )}
                <button
                  onClick={handleAcceptAiRecommendedSlot}
                  className="px-3 py-1 bg-[#3525cd] text-white text-[11px] font-bold uppercase tracking-wider rounded hover:bg-[#4f46e5] cursor-pointer shadow-xs"
                >
                  Accept AI Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Collaborative Maintenance Opportunity Banner */}
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#dcfce7] text-[#166534] shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#166534] text-white text-[10px] font-bold uppercase tracking-wider rounded font-mono">
                🤖 AI Collaborative Maintenance Opportunity
              </span>
              <span className="font-mono font-bold text-xs text-[#191c1e]">
                DR &rarr; GC Multi-Department Sync
              </span>
            </div>
            <p className="text-xs text-[#191c1e]">
              Recommended common block: <strong>DR &rarr; GC (01:30–04:30)</strong> combining{" "}
              <span className="text-[#3525cd] font-semibold">Engineering</span>,{" "}
              <span className="text-[#d97706] font-semibold">Electrical</span> &{" "}
              <span className="text-[#0284c7] font-semibold">Signal & Telecom</span>.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-[#166534] font-mono flex-wrap">
              <span>✓ Blocks required: 3 &rarr; 1</span>
              <span>•</span>
              <span>✓ Coordination: Synchronized</span>
              <span>•</span>
              <span>✓ Disruption: Zero Delays</span>
              <span>•</span>
              <span>✓ Saved Window: 140 mins</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCollaborationModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-[#86efac] text-[#166534] text-xs font-bold rounded hover:bg-[#dcfce7] cursor-pointer"
          >
            Review Matrix
          </button>
          <button
            onClick={handleAcceptCollaborationPlan}
            className="px-4 py-2 bg-[#166534] text-white text-xs font-bold rounded hover:bg-[#14532d] shadow-xs cursor-pointer"
          >
            Accept AI Plan
          </button>
        </div>
      </div>

      {/* Immediate Drag/Time Change AI Validation Feedback Toast */}
      {dragFeedback && (
        <div className="p-3.5 bg-[#fff8f6] border border-[#ffdad6] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4" />
              <span>⚠ CHANGE DETECTED: New Slot {dragFeedback.newSlot}</span>
            </div>
            <p className="text-[11px] text-[#464555]">
              Impact: Train conflicts: <strong className="text-[#ba1a1a]">{dragFeedback.conflicts}</strong> • Staff: ✓ • Equipment: ✓ • Efficiency: {dragFeedback.efficiency}
            </p>
            <span className="text-[11px] font-mono text-[#3525cd] block">
              AI Recommendation: {dragFeedback.aiRecommendation}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAcceptAiRecommendedSlot}
              className="px-3 py-1.5 bg-[#3525cd] text-white text-[11px] font-bold rounded hover:bg-[#4f46e5] cursor-pointer"
            >
              Accept AI (01:30–04:30)
            </button>
            <button
              onClick={() => setDragFeedback(null)}
              className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] text-[11px] font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
            >
              Keep My Change
            </button>
          </div>
        </div>
      )}

      {/* MAIN COMMON BLOCK PLANNER GANTT MATRIX */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/60 shadow-xs overflow-hidden">
        {/* Timeline Header Bar */}
        <div className="p-4 border-b border-[#eceef0] bg-[#f8f9fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3525cd]" />
              <span>Mumbai Central Line 24-Hour Unified Corridor Schedule</span>
            </h3>
            <span className="text-xs text-[#777587] font-mono">
              Click corridor rows to expand departmental maintenance streams
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#3525cd]"></span>
              <span>Engineering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#d97706]"></span>
              <span>Electrical (TRD)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0284c7]"></span>
              <span>S&T</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#31303e]"></span>
              <span>Train Movement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#006e1c]"></span>
              <span>AI Clustered Shadow</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Time Axis Header */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header Hour Ticks */}
            <div className="flex border-b border-[#eceef0] bg-[#f2f4f6]/70 py-2.5 pl-60 pr-4 text-[11px] font-mono text-[#777587]">
              {hours.map((hr) => (
                <div key={hr} className="flex-1 text-center font-bold">
                  {hr.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Corridor Rows */}
            <div className="divide-y divide-[#eceef0]">
              {visibleCorridors.map((corridor) => {
                const isExpanded = expandedCorridors[corridor.code] ?? false;
                const corridorBlocks = blocks.filter((b) => b.corridor === corridor.code);

                return (
                  <div key={corridor.code} className="bg-white">
                    {/* Main Corridor Header Row */}
                    <div
                      onClick={() => toggleCorridorExpand(corridor.code)}
                      className="flex items-center bg-[#f8f9fa] hover:bg-[#f0f2f4] transition-colors py-3 px-4 cursor-pointer border-l-4 border-l-[#3525cd]"
                    >
                      <div className="w-56 shrink-0 flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#3525cd]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#777587]" />
                        )}
                        <div>
                          <div className="font-mono font-black text-xs text-[#191c1e] flex items-center gap-1.5">
                            <span>{corridor.code}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                                corridor.status === "Conflict"
                                  ? "bg-[#ffdad6] text-[#ba1a1a]"
                                  : corridor.status === "AI Optimized"
                                  ? "bg-[#e2dfff] text-[#3525cd]"
                                  : "bg-[#dcfce7] text-[#166534]"
                              }`}
                            >
                              {corridor.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#777587]">
                            {corridor.from} &rarr; {corridor.to} ({corridor.lengthKm} km)
                          </span>
                        </div>
                      </div>

                      {/* 24H Summary Bar preview for the corridor */}
                      <div className="flex-1 relative h-6 bg-[#eceef0]/60 rounded mx-2">
                        {/* Live 08:24 IST cursor */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#ba1a1a] z-20"
                          style={{ left: `${(currentTimeHour / 24) * 100}%` }}
                        />

                        {corridorBlocks.map((blk) => {
                          const style = getBlockStyle(blk);
                          return (
                            <div
                              key={blk.id}
                              style={{ left: style.left, width: style.width }}
                              className={`absolute top-0.5 bottom-0.5 rounded text-[9px] font-mono px-1 flex items-center overflow-hidden whitespace-nowrap opacity-90 ${style.bgClass}`}
                              title={`${blk.title} (${blk.department})`}
                            >
                              {blk.code}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expanded Department Sub-Rows */}
                    {isExpanded && (
                      <div className="pl-6 bg-[#fafafa] divide-y divide-[#eceef0]/60">
                        {departments.map((dept) => {
                          const deptBlocks = getCorridorDepartmentBlocks(corridor.code, dept);
                          if (viewMode === "My Department" && dept !== userDepartment) return null;
                          if (selectedDepartmentFilter !== "ALL" && dept !== selectedDepartmentFilter)
                            return null;

                          let deptIcon = <Wrench className="w-3.5 h-3.5 text-[#3525cd]" />;
                          if (dept === "Electrical / Traction") {
                            deptIcon = <Zap className="w-3.5 h-3.5 text-[#d97706]" />;
                          } else if (dept === "Signal & Telecom") {
                            deptIcon = <Radio className="w-3.5 h-3.5 text-[#0284c7]" />;
                          } else if (dept === "Operations") {
                            deptIcon = <Train className="w-3.5 h-3.5 text-[#4b5563]" />;
                          }

                          return (
                            <div key={dept} className="flex items-center py-2.5 px-3">
                              {/* Sub-Department Name column */}
                              <div className="w-52 shrink-0 flex items-center gap-2 text-xs">
                                {deptIcon}
                                <div>
                                  <span className="font-bold text-[#191c1e] text-[11px] block">{dept}</span>
                                  <span className="text-[9px] text-[#777587] font-mono">
                                    {DEPARTMENT_HIERARCHY_CONFIG[dept]?.teams[0] || "Active Section"}
                                  </span>
                                </div>
                              </div>

                              {/* 24-Hour Department Track Timeline */}
                              <div className="flex-1 relative h-10 bg-white border border-[#eceef0] rounded-md mx-2">
                                {/* Live Time Red Line */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-[#ba1a1a] z-20"
                                  style={{ left: `${(currentTimeHour / 24) * 100}%` }}
                                >
                                  <span className="absolute -top-3 -translate-x-1/2 text-[8px] font-mono font-bold text-[#ba1a1a] bg-white px-0.5 rounded shadow-2xs">
                                    08:24 IST
                                  </span>
                                </div>

                                {/* Department Blocks in this corridor */}
                                {deptBlocks.map((blk) => {
                                  const style = getBlockStyle(blk);
                                  const isConflict = blk.type === "conflict-rejected";

                                  return (
                                    <div
                                      key={blk.id}
                                      onClick={() => setSelectedBlockForModal(blk)}
                                      style={{ left: style.left, width: style.width }}
                                      className={`group absolute top-1 bottom-1 rounded-md border text-[10px] font-mono font-bold px-2 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:z-30 hover:shadow-md ${style.bgClass}`}
                                    >
                                      <div className="flex items-center gap-1 truncate">
                                        {isConflict && <AlertTriangle className="w-3 h-3 text-[#ba1a1a] shrink-0" />}
                                        {blk.isCollaborative && <Sparkles className="w-3 h-3 text-[#dcfce7] shrink-0" />}
                                        <span className="truncate">{blk.code}: {blk.activity}</span>
                                      </div>

                                      <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
                                        {/* Inline Shift Controls for Quick Drag/Adjustment */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickShiftTime(blk.id, -0.5);
                                          }}
                                          title="Shift 30m earlier"
                                          className="px-1 bg-black/30 hover:bg-black/50 text-white rounded text-[9px]"
                                        >
                                          ◀
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickShiftTime(blk.id, 0.5);
                                          }}
                                          title="Shift 30m later"
                                          className="px-1 bg-black/30 hover:bg-black/50 text-white rounded text-[9px]"
                                        >
                                          ▶
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {deptBlocks.length === 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#c7c4d8] font-mono italic">
                                    No active maintenance window scheduled
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Department Workload Capacity Matrix Component */}
      <MumbaiDepartmentWorkload />

      {/* Inspector Detail Modal */}
      {selectedBlockForModal && (
        <MumbaiBlockDetailModal
          block={selectedBlockForModal}
          userRole={userRole}
          userDepartment={userDepartment}
          onClose={() => setSelectedBlockForModal(null)}
          onUpdateBlock={handleUpdateBlock}
          onNavigateToWhySlot={onNavigateToWhySlot}
          onNavigateToWhatIf={() => onNavigateToWhatIf && onNavigateToWhatIf(selectedBlockForModal.code)}
        />
      )}

      {/* Collaborative Maintenance Opportunity Modal */}
      {collaborationModalOpen && (
        <MumbaiCollaborativeOpportunityModal
          onAccept={handleAcceptCollaborationPlan}
          onModify={() => {
            setCollaborationModalOpen(false);
            setToastMessage({
              type: "info",
              text: "Adjust window sliders in the timeline to customize joint possession hours.",
            });
          }}
          onReject={() => setCollaborationModalOpen(false)}
          onClose={() => setCollaborationModalOpen(false)}
        />
      )}

      {/* Live Notifications Feed Drawer */}
      <MumbaiNotificationsDrawer
        isOpen={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        onSelectNotificationCorridor={(corridor) => {
          setSelectedCorridorFilter(corridor);
          setExpandedCorridors((prev) => ({ ...prev, [corridor]: true }));
        }}
      />
    </div>
  );
};

// Helper MapPinIcon component for clean inline rendering
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

