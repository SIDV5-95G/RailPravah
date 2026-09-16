import React, { useState, useEffect, useCallback } from "react";
import { CalendarBlock, ScreenType, UserProfile, UserRole, SectionFieldGroup, CautionOrder, GangRosterMember } from "../types";
import { HierarchyTabBar } from "./HierarchyTabBar";
import { HierarchicalIssueInbox } from "./HierarchicalIssueInbox";
import { UnifiedDailyScheduleCalendar } from "./UnifiedDailyScheduleCalendar";
import { UserAvatar } from "../utils/avatarUtils";
import {
  UserCheck,
  ShieldCheck,
  Users,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Send,
  HardHat,
  Compass,
  Lock,
  CheckCheck,
  Phone,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  UserPlus,
  X,
  Radio,
} from "lucide-react";

interface SupervisorDashboardScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onSwitchUserRole?: (role: UserRole) => void;
  calendarBlocks?: CalendarBlock[];
}

export const SupervisorDashboardScreen: React.FC<SupervisorDashboardScreenProps> = ({
  user,
  onNavigate,
  onSwitchUserRole,
  calendarBlocks,
}) => {
  const [activeTab, setActiveTab] = useState<"complaints" | "status" | "groups" | "patrol" | "calendar">("complaints");

  // ── Field Groups & Rosters State ──────────────────────────────────────────
  const [fieldGroups, setFieldGroups] = useState<SectionFieldGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);

  // New Gang Form State
  const [newGangName, setNewGangName] = useState("");
  const [newGangCode, setNewGangCode] = useState("");
  const [newGangMate, setNewGangMate] = useState("");
  const [newGangContact, setNewGangContact] = useState("");
  const [newGangBeat, setNewGangBeat] = useState("");
  const [newGangShift, setNewGangShift] = useState("Morning (06:00 - 14:00)");
  const [newGangStrength, setNewGangStrength] = useState("8");

  // ── Caution Orders State ──────────────────────────────────────────────────
  const [cautionOrders, setCautionOrders] = useState<CautionOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [newOrderSection, setNewOrderSection] = useState("");
  const [newOrderTrack, setNewOrderTrack] = useState("Down Slow");
  const [newOrderSpeed, setNewOrderSpeed] = useState("30 KMPH");
  const [newOrderReason, setNewOrderReason] = useState("");

  useEffect(() => {
    const handleOpenCalendar = () => {
      setActiveTab("calendar");
    };
    window.addEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
    return () => window.removeEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
  }, []);

  // Fetch Section Field Groups from Database
  const fetchFieldGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch(`/api/supervisor/field-groups?department=${encodeURIComponent(user.department || "")}`, {
        headers: {
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setFieldGroups(data.groups);
      }
    } catch (err) {
      console.warn("Could not fetch field groups:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user.department, user.userRole]);

  // Fetch Caution Orders from Database
  const fetchCautionOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/supervisor/caution-orders?department=${encodeURIComponent(user.department || "")}`, {
        headers: {
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setCautionOrders(data.orders);
      }
    } catch (err) {
      console.warn("Could not fetch caution orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user.department, user.userRole]);

  useEffect(() => {
    if (activeTab === "groups") {
      fetchFieldGroups();
    } else if (activeTab === "patrol") {
      fetchCautionOrders();
    }
  }, [activeTab, fetchFieldGroups, fetchCautionOrders]);

  // Toggle Roster Accordion
  const toggleGroupExpanded = (id: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Update Gang Operational Status in Database
  const handleUpdateGroupStatus = async (groupId: string, newStatus: SectionFieldGroup["operational_status"]) => {
    setUpdatingGroupId(groupId);
    try {
      const res = await fetch(`/api/supervisor/field-groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
        body: JSON.stringify({ operational_status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.group) {
        setFieldGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, operational_status: newStatus } : g))
        );
      }
    } catch (err) {
      console.warn("Error updating field squad status:", err);
    } finally {
      setUpdatingGroupId(null);
    }
  };

  // Create New Field Squad in Database
  const handleCreateNewGang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGangName.trim()) return;

    try {
      const strength = parseInt(newGangStrength, 10) || 8;
      const initialMembers: GangRosterMember[] = Array.from({ length: strength }, (_, i) => ({
        emp_id: `TM-CR-${Math.floor(100 + Math.random() * 900)}`,
        name: i === 0 ? newGangMate : `Track Maintainer ${i + 1}`,
        designation: i === 0 ? "Track Mate" : i === 1 ? "Keyman" : `Trackman-II`,
        status: "On Duty",
        contact: i === 0 ? newGangContact : "",
      }));

      const payload = {
        name: newGangName,
        gang_code: newGangCode || `GANG-${Date.now().toString().slice(-4)}`,
        department: user.department || "civil",
        section_division: `P-Way Section (DR - GC)`,
        mate_name: newGangMate || "Staff Mate",
        mate_contact: newGangContact,
        total_strength: strength,
        on_duty_count: strength,
        beat_location: newGangBeat || "Designated Section Corridor",
        shift_name: newGangShift,
        operational_status: "on_patrol",
        roster_members: initialMembers,
      };

      const res = await fetch("/api/supervisor/field-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setFieldGroups((prev) => [data.group, ...prev]);
        setIsDeployModalOpen(false);
        setNewGangName("");
        setNewGangCode("");
        setNewGangMate("");
        setNewGangContact("");
        setNewGangBeat("");
      }
    } catch (err) {
      console.warn("Error creating new field squad:", err);
    }
  };

  // Create New Caution Order in Database
  const handleCreateCautionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderSection.trim()) return;

    try {
      const payload = {
        section_location: newOrderSection,
        track_line: newOrderTrack,
        imposed_speed: newOrderSpeed,
        reason: newOrderReason || "Routine track maintenance speed restriction",
        department: user.department || "civil",
        status: "active",
      };

      const res = await fetch("/api/supervisor/caution-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCautionOrders((prev) => [data.order, ...prev]);
        setIsOrderModalOpen(false);
        setNewOrderSection("");
        setNewOrderReason("");
      }
    } catch (err) {
      console.warn("Error creating caution order:", err);
    }
  };

  // Update Caution Order Status
  const handleUpdateCautionOrderStatus = async (orderId: string, newStatus: CautionOrder["status"]) => {
    try {
      const res = await fetch(`/api/supervisor/caution-orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-dept": user.department || "civil",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCautionOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.warn("Error updating caution order:", err);
    }
  };

  if (user.userRole !== "supervisor") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-white rounded-2xl border border-[#ffdad6] shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1e]">
          Strict Access Control: Supervisor Desk Restricted
        </h2>
        <p className="text-xs text-[#464555] max-w-md mx-auto leading-relaxed">
          The Supervisor Dashboard is exclusively for SUPERVISOR personnel.
          Your current role (<strong>{user.role}</strong>) cannot access section group assignments and worker issue reviews.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate("worker-dashboard")}
            className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer shadow-xs"
          >
            Return to Authorized Workspace
          </button>
        </div>
      </div>
    );
  }

  const supervisorUser = user;

  // Filter groups
  const filteredGroups = fieldGroups.filter((g) => {
    if (groupFilter === "all") return true;
    return g.operational_status === groupFilter;
  });

  // Calculate totals
  const totalGangs = fieldGroups.length;
  const onPatrolCount = fieldGroups.filter((g) => g.operational_status === "on_patrol").length;
  const maintenanceCount = fieldGroups.filter(
    (g) => g.operational_status === "possession_work" || g.operational_status === "turnout_maintenance"
  ).length;
  const totalOnDutyStaff = fieldGroups.reduce((acc, g) => acc + (g.on_duty_count || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Hierarchy Chain Navigation Bar */}
      <HierarchyTabBar
        currentScreen="supervisor-dashboard"
        onNavigate={onNavigate}
        currentUser={user}
        onSwitchUserRole={onSwitchUserRole}
      />

      {/* Screen Header Banner */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#dbeafe] text-[#1e40af] text-[11px] font-mono font-bold rounded-md uppercase">
              Supervisory Authority
            </span>
            <span className="text-xs text-[#777587] font-mono">Section: DR – GC (Dadar - Ghatkopar)</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] mt-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#1e40af]" />
            <span>Supervisor Review & Handover Desk</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0] min-w-0 max-w-full">
          <UserAvatar
            role={supervisorUser.userRole || "supervisor"}
            name={supervisorUser.name}
            avatarUrl={supervisorUser.avatarUrl}
            size="md"
            showBadge={true}
          />
          <div className="text-xs min-w-0">
            <div className="font-bold text-[#191c1e] truncate max-w-[180px] sm:max-w-[220px]" title={supervisorUser.name}>
              {supervisorUser.name}
            </div>
            <div className="text-[11px] text-[#777587] font-mono truncate max-w-[180px] sm:max-w-[220px]" title={supervisorUser.role}>
              {supervisorUser.role}
            </div>
            <div className="text-[10px] text-[#1e40af] font-semibold whitespace-nowrap font-mono">
              Emp ID: {supervisorUser.empId}
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          id="supervisor-subtab-complaints"
          type="button"
          onClick={() => setActiveTab("complaints")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "complaints"
              ? "bg-[#1e40af] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Worker Complaints & Technical Review Desk</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "complaints" ? "bg-white/20 text-white" : "bg-[#dbeafe] text-[#1e40af]"
          }`}>
            Complaints Review
          </span>
        </button>

        <button
          id="supervisor-subtab-status"
          type="button"
          onClick={() => setActiveTab("status")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "status"
              ? "bg-[#1e40af] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Complaint Status & Tracking</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "status" ? "bg-white/20 text-white" : "bg-[#dbeafe] text-[#1e40af]"
          }`}>
            Status Monitor
          </span>
        </button>

        <button
          id="supervisor-subtab-groups"
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "groups"
              ? "bg-[#1e40af] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Section Field Groups & Rosters</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "groups" ? "bg-white/20 text-white" : "bg-[#dbeafe] text-[#1e40af]"
          }`}>
            {fieldGroups.length > 0 ? fieldGroups.length : "Live"}
          </span>
        </button>

        <button
          id="supervisor-subtab-patrol"
          type="button"
          onClick={() => setActiveTab("patrol")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "patrol"
              ? "bg-[#1e40af] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Track Patrol & Caution Orders</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "patrol" ? "bg-white/20 text-white" : "bg-[#dbeafe] text-[#1e40af]"
          }`}>
            {cautionOrders.filter((c) => c.status === "active").length} Active
          </span>
        </button>

        <button
          id="supervisor-subtab-calendar"
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "calendar"
              ? "bg-[#1e40af] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Schedule Calendar</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "calendar" ? "bg-white/20 text-white" : "bg-[#dbeafe] text-[#1e40af]"
          }`}>
            Section Schedule
          </span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeTab === "complaints" && (
        <HierarchicalIssueInbox
          user={supervisorUser}
          mode="complaints"
          onNavigateToCoa={() => onNavigate("coa-management")}
        />
      )}

      {activeTab === "status" && (
        <HierarchicalIssueInbox
          user={supervisorUser}
          mode="status"
          onNavigateToCoa={() => onNavigate("coa-management")}
        />
      )}

      {/* ── 3. Section Field Groups & Rosters (DATABASE-DRIVEN) ───────────────── */}
      {activeTab === "groups" && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#eceef0] rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] font-mono uppercase text-[#777587]">Total Squads</div>
              <div className="text-xl font-extrabold text-[#191c1e] mt-1 flex items-center justify-between">
                <span>{totalGangs}</span>
                <HardHat className="w-5 h-5 text-[#1e40af]" />
              </div>
              <div className="text-[10px] text-[#777587] mt-0.5">Assigned to section</div>
            </div>

            <div className="bg-white border border-[#eceef0] rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] font-mono uppercase text-[#777587]">Active On Patrol</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1 flex items-center justify-between">
                <span>{onPatrolCount}</span>
                <Compass className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-[10px] text-[#777587] mt-0.5">Foot & keyman patrol</div>
            </div>

            <div className="bg-white border border-[#eceef0] rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] font-mono uppercase text-[#777587]">Possession / Yard</div>
              <div className="text-xl font-extrabold text-blue-700 mt-1 flex items-center justify-between">
                <span>{maintenanceCount}</span>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-[10px] text-[#777587] mt-0.5">Active maintenance work</div>
            </div>

            <div className="bg-white border border-[#eceef0] rounded-xl p-3.5 shadow-xs">
              <div className="text-[11px] font-mono uppercase text-[#777587]">Total On Duty</div>
              <div className="text-xl font-extrabold text-indigo-700 mt-1 flex items-center justify-between">
                <span>{totalOnDutyStaff} Staff</span>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-[10px] text-[#777587] mt-0.5">Active roster strength</div>
            </div>
          </div>

          {/* Action Bar & Filters */}
          <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1e40af]" />
                Filter Status:
              </span>
              {[
                { id: "all", label: "All Squads" },
                { id: "on_patrol", label: "On Patrol" },
                { id: "turnout_maintenance", label: "Turnout / Yard" },
                { id: "possession_work", label: "Possession Work" },
                { id: "standby", label: "Standby" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setGroupFilter(f.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    groupFilter === f.id
                      ? "bg-[#1e40af] text-white"
                      : "bg-[#f8f9fa] text-[#464555] hover:bg-[#eceef0]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchFieldGroups}
                disabled={isLoadingGroups}
                className="px-3 py-1.5 border border-[#c7c4d8] text-xs font-semibold text-[#191c1e] rounded-lg hover:bg-[#f8f9fa] flex items-center gap-1.5 cursor-pointer"
                title="Sync with Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGroups ? "animate-spin text-[#1e40af]" : "text-[#777587]"}`} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => setIsDeployModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#1e40af] text-white text-xs font-bold rounded-lg hover:bg-[#1e3a8a] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy New Squad</span>
              </button>
            </div>
          </div>

          {/* Field Gang Cards */}
          {isLoadingGroups ? (
            <div className="p-12 text-center text-xs text-[#777587] bg-white rounded-xl border border-[#eceef0]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1e40af] mb-2" />
              Loading field squads and staff rosters from database...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#777587] bg-white rounded-xl border border-[#eceef0] space-y-2">
              <HardHat className="w-8 h-8 mx-auto opacity-30 text-[#1e40af]" />
              <div className="font-semibold text-sm text-[#191c1e]">No Squads Found</div>
              <div>No section squads matching the selected filter in the database.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const isExpanded = expandedGroupIds.has(group.id);
                const statusColor =
                  group.operational_status === "on_patrol"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : group.operational_status === "turnout_maintenance"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : group.operational_status === "possession_work"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-700 border-slate-300";

                const statusLabel =
                  group.operational_status === "on_patrol"
                    ? "On Active Patrol"
                    : group.operational_status === "turnout_maintenance"
                    ? "Yard Turnout Maintenance"
                    : group.operational_status === "possession_work"
                    ? "Possession Execution"
                    : "Standby / Emergency";

                return (
                  <div
                    key={group.id}
                    className="bg-white border border-[#c7c4d8]/80 rounded-xl shadow-xs overflow-hidden transition-all hover:border-[#1e40af]"
                  >
                    {/* Gang Header Card */}
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-[#191c1e] text-white text-xs font-mono font-bold rounded">
                              {group.gang_code}
                            </span>
                            <span className="text-sm font-bold text-[#191c1e]">{group.name}</span>
                            <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-[11px] font-medium rounded">
                              {group.shift_name}
                            </span>
                          </div>
                          <div className="text-xs text-[#777587] mt-1 font-mono">
                            {group.section_division}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Gang Meta Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#eceef0] text-xs">
                        <div className="bg-[#f8f9fa] p-2.5 rounded-lg">
                          <div className="text-[#777587] text-[10px] font-mono uppercase">Mate In-Charge</div>
                          <div className="font-bold text-[#191c1e] mt-0.5">{group.mate_name}</div>
                          {group.mate_contact && (
                            <div className="text-[11px] text-[#1e40af] flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3" />
                              <span>{group.mate_contact}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-[#f8f9fa] p-2.5 rounded-lg">
                          <div className="text-[#777587] text-[10px] font-mono uppercase">Assigned Beat / Assets</div>
                          <div className="font-bold text-[#191c1e] mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#1e40af] shrink-0" />
                            <span className="truncate">{group.beat_location}</span>
                          </div>
                          <div className="text-[10px] text-[#777587] mt-0.5">Kilometer range & turnouts</div>
                        </div>

                        <div className="bg-[#f8f9fa] p-2.5 rounded-lg">
                          <div className="text-[#777587] text-[10px] font-mono uppercase">Roster Strength</div>
                          <div className="font-bold text-indigo-700 mt-0.5">
                            {group.on_duty_count} / {group.total_strength} Trackmen on Duty
                          </div>
                          <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-[#1e40af] h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round((group.on_duty_count / (group.total_strength || 1)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Bar: Quick Status Updates & Toggle Roster */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#eceef0]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#777587]">Set Deployment:</span>
                          {[
                            { status: "on_patrol" as const, label: "Patrol" },
                            { status: "turnout_maintenance" as const, label: "Yard Maintenance" },
                            { status: "possession_work" as const, label: "Possession Work" },
                            { status: "standby" as const, label: "Standby" },
                          ].map((act) => (
                            <button
                              key={act.status}
                              disabled={updatingGroupId === group.id}
                              onClick={() => handleUpdateGroupStatus(group.id, act.status)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                                group.operational_status === act.status
                                  ? "bg-[#1e40af] text-white"
                                  : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                              }`}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => toggleGroupExpanded(group.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#1e40af] hover:bg-[#eff6ff] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{isExpanded ? "Hide Staff Roster" : `View Staff Roster (${group.roster_members?.length || group.total_strength})`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Member Roster Accordion */}
                    {isExpanded && (
                      <div className="bg-[#f8f9fa] border-t border-[#eceef0] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#1e40af]" />
                            <span>Daily Staff Roster & Duty Allocation</span>
                          </h4>
                          <span className="text-[11px] font-mono text-[#777587]">
                            Shift: {group.shift_name}
                          </span>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-lg border border-[#eceef0]">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#f1f5f9] border-b border-[#eceef0] text-[#777587] font-mono uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Emp ID</th>
                                <th className="p-2.5">Staff Name</th>
                                <th className="p-2.5">Designation</th>
                                <th className="p-2.5">Contact No</th>
                                <th className="p-2.5 text-right">Attendance Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eceef0]">
                              {Array.isArray(group.roster_members) && group.roster_members.length > 0 ? (
                                group.roster_members.map((m, mIdx) => (
                                  <tr key={m.emp_id || mIdx} className="hover:bg-[#f8f9fa]">
                                    <td className="p-2.5 font-mono font-bold text-[#1e40af]">{m.emp_id}</td>
                                    <td className="p-2.5 font-semibold text-[#191c1e]">{m.name}</td>
                                    <td className="p-2.5 text-[#464555]">{m.designation}</td>
                                    <td className="p-2.5 font-mono text-[#777587]">{m.contact || "—"}</td>
                                    <td className="p-2.5 text-right">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                          m.status === "On Duty" || m.status === "Present"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : m.status === "Leave"
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        {m.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-[#777587]">
                                    No staff records attached to this squad roster in database.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Track Patrol & Caution Orders (DATABASE-DRIVEN) ───────────────── */}
      {activeTab === "patrol" && (
        <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                <span>Active Section Caution Orders (Central Line DR-GC)</span>
              </h3>
              <p className="text-xs text-[#777587] mt-0.5">
                Speed restrictions, track safety limits, and patrol mandates synchronized with database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchCautionOrders}
                disabled={isLoadingOrders}
                className="px-3 py-1.5 border border-[#c7c4d8] text-xs font-semibold text-[#191c1e] rounded-lg hover:bg-[#f8f9fa] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? "animate-spin text-[#ba1a1a]" : "text-[#777587]"}`} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-[#991b1b] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Caution Order</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#eceef0] text-[#777587] font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order No</th>
                  <th className="p-3">Section / Location</th>
                  <th className="p-3">Track Line</th>
                  <th className="p-3">Imposed Speed</th>
                  <th className="p-3">Reason / Defect</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#777587]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#ba1a1a]" />
                      Fetching caution orders from database...
                    </td>
                  </tr>
                ) : cautionOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#777587]">
                      No active caution orders found for this section.
                    </td>
                  </tr>
                ) : (
                  cautionOrders.map((co) => (
                    <tr key={co.id} className="hover:bg-[#f8f9fa]">
                      <td className="p-3 font-mono font-bold text-[#1e40af]">{co.order_no}</td>
                      <td className="p-3 font-semibold text-[#191c1e]">{co.section_location}</td>
                      <td className="p-3 font-mono">{co.track_line}</td>
                      <td className="p-3 font-bold text-[#ba1a1a] font-mono">{co.imposed_speed}</td>
                      <td className="p-3 text-[#464555] max-w-xs">{co.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            co.status === "active"
                              ? "bg-amber-100 text-amber-800"
                              : co.status === "revocation_review"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {co.status === "active" ? "Active Restriction" : co.status === "revocation_review" ? "Revocation Review" : "Cancelled"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {co.status === "active" ? (
                          <button
                            onClick={() => handleUpdateCautionOrderStatus(co.id, "revocation_review")}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-300 cursor-pointer"
                          >
                            Mark for Revocation
                          </button>
                        ) : co.status === "revocation_review" ? (
                          <button
                            onClick={() => handleUpdateCautionOrderStatus(co.id, "cancelled")}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 rounded border border-slate-300 cursor-pointer"
                          >
                            Clear Order
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#777587]">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Daily Schedule Calendar ──────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <UnifiedDailyScheduleCalendar
          role="supervisor"
          roleTitle="Section Supervisor (DR – GC)"
          calendarBlocks={calendarBlocks}
          defaultYear={2026}
          defaultMonth={8} // September 2026
          defaultDay={2}
        />
      )}

      {/* ── Modal: Deploy New Field Squad ───────────────────────────────────── */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#c7c4d8] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#1e40af]" />
                <h3 className="font-bold text-sm text-[#191c1e]">Deploy New Section Field Squad</h3>
              </div>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-[#777587] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewGang} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#191c1e] block mb-1">Squad / Gang Name *</label>
                <input
                  type="text"
                  required
                  value={newGangName}
                  onChange={(e) => setNewGangName(e.target.value)}
                  placeholder="e.g. Track Group #16 (Vidyavihar - Ghatkopar)"
                  className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Gang Code</label>
                  <input
                    type="text"
                    value={newGangCode}
                    onChange={(e) => setNewGangCode(e.target.value)}
                    placeholder="e.g. GANG-PW-16"
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Staff Strength</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newGangStrength}
                    onChange={(e) => setNewGangStrength(e.target.value)}
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Mate In-Charge Name *</label>
                  <input
                    type="text"
                    required
                    value={newGangMate}
                    onChange={(e) => setNewGangMate(e.target.value)}
                    placeholder="e.g. R. K. Rathod"
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newGangContact}
                    onChange={(e) => setNewGangContact(e.target.value)}
                    placeholder="+91 98200 XXXXX"
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#191c1e] block mb-1">Assigned Beat / Kilometer Section *</label>
                <input
                  type="text"
                  required
                  value={newGangBeat}
                  onChange={(e) => setNewGangBeat(e.target.value)}
                  placeholder="e.g. Km 18/10 to Km 21/04 (Up & Down Fast)"
                  className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#191c1e] block mb-1">Duty Shift</label>
                <select
                  value={newGangShift}
                  onChange={(e) => setNewGangShift(e.target.value)}
                  className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                >
                  <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                  <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  <option value="Night Block (01:30 - 04:30)">Night Block (01:30 - 04:30)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 border border-[#c7c4d8] text-xs font-semibold rounded-lg hover:bg-[#eceef0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] text-white text-xs font-bold rounded-lg hover:bg-[#1e3a8a] shadow-xs"
                >
                  Save & Deploy Squad to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Issue Caution Order ──────────────────────────────────────── */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#c7c4d8] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#f8f9fa] border-b border-[#eceef0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                <h3 className="font-bold text-sm text-[#191c1e]">Issue New Section Caution Order</h3>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-[#777587] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCautionOrder} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#191c1e] block mb-1">Section / Location *</label>
                <input
                  type="text"
                  required
                  value={newOrderSection}
                  onChange={(e) => setNewOrderSection(e.target.value)}
                  placeholder="e.g. Km 12/10 (Sion Outer Curve)"
                  className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Track Line</label>
                  <select
                    value={newOrderTrack}
                    onChange={(e) => setNewOrderTrack(e.target.value)}
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                  >
                    <option value="Down Slow">Down Slow</option>
                    <option value="Up Slow">Up Slow</option>
                    <option value="Down Fast">Down Fast</option>
                    <option value="Up Fast">Up Fast</option>
                    <option value="5th / 6th Line">5th / 6th Line</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Imposed Speed Restriction *</label>
                  <input
                    type="text"
                    required
                    value={newOrderSpeed}
                    onChange={(e) => setNewOrderSpeed(e.target.value)}
                    placeholder="e.g. 30 KMPH"
                    className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#191c1e] block mb-1">Reason / Technical Defect *</label>
                <textarea
                  required
                  rows={2}
                  value={newOrderReason}
                  onChange={(e) => setNewOrderReason(e.target.value)}
                  placeholder="e.g. Gauge widening observed at Km 12/10; urgent sleeper replacement needed"
                  className="w-full p-2.5 border border-[#c7c4d8] rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 border border-[#c7c4d8] text-xs font-semibold rounded-lg hover:bg-[#eceef0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-[#991b1b] shadow-xs"
                >
                  Issue Caution Order to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
