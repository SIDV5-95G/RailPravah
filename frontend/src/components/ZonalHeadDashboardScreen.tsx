import React, { useState, useEffect, useCallback } from "react";
import {
  ScreenType,
  UserProfile,
  UserRole,
  ServiceRequestItem,
  MaintenanceSchedulePlan,
  MaintenancePeriodType,
  CalendarBlock,
  MumbaiCorridor,
} from "../types";
import { HierarchyTabBar } from "./HierarchyTabBar";
import { HierarchicalIssueInbox } from "./HierarchicalIssueInbox";
import { ZonalDailyScheduleCalendar } from "./ZonalDailyScheduleCalendar";
import { ZonalMaintenanceCalendarModal } from "./ZonalMaintenanceCalendarModal";
import { UserAvatar } from "../utils/avatarUtils";
import {
  ShieldCheck,
  Building2,
  Activity,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Send,
  Layers,
  MapPin,
  TrendingUp,
  Lock,
  Calendar,
  FileText,
  CheckCheck,
  Plus,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { MUMBAI_CENTRAL_LINE_CORRIDORS } from "../mockData";

interface ZonalHeadDashboardScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onSwitchUserRole?: (role: UserRole) => void;
  calendarBlocks?: CalendarBlock[];
  requests?: ServiceRequestItem[];
}

export const ZonalHeadDashboardScreen: React.FC<ZonalHeadDashboardScreenProps> = ({
  user,
  onNavigate,
  onSwitchUserRole,
  calendarBlocks,
  requests = [],
}) => {
  const [activeTab, setActiveTab] = useState<"complaints" | "status" | "requests" | "corridors" | "policy">("complaints");
  const [selectedPlan, setSelectedPlan] = useState<MaintenanceSchedulePlan | null>(null);

  useEffect(() => {
    const handleOpenCalendar = () => {
      setActiveTab("policy");
    };
    window.addEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
    return () => window.removeEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
  }, []);
  const [requestFilter, setRequestFilter] = useState<"ALL" | "COA_PLANS" | "PENDING" | "DECLINED">("ALL");
  const [dbCorridors, setDbCorridors] = useState<MumbaiCorridor[]>(MUMBAI_CENTRAL_LINE_CORRIDORS);
  const [isLoadingCorridors, setIsLoadingCorridors] = useState(false);

  // Fetch real-time corridor statuses from database
  const fetchCorridors = useCallback(async () => {
    setIsLoadingCorridors(true);
    try {
      const res = await fetch("/api/coa/corridors");
      const data = await res.json();
      if (data.success && Array.isArray(data.corridors) && data.corridors.length > 0) {
        setDbCorridors(data.corridors);
      }
    } catch (err) {
      console.warn("Could not fetch corridor status:", err);
    } finally {
      setIsLoadingCorridors(false);
    }
  }, []);

  // Fetch once on mount; do NOT switch continuously or poll until user clicks "Sync DB"
  useEffect(() => {
    fetchCorridors();
  }, [fetchCorridors]);

  if (user.userRole !== "zonal_head") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-white rounded-2xl border border-[#ffdad6] shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1e]">
          Strict Access Control: Zonal Head Desk Restricted
        </h2>
        <p className="text-xs text-[#464555] max-w-md mx-auto leading-relaxed">
          The Zonal Head Dashboard is exclusively for Chief Track Engineers (CTE) and Zonal Authority personnel.
          Your current role (<strong>{user.role}</strong>) is not authorized for Zonal possessions and corridor approvals.
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

  const zonalUser = user;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Hierarchy Chain Navigation Bar */}
      <HierarchyTabBar
        currentScreen="zonal-dashboard"
        onNavigate={onNavigate}
        currentUser={user}
        onSwitchUserRole={onSwitchUserRole}
      />

      {/* Screen Header Banner */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#f3e8ff] text-[#7c3aed] text-[11px] font-mono font-bold rounded-md uppercase">
              Zonal Technical Authority
            </span>
            <span className="text-xs text-[#777587] font-mono">Jurisdiction: Central Railway Headquarters CSMT</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#7c3aed]" />
            <span>Zonal Head Review & Possession Desk</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            id="zonal-apply-service-req-btn"
            type="button"
            onClick={() => onNavigate("service-request")}
            className="px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Service Request</span>
            <span className="text-[10px] font-mono font-normal bg-white/20 px-1.5 py-0.5 rounded">
              Weekly / Monthly
            </span>
          </button>

          <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0] min-w-0 max-w-full">
            <UserAvatar
              role={zonalUser.userRole || "zonal_head"}
              name={zonalUser.name}
              avatarUrl={zonalUser.avatarUrl}
              size="md"
              showBadge={true}
            />
            <div className="text-xs min-w-0">
              <div className="font-bold text-[#191c1e] truncate max-w-[180px] sm:max-w-[220px]" title={zonalUser.name}>
                {zonalUser.name}
              </div>
              <div className="text-[11px] text-[#777587] font-mono truncate max-w-[180px] sm:max-w-[220px]" title={zonalUser.role}>
                {zonalUser.role}
              </div>
              <div className="text-[10px] text-[#7c3aed] font-semibold whitespace-nowrap font-mono">
                Emp ID: {zonalUser.empId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation (No bottom border line) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          id="zonal-subtab-complaints"
          type="button"
          onClick={() => setActiveTab("complaints")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "complaints"
              ? "bg-[#7c3aed] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === "complaints" ? "text-white" : "text-[#7c3aed]"}`} />
          <span>Supervisor Requests & Technical Review</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "complaints" ? "bg-white/20 text-white" : "bg-[#f3e8ff] text-[#7c3aed]"
          }`}>
            Complaints Review
          </span>
        </button>

        <button
          id="zonal-subtab-requests"
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "requests"
              ? "bg-[#7c3aed] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "requests" ? "text-white" : "text-[#7c3aed]"}`} />
          <span>Service Requests & COA Plans</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "requests" ? "bg-white/20 text-white" : "bg-[#f3e8ff] text-[#7c3aed]"
          }`}>
            {requests.filter((r) => r.maintenanceSchedule).length} Active Plans
          </span>
        </button>

        <button
          id="zonal-subtab-status"
          type="button"
          onClick={() => setActiveTab("status")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "status"
              ? "bg-[#7c3aed] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <CheckCheck className={`w-4 h-4 ${activeTab === "status" ? "text-white" : "text-[#7c3aed]"}`} />
          <span>Complaint Status & Tracking</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "status" ? "bg-white/20 text-white" : "bg-[#f3e8ff] text-[#7c3aed]"
          }`}>
            Status Monitor
          </span>
        </button>

        <button
          id="zonal-subtab-corridors"
          type="button"
          onClick={() => setActiveTab("corridors")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "corridors"
              ? "bg-[#7c3aed] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === "corridors" ? "text-white" : "text-[#777587]"}`} />
          <span>Corridor Health & Asset Possession Matrix</span>
        </button>

        <button
          id="zonal-subtab-policy"
          type="button"
          onClick={() => setActiveTab("policy")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "policy"
              ? "bg-[#7c3aed] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "policy" ? "text-white" : "text-[#777587]"}`} />
          <span>Daily Schedule</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "complaints" && (
        <HierarchicalIssueInbox
          user={zonalUser}
          mode="complaints"
          onNavigateToCoa={() => onNavigate("coa-management")}
          onIssueResolved={() => fetchCorridors()}
          onIssuesUpdated={() => fetchCorridors()}
        />
      )}

      {activeTab === "status" && (
        <HierarchicalIssueInbox
          user={zonalUser}
          mode="status"
          onNavigateToCoa={() => onNavigate("coa-management")}
          onIssueResolved={() => fetchCorridors()}
          onIssuesUpdated={() => fetchCorridors()}
        />
      )}

      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Top Banner Card */}
          <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#f3e8ff] text-[#7c3aed] text-[10px] font-mono font-bold rounded">
                  Zonal Track Possession Register
                </span>
                <span className="text-xs text-[#777587] font-mono">
                  Weekly / Monthly / Manual / Ad-hoc Plans
                </span>
              </div>
              <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7c3aed]" />
                <span>Service Requests & COA Maintenance Calendar Plans</span>
              </h3>
              <p className="text-xs text-[#464555] max-w-2xl leading-relaxed">
                Review submitted track possession requests, requested time periods (Weekly, Monthly, Manual, or Ad-hoc),
                and inspect COA-provided calendar schedule plans complete with task names and engineering descriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("service-request")}
              className="px-4 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Apply New Service Request</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#464555]">
              <Filter className="w-3.5 h-3.5 text-[#777587]" />
              <span className="font-bold">Filter View:</span>
              <div className="flex items-center gap-1 bg-[#eceef0] p-0.5 rounded-lg border border-[#c7c4d8]/40">
                {(
                  [
                    { id: "ALL", label: `All (${requests.length})` },
                    {
                      id: "COA_PLANS",
                      label: `COA Plans Active (${requests.filter((r) => r.maintenanceSchedule).length})`,
                    },
                    {
                      id: "PENDING",
                      label: `Pending Review (${requests.filter((r) => r.status === "Pending").length})`,
                    },
                    {
                      id: "DECLINED",
                      label: `Declined (${requests.filter((r) => r.status === "Declined").length})`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRequestFilter(f.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      requestFilter === f.id
                        ? "bg-white text-[#7c3aed] shadow-xs"
                        : "text-[#777587] hover:text-[#191c1e]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-mono text-[#777587]">
              Showing {requests.filter((r) => {
                if (requestFilter === "COA_PLANS") return !!r.maintenanceSchedule;
                if (requestFilter === "PENDING") return r.status === "Pending";
                if (requestFilter === "DECLINED") return r.status === "Declined";
                return true;
              }).length} of {requests.length} total requests
            </span>
          </div>

          {/* Requests & Plans Table */}
          <div className="bg-white border border-[#c7c4d8]/70 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#464555] uppercase text-[10px] font-bold tracking-wider border-b border-[#eceef0]">
                    <th className="py-3 px-4">Task Name & Description</th>
                    <th className="py-3 px-3">Corridor & Dept</th>
                    <th className="py-3 px-3">Maintenance Period</th>
                    <th className="py-3 px-3">Priority & Status</th>
                    <th className="py-3 px-4 text-right">COA Calendar Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {requests
                    .filter((r) => {
                      if (requestFilter === "COA_PLANS") return !!r.maintenanceSchedule;
                      if (requestFilter === "PENDING") return r.status === "Pending";
                      if (requestFilter === "DECLINED") return r.status === "Declined";
                      return true;
                    })
                    .map((req) => {
                      const periodInfo = (() => {
                        switch (req.timePeriodType) {
                          case "weekly":
                            return {
                              text: "Weekly (7-Day Plan)",
                              style: "bg-blue-50 text-blue-800 border-blue-200",
                            };
                          case "monthly":
                            return {
                              text: "Monthly (Full Month Plan)",
                              style: "bg-purple-50 text-purple-800 border-purple-200",
                            };
                          case "manual":
                            return {
                              text: req.customTimePeriod ? `Manual: ${req.customTimePeriod}` : "Manual Period",
                              style: "bg-amber-50 text-amber-900 border-amber-200",
                            };
                          case "none":
                            return {
                              text: "None / Ad-hoc Slot",
                              style: "bg-slate-100 text-slate-700 border-slate-200",
                            };
                          default:
                            return {
                              text: "Standard",
                              style: "bg-gray-100 text-gray-600 border-gray-200",
                            };
                        }
                      })();

                      return (
                        <tr key={req.id} className="hover:bg-[#f8fafc] transition-colors">
                          {/* Task Name & Description */}
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-[#191c1e] text-[13px] flex items-center gap-1.5">
                              <span>{req.taskName || "Track Possession Work"}</span>
                              {req.maintenanceSchedule && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  Plan Sanctioned
                                </span>
                              )}
                            </div>
                            <p className="text-[#464555] text-[11px] leading-relaxed mt-1 line-clamp-2" title={req.description}>
                              {req.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#777587] font-mono">
                              <span>ID: {req.id}</span>
                              <span>•</span>
                              <span>Preferred: {req.preferredSlot}</span>
                            </div>
                          </td>

                          {/* Corridor & Dept */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-[#191c1e] text-[11px]">{req.trackArea}</div>
                            <div className="text-[10px] text-[#777587] font-mono mt-0.5">{req.department}</div>
                          </td>

                          {/* Maintenance Period */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${periodInfo.style}`}
                            >
                              {periodInfo.text}
                            </span>
                          </td>

                          {/* Priority & Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  req.priority === "High" || req.priority === "Emergency"
                                    ? "bg-red-100 text-red-800"
                                    : req.priority === "Medium"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {req.priority}
                              </span>
                              <div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.status === "Approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : req.status === "Declined"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Action Button: View Calendar Plan */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {req.maintenanceSchedule ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPlan(req.maintenanceSchedule!)}
                                className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>View Calendar Plan</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#777587] italic font-mono">
                                Awaiting COA Schedule
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#777587]">
                        No service requests recorded. Click "Apply New Service Request" above to submit one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "corridors" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#eceef0]">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7c3aed]" />
                <span>Central Line Corridor Status Overview</span>
              </h3>
              <button
                type="button"
                onClick={fetchCorridors}
                disabled={isLoadingCorridors}
                className="text-[#777587] hover:text-[#191c1e] p-1.5 rounded-lg hover:bg-[#eceef0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold font-mono"
                title="Refresh corridor health from live database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCorridors ? "animate-spin text-[#7c3aed]" : ""}`} />
                <span>Sync DB</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dbCorridors.map((corridor) => (
                <div
                  key={corridor.code}
                  className={`p-3.5 bg-white border rounded-xl space-y-2 text-xs transition-all shadow-xs ${
                    corridor.status === "Conflict"
                      ? "border-red-200 bg-red-50/20 ring-1 ring-red-100"
                      : corridor.status === "AI Optimized"
                      ? "border-purple-200 bg-purple-50/20"
                      : "border-[#eceef0] bg-[#f8f9fa]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded text-[11px]">
                      {corridor.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        corridor.status === "Conflict"
                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                          : corridor.status === "AI Optimized"
                          ? "bg-[#f3e8ff] text-[#7c3aed]"
                          : "bg-[#e6f4ea] text-[#137333]"
                      }`}
                    >
                      {corridor.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#191c1e]">
                      {corridor.from} → {corridor.to}
                    </h4>
                    <p className="text-[11px] text-[#777587]">Length: {corridor.lengthKm} km</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#464555] pt-1.5 border-t border-[#eceef0]">
                    <span>
                      Active Blocks: <strong className="text-[#191c1e]">{corridor.activeBlocksCount}</strong>
                    </span>
                    <span>Tracks: {corridor.tracks.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "policy" && (
        <ZonalDailyScheduleCalendar calendarBlocks={calendarBlocks} />
      )}

      {/* Render Zonal Maintenance Calendar Modal */}
      {selectedPlan && (
        <ZonalMaintenanceCalendarModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
};
