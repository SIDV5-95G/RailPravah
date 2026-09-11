import React, { useState, useEffect, useCallback } from "react";
import { CalendarBlock, ScreenType, UserProfile, UserRole } from "../types";
import { HierarchyTabBar } from "./HierarchyTabBar";
import { HierarchicalIssueInbox } from "./HierarchicalIssueInbox";
import { UnifiedDailyScheduleCalendar } from "./UnifiedDailyScheduleCalendar";
import {
  Building2,
  CheckCircle2,
  Layers,
  Send,
  Wrench,
  Zap,
  Radio,
  Clock,
  FileCheck,
  Calendar,
  AlertTriangle,
  Lock,
  FileText,
  CheckCheck,
  RefreshCw,
  Users,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

interface JointClearanceItem {
  departmentCode: "civil" | "electrical" | "signal_comm";
  departmentName: string;
  shortLabel: string;
  scope: string;
  status: string;
  statusColor: "emerald" | "blue" | "purple" | "amber" | "rose";
  activeFieldGangs: number;
  onDutyStaffCount: number;
  totalStrength: number;
  openIssuesCount: number;
  activeCautionOrders: number;
  leadOfficer: string;
  lastSync: string;
}

interface SanctionedBlockItem {
  id: string;
  blockRef: string;
  section: string;
  track: string;
  requestedWindow: string;
  departmentConcurrence: string;
  coaStatus: string;
  status: string;
  createdAt?: string;
  explanation?: string;
}

interface DepartmentHeadDashboardScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onSwitchUserRole?: (role: UserRole) => void;
  calendarBlocks?: CalendarBlock[];
}

export const DepartmentHeadDashboardScreen: React.FC<DepartmentHeadDashboardScreenProps> = ({
  user,
  onNavigate,
  onSwitchUserRole,
  calendarBlocks,
}) => {
  const [activeTab, setActiveTab] = useState<"complaints" | "status" | "sync" | "sanctioned" | "calendar">("complaints");
  
  // Database-driven Joint Clearances & Sanctioned Blocks
  const [clearances, setClearances] = useState<JointClearanceItem[]>([]);
  const [isLoadingClearances, setIsLoadingClearances] = useState(false);

  const [sanctionedBlocks, setSanctionedBlocks] = useState<SanctionedBlockItem[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  const fetchClearances = useCallback(async () => {
    setIsLoadingClearances(true);
    try {
      const res = await fetch("/api/department/joint-clearances");
      const data = await res.json();
      if (data.success && Array.isArray(data.clearances)) {
        setClearances(data.clearances);
      }
    } catch (err) {
      console.warn("Error fetching joint clearances from DB:", err);
    } finally {
      setIsLoadingClearances(false);
    }
  }, []);

  const fetchSanctionedBlocks = useCallback(async () => {
    setIsLoadingBlocks(true);
    try {
      const res = await fetch("/api/department/sanctioned-blocks");
      const data = await res.json();
      if (data.success && Array.isArray(data.blocks)) {
        setSanctionedBlocks(data.blocks);
      }
    } catch (err) {
      console.warn("Error fetching sanctioned blocks from DB:", err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, []);

  const handleUpdateStatus = async (deptCode: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/department/joint-clearances/${deptCode}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchClearances();
      }
    } catch (err) {
      console.warn("Error updating clearance status:", err);
    }
  };

  useEffect(() => {
    fetchClearances();
    fetchSanctionedBlocks();
  }, [fetchClearances, fetchSanctionedBlocks]);

  useEffect(() => {
    const handleOpenCalendar = () => {
      setActiveTab("calendar");
    };
    window.addEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
    return () => window.removeEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
  }, []);

  if (user.userRole !== "department_user") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-white rounded-2xl border border-[#ffdad6] shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1e]">
          Strict Access Control: Department Head Desk Restricted
        </h2>
        <p className="text-xs text-[#464555] max-w-md mx-auto leading-relaxed">
          The Department Head Dashboard is exclusively for Senior Divisional Engineers (Sr. DEN) and Department Authorities.
          Your current role (<strong>{user.role}</strong>) cannot grant divisional sanctions or multi-departmental clearances.
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

  const deptUser = user;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Concurred":
      case "Clearance Granted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100";
      case "Power Isolation Ready":
        return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100";
      case "Staff Dispatched":
        return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-100";
      case "Under Inspection":
      case "Testing In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100";
    }
  };

  const getDeptIcon = (code: string) => {
    switch (code) {
      case "civil":
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case "electrical":
        return <Zap className="w-4 h-4 text-blue-600" />;
      case "signal_comm":
        return <Radio className="w-4 h-4 text-purple-600" />;
      default:
        return <Layers className="w-4 h-4 text-[#7c3aed]" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Hierarchy Chain Navigation Bar */}
      <HierarchyTabBar
        currentScreen="department-dashboard"
        onNavigate={onNavigate}
        currentUser={user}
        onSwitchUserRole={onSwitchUserRole}
      />

      {/* Screen Header Banner */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#ffe4e6] text-[#be123c] text-[11px] font-mono font-bold rounded-md uppercase">
              Departmental Technical Sanction
            </span>
            <span className="text-xs text-[#777587] font-mono">Division: Mumbai Division (CR)</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#be123c]" />
            <span>Department Head Review & Sanction Desk</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-[#f8f9fa] p-3 rounded-xl border border-[#eceef0] min-w-0 max-w-full">
          <img
            src={deptUser.avatarUrl}
            alt={deptUser.name}
            className="w-10 h-10 rounded-full border border-[#c7c4d8] object-cover shrink-0"
          />
          <div className="text-xs min-w-0">
            <div className="font-bold text-[#191c1e] truncate max-w-[180px] sm:max-w-[220px]" title={deptUser.name}>
              {deptUser.name}
            </div>
            <div className="text-[11px] text-[#777587] font-mono truncate max-w-[180px] sm:max-w-[220px]" title={deptUser.role}>
              {deptUser.role}
            </div>
            <div className="text-[10px] text-[#be123c] font-semibold whitespace-nowrap font-mono">
              Emp ID: {deptUser.empId}
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          id="dept-subtab-complaints"
          type="button"
          onClick={() => setActiveTab("complaints")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "complaints"
              ? "bg-[#be123c] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Building2 className={`w-4 h-4 ${activeTab === "complaints" ? "text-white" : "text-[#be123c]"}`} />
          <span>Zonal Escalations & Sanctions Review Desk</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "complaints" ? "bg-white/20 text-white" : "bg-[#ffe4e6] text-[#be123c]"
          }`}>
            Complaints Review
          </span>
        </button>

        <button
          id="dept-subtab-status"
          type="button"
          onClick={() => setActiveTab("status")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "status"
              ? "bg-[#be123c] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <CheckCheck className={`w-4 h-4 ${activeTab === "status" ? "text-white" : "text-[#be123c]"}`} />
          <span>Complaint Status & Tracking</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "status" ? "bg-white/20 text-white" : "bg-[#ffe4e6] text-[#be123c]"
          }`}>
            Status Monitor
          </span>
        </button>

        <button
          id="dept-subtab-sync"
          type="button"
          onClick={() => setActiveTab("sync")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "sync"
              ? "bg-[#be123c] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === "sync" ? "text-white" : "text-[#777587]"}`} />
          <span>Inter-Departmental Joint Clearance Matrix</span>
        </button>

        <button
          id="dept-subtab-sanctioned"
          type="button"
          onClick={() => setActiveTab("sanctioned")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "sanctioned"
              ? "bg-[#be123c] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <FileCheck className={`w-4 h-4 ${activeTab === "sanctioned" ? "text-white" : "text-[#777587]"}`} />
          <span>Sanctioned Blocks Sent to COA</span>
        </button>

        <button
          id="dept-subtab-calendar"
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "calendar"
              ? "bg-[#be123c] text-white shadow-xs"
              : "text-[#777587] bg-white border border-[#c7c4d8]/60 hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === "calendar" ? "text-white" : "text-[#be123c]"}`} />
          <span>Daily Schedule Calendar</span>
          <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
            activeTab === "calendar" ? "bg-white/20 text-white" : "bg-[#ffe4e6] text-[#be123c]"
          }`}>
            Corridor Schedule
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "complaints" && (
        <HierarchicalIssueInbox
          user={deptUser}
          mode="complaints"
          onNavigateToCoa={() => onNavigate("coa-management")}
        />
      )}

      {activeTab === "status" && (
        <HierarchicalIssueInbox
          user={deptUser}
          mode="status"
          onNavigateToCoa={() => onNavigate("coa-management")}
        />
      )}

      {activeTab === "sync" && (
        <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#eceef0]">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#be123c]" />
              <span>Joint Cross-Departmental Clearance Status (Engineering • TRD • S&T)</span>
            </h3>
            <button
              type="button"
              onClick={fetchClearances}
              disabled={isLoadingClearances}
              className="text-[#777587] hover:text-[#191c1e] p-1.5 rounded-lg hover:bg-[#eceef0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold font-mono"
              title="Sync clearances from live database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClearances ? "animate-spin text-[#be123c]" : ""}`} />
              <span>Sync DB</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {clearances.map((item) => (
              <div
                key={item.departmentCode}
                className="p-4 bg-[#f8f9fa] border border-[#eceef0] rounded-xl space-y-3 shadow-xs hover:border-[#c7c4d8] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#191c1e]">
                    {getDeptIcon(item.departmentCode)}
                    <span>{item.departmentName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#777587] bg-white px-2 py-0.5 rounded border border-[#eceef0]">
                    {item.shortLabel}
                  </span>
                </div>

                <p className="text-[#464555] text-[11px] leading-relaxed min-h-[48px]">
                  {item.scope}
                </p>

                {/* Database Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#eceef0] text-[11px] font-mono text-[#777587]">
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#eceef0]">
                    <span>Staff on Duty:</span>
                    <strong className="text-[#191c1e]">{item.onDutyStaffCount}/{item.totalStrength}</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#eceef0]">
                    <span>Field Gangs:</span>
                    <strong className="text-[#191c1e]">{item.activeFieldGangs}</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#eceef0]">
                    <span>Caution Orders:</span>
                    <strong className={item.activeCautionOrders > 0 ? "text-amber-700" : "text-[#191c1e]"}>
                      {item.activeCautionOrders}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#eceef0]">
                    <span>Open Issues:</span>
                    <strong className={item.openIssuesCount > 0 ? "text-red-700" : "text-emerald-700"}>
                      {item.openIssuesCount}
                    </strong>
                  </div>
                </div>

                {/* Status Row & Action */}
                <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#777587]">Status:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusBadgeStyle(item.status)}`}>
                      {item.status}
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item.departmentCode, e.target.value)}
                      className="text-[10px] bg-white border border-[#c7c4d8] rounded px-1 py-0.5 text-[#464555] cursor-pointer hover:border-[#be123c]"
                      title="Update clearance state in database"
                    >
                      <option value="Concurred">Concurred</option>
                      <option value="Power Isolation Ready">Power Isolation Ready</option>
                      <option value="Staff Dispatched">Staff Dispatched</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Clearance Granted">Clearance Granted</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sanctioned" && (
        <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#eceef0]">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Sanctioned Block Applications Transmitted to COA</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSanctionedBlocks}
                disabled={isLoadingBlocks}
                className="text-[#777587] hover:text-[#191c1e] p-1.5 rounded-lg hover:bg-[#eceef0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold font-mono"
                title="Refresh sanctioned blocks from live database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlocks ? "animate-spin text-[#be123c]" : ""}`} />
                <span>Sync DB</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("coa-management")}
                className="px-3 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Inspect in COA Management Console</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#eceef0] text-[#777587] font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Block Ref</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Track / Line</th>
                  <th className="p-3">Requested Window</th>
                  <th className="p-3">Department Concurrence</th>
                  <th className="p-3">COA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {sanctionedBlocks.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#3525cd]">{b.blockRef}</td>
                    <td className="p-3 font-semibold text-[#191c1e]">{b.section}</td>
                    <td className="p-3 font-mono">{b.track}</td>
                    <td className="p-3 font-mono">{b.requestedWindow}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{b.departmentConcurrence}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        b.coaStatus.includes("Cleared") || b.coaStatus.includes("Dispatched")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {b.coaStatus}
                      </span>
                    </td>
                  </tr>
                ))}

                {sanctionedBlocks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#777587] font-mono">
                      No sanctioned maintenance blocks logged in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <UnifiedDailyScheduleCalendar
          role="department"
          roleTitle={`Department Sanctions Authority (${deptUser.department || "All"})`}
          calendarBlocks={calendarBlocks}
          defaultYear={2026}
          defaultMonth={8} // September 2026
          defaultDay={2}
        />
      )}
    </div>
  );
};
