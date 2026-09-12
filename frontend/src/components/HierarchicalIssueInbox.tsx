import React, { useState, useEffect } from "react";
import {
  HierarchicalIssue,
  UserProfile,
  IssueSnapshot,
  IssueLifecycleStatus,
  PriorityType,
} from "../types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  User,
  Send,
  Wrench,
  Clock,
  MapPin,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  CheckCheck,
  Lock,
} from "lucide-react";
import { IssueTimelineView } from "./IssueTimelineView";
import { EditIssueModal } from "./EditIssueModal";
import { EscalateIssueModal } from "./EscalateIssueModal";
import { ResolveIssueModal } from "./ResolveIssueModal";
import { ModificationHistoryModal } from "./ModificationHistoryModal";
import { ComplaintMediaGallery } from "./ComplaintMediaGallery";
import { EscalatedHandoverModal } from "./EscalatedHandoverModal";

interface HierarchicalIssueInboxProps {
  user: UserProfile;
  onNavigateToCoa?: () => void;
  mode?: "complaints" | "status";
  onIssueResolved?: (issue: HierarchicalIssue) => void;
  onIssuesUpdated?: () => void;
}

export const HierarchicalIssueInbox: React.FC<HierarchicalIssueInboxProps> = ({
  user,
  onNavigateToCoa,
  mode = "complaints",
  onIssueResolved,
  onIssuesUpdated,
}) => {
  const [issues, setIssues] = useState<HierarchicalIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedDetails, setExpandedDetails] = useState<{ [id: string]: boolean }>({});

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Modals state
  const [editingIssue, setEditingIssue] = useState<HierarchicalIssue | null>(null);
  const [escalatingIssue, setEscalatingIssue] = useState<HierarchicalIssue | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<HierarchicalIssue | null>(null);
  const [historyIssue, setHistoryIssue] = useState<HierarchicalIssue | null>(null);
  const [viewingHandoverIssue, setViewingHandoverIssue] = useState<HierarchicalIssue | null>(null);
  const [originalPeekIssue, setOriginalPeekIssue] = useState<HierarchicalIssue | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Fetch issues with backend hierarchy role headers
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        "x-user-role": user.userRole,
        "x-user-empid": user.empId,
        "x-user-dept": user.department,
      };

      const res = await fetch(`/api/issues?role=${user.userRole}&empId=${user.empId}&department=${encodeURIComponent(user.department || "")}`, {
        headers,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error("Error fetching hierarchical issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    const handleIssuesUpdated = () => {
      fetchIssues();
    };
    window.addEventListener("railpravah:issues-updated", handleIssuesUpdated);
    const interval = setInterval(fetchIssues, 4000);
    return () => {
      window.removeEventListener("railpravah:issues-updated", handleIssuesUpdated);
      clearInterval(interval);
    };
  }, [user.userRole, user.empId, user.department]);

  // Handle Edit Save
  const handleSaveEdit = async (
    updatedActiveRequest: IssueSnapshot,
    changesSummary: string,
    remarks: string
  ) => {
    if (!editingIssue) return;
    try {
      const levelTitle =
        user.userRole === "supervisor"
          ? "Supervisor"
          : user.userRole === "zonal_head"
          ? "Zonal Head"
          : user.userRole === "department_user"
          ? "Department Head"
          : "COA Management";

      const res = await fetch(`/api/issues/${editingIssue.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-empid": user.empId,
          "x-user-dept": user.department,
        },
        body: JSON.stringify({
          level: levelTitle,
          department: user.department,
          modifiedBy: {
            name: user.name,
            empId: user.empId,
            role: user.role,
            department: user.department,
          },
          changesSummary,
          remarks,
          activeRequest: updatedActiveRequest,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingIssue(null);
        setActionSuccessMessage(`Issue ${editingIssue.ticketNo} updated. Original worker submission preserved.`);
        setTimeout(() => setActionSuccessMessage(null), 5000);
        fetchIssues();
      } else {
        setActionErrorMessage(data.error || "Failed to update issue");
        setTimeout(() => setActionErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error updating issue:", err);
      setActionErrorMessage("Network or server error updating issue");
      setTimeout(() => setActionErrorMessage(null), 5000);
    }
  };

  // Quick Priority Change (Supervisors and Higher Authorities)
  const handleQuickPriorityChange = async (issue: HierarchicalIssue, newPriority: PriorityType) => {
    const oldPriority = issue.activeRequest.priority;
    if (oldPriority === newPriority) return;

    // Optimistically update local state immediately
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issue.id
          ? {
              ...i,
              activeRequest: { ...i.activeRequest, priority: newPriority },
            }
          : i
      )
    );

    try {
      const levelTitle =
        user.userRole === "supervisor"
          ? "Supervisor"
          : user.userRole === "zonal_head"
          ? "Zonal Head"
          : user.userRole === "department_user" || user.userRole === "department_head"
          ? "Department Head"
          : "COA Management";

      const res = await fetch(`/api/issues/${issue.id}/priority`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-empid": user.empId,
          "x-user-dept": user.department,
        },
        body: JSON.stringify({
          priority: newPriority,
          level: levelTitle,
          department: user.department,
          modifiedBy: {
            name: user.name,
            empId: user.empId,
            role: user.role,
            department: user.department,
          },
          remarks: `Priority changed from ${oldPriority} to ${newPriority} by ${levelTitle}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`Priority updated to ${newPriority} for ticket ${issue.ticketNo}. Synchronized across all hierarchy levels.`);
        setTimeout(() => setActionSuccessMessage(null), 4000);
        fetchIssues();
      } else {
        setActionErrorMessage(data.error || "Failed to update priority");
        setTimeout(() => setActionErrorMessage(null), 5000);
        fetchIssues();
      }
    } catch (err) {
      console.error("Error updating priority:", err);
      setActionErrorMessage("Network or server error updating priority");
      setTimeout(() => setActionErrorMessage(null), 5000);
      fetchIssues();
    }
  };

  // Handle Escalation
  const handleConfirmEscalate = async (reason: string, remarks: string) => {
    if (!escalatingIssue) return;
    try {
      const targetLevel =
        user.userRole === "supervisor"
          ? "Zonal Head"
          : user.userRole === "zonal_head"
          ? "Department Head"
          : "COA Management";

      const res = await fetch(`/api/issues/${escalatingIssue.id}/escalate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-empid": user.empId,
          "x-user-dept": user.department,
        },
        body: JSON.stringify({
          userRole: user.userRole,
          department: user.department,
          modifiedBy: {
            name: user.name,
            empId: user.empId,
            role: user.role,
            department: user.department,
          },
          reason,
          remarks,
          targetLevel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEscalatingIssue(null);
        setActionSuccessMessage(
          `Issue ${escalatingIssue.ticketNo} successfully escalated to ${targetLevel}.`
        );
        setTimeout(() => setActionSuccessMessage(null), 5000);
        fetchIssues();
      } else {
        setActionErrorMessage(data.error || "Failed to escalate issue");
        setTimeout(() => setActionErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error escalating issue:", err);
      setActionErrorMessage("Network or server error escalating issue");
      setTimeout(() => setActionErrorMessage(null), 5000);
    }
  };

  // Handle Resolve
  const handleConfirmResolve = async (resolutionDetails: string) => {
    if (!resolvingIssue) return;
    try {
      const levelTitle =
        user.userRole === "supervisor"
          ? "Supervisor"
          : user.userRole === "zonal_head"
          ? "Zonal Head"
          : user.userRole === "department_user"
          ? "Department Head"
          : "COA Management";

      const res = await fetch(`/api/issues/${resolvingIssue.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
          "x-user-empid": user.empId,
          "x-user-dept": user.department,
        },
        body: JSON.stringify({
          userRole: user.userRole,
          level: levelTitle,
          department: user.department,
          modifiedBy: {
            name: user.name,
            empId: user.empId,
            role: user.role,
            department: user.department,
          },
          resolutionDetails,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResolvingIssue(null);
        setActionSuccessMessage(`Issue ${resolvingIssue.ticketNo} resolved and certified.`);
        setTimeout(() => setActionSuccessMessage(null), 5000);
        fetchIssues();
        if (onIssueResolved) onIssueResolved(data.issue || resolvingIssue);
        if (onIssuesUpdated) onIssuesUpdated();
      } else {
        setActionErrorMessage(data.error || "Failed to resolve issue");
        setTimeout(() => setActionErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error resolving issue:", err);
      setActionErrorMessage("Network or server error resolving issue");
      setTimeout(() => setActionErrorMessage(null), 5000);
    }
  };

  // Check if issue is resolved at current user's level
  const isResolvedAtCurrentLevel = (issue: HierarchicalIssue, role: string, userEmpId?: string): boolean => {
    const status = issue.currentStatus;
    const isAnyResolved =
      status.startsWith("Resolved") ||
      status === "Sanctioned by COA" ||
      status === "Resolved / Closed";
    if (!isAnyResolved) return false;

    if (role === "worker") {
      // Worker sees resolved status for issues they reported
      return !userEmpId || issue.originalRequest?.reportedBy?.empId === userEmpId || (issue as any).reportedBy?.empId === userEmpId;
    }
    if (role === "supervisor") {
      // Supervisor sees issues resolved at supervisor level
      return (
        status === "Resolved by Supervisor" ||
        (status === "Resolved / Closed" && (!issue.resolvedBy?.level || Boolean(issue.resolvedBy?.level?.toLowerCase().includes("supervisor")))) ||
        Boolean(issue.resolvedBy?.level?.toLowerCase().includes("supervisor"))
      );
    }
    if (role === "zonal_head") {
      // Zonal Head sees issues resolved at Zonal level only
      return status === "Resolved by Zonal Head" || Boolean(issue.resolvedBy?.level?.toLowerCase().includes("zonal"));
    }
    if (role === "department_user" || role === "department_head" || role === "dept_head") {
      // Department Head sees issues resolved at Department level only
      return (
        status === "Resolved by Department Head" ||
        Boolean(issue.resolvedBy?.level?.toLowerCase().includes("department") || issue.resolvedBy?.level?.toLowerCase().includes("dept"))
      );
    }
    if (role === "coa_admin" || role === "coa") {
      // COA sees issues sanctioned/resolved at COA level or division-wide resolutions
      return status === "Sanctioned by COA" || Boolean(issue.resolvedBy?.level?.toLowerCase().includes("coa")) || isAnyResolved;
    }
    return isAnyResolved;
  };

  // Check if issue is pending action at current user's level
  const isActionRequiredAtCurrentLevel = (issue: HierarchicalIssue, role: string, userEmpId?: string): boolean => {
    const status = issue.currentStatus;
    const isAnyResolved =
      status.startsWith("Resolved") ||
      status === "Sanctioned by COA" ||
      status === "Resolved / Closed";
    if (isAnyResolved) return false;

    if (role === "worker") {
      return !userEmpId || issue.originalRequest?.reportedBy?.empId === userEmpId || (issue as any).reportedBy?.empId === userEmpId;
    }
    if (role === "supervisor") {
      return status === "Reported" || status === "Under Supervisor Review";
    }
    if (role === "zonal_head") {
      return status === "Escalated to Zonal Head" || status === "Under Zonal Review";
    }
    if (role === "department_user" || role === "department_head" || role === "dept_head") {
      return status === "Escalated to Department Head" || status === "Under Department Review";
    }
    if (role === "coa_admin" || role === "coa") {
      return status === "Escalated to COA" || status === "Under COA Review";
    }
    return true;
  };

  // Filter issues
  const filteredIssues = issues.filter((i) => {
    const matchSearch =
      i.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.activeRequest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    const isResolvedOrSanctioned =
      i.currentStatus.startsWith("Resolved") ||
      i.currentStatus === "Sanctioned by COA" ||
      i.currentStatus === "Resolved / Closed";

    if (mode === "complaints") {
      if (statusFilter === "resolved") {
        return isResolvedAtCurrentLevel(i, user.userRole, user.empId);
      }
      if (statusFilter === "pending") {
        return isActionRequiredAtCurrentLevel(i, user.userRole, user.empId);
      }
      // By default in complaints inbox mode, remove already scheduled/resolved complaints
      return !isResolvedOrSanctioned;
    }

    if (mode === "status") {
      if (statusFilter === "pending") {
        return isActionRequiredAtCurrentLevel(i, user.userRole, user.empId);
      }
      if (statusFilter === "resolved") {
        return isResolvedAtCurrentLevel(i, user.userRole, user.empId);
      }
      return true;
    }

    return true;
  });

  const getCustodianText = (status: IssueLifecycleStatus): string => {
    switch (status) {
      case "Reported":
      case "Under Supervisor Review":
        return "Current Custodian: Section Supervisor (SSE Field Review)";
      case "Escalated to Zonal Head":
      case "Under Zonal Review":
        return "Current Custodian: Zonal Technical Authority (Chief Track Engineer)";
      case "Escalated to Department Head":
      case "Under Department Review":
        return "Current Custodian: Department Head (Sr. Divisional Engineer)";
      case "Escalated to COA":
      case "Under COA Review":
        return "Current Custodian: COA Master Traffic & Power Block Controller";
      case "Resolved by Supervisor":
      case "Resolved by Zonal Head":
      case "Resolved by Department Head":
      case "Resolved / Closed":
        return "Final Status: Resolution Certified & Completed";
      case "Sanctioned by COA":
        return "Final Status: COA प्रवाहPlan Slot Approved & Dispatched";
      default:
        return "Current Custodian: Railway Authority Desk";
    }
  };

  const getRoleHeaderInfo = () => {
    if (mode === "status") {
      switch (user.userRole) {
        case "worker":
          return {
            title: "My Complaints Status & Approval Tracker",
            subtitle: "",
            badge: "Complaint Status Monitor",
            color: "bg-emerald-600",
          };
        case "supervisor":
          return {
            title: "Section Complaint Status & Lifecycle Tracking",
            subtitle: "",
            badge: "Complaint Status Monitor",
            color: "bg-amber-600",
          };
        case "zonal_head":
          return {
            title: "Zonal Complaint Status & Corridor Progress",
            subtitle: "",
            badge: "Complaint Status Monitor",
            color: "bg-orange-600",
          };
        case "department_user":
          return {
            title: "Department Complaint Status & Sanction Tracker",
            subtitle: "",
            badge: "Complaint Status Monitor",
            color: "bg-rose-600",
          };
        default:
          return {
            title: "Central Railway Corridor Complaint Status Monitor",
            subtitle: "",
            badge: "Complaint Status Monitor",
            color: "bg-blue-600",
          };
      }
    }

    switch (user.userRole) {
      case "worker":
        return {
          title: "My Logged Complaints & Defect Reports",
          subtitle: "Reviewing all field defect complaints logged by you with technical details, equipment, and photo evidence.",
          badge: "Worker Complaints Log",
          color: "bg-emerald-600",
        };
      case "supervisor":
        return {
          title: "Worker Complaints & Technical Review Desk",
          subtitle: "",
          badge: "Supervisor Review Desk",
          color: "bg-amber-600",
        };
      case "zonal_head":
        return {
          title: "Supervisor Requests & Technical Review",
          subtitle: "",
          badge: "Zonal Review Desk",
          color: "bg-orange-600",
        };
      case "department_user":
        return {
          title: "Zonal Escalations & Sanctions Review Desk",
          subtitle: "",
          badge: "Department Review Desk",
          color: "bg-rose-600",
        };
      default:
        return {
          title: "Escalated Complaints Review Desk",
          subtitle: "Review escalated complaints requiring emergency or prioritized corridor slot clearance.",
          badge: "COA Complaints Desk",
          color: "bg-blue-600",
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white border border-[#c7c4d8]/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-white text-[10px] font-mono font-bold rounded ${headerInfo.color}`}>
              {headerInfo.badge}
            </span>
            <span className="text-xs text-[#777587] font-mono">User: {user.name} ({user.empId})</span>
          </div>
          <h2 className="text-base font-bold text-[#191c1e] mt-1">{headerInfo.title}</h2>
          {headerInfo.subtitle ? (
            <p className="text-xs text-[#464555] mt-0.5">{headerInfo.subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchIssues}
            className="px-3 py-1.5 text-xs font-semibold text-[#464555] bg-[#f2f4f6] hover:bg-[#eceef0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {user.userRole === "coa_admin" && onNavigateToCoa && (
            <button
              type="button"
              onClick={onNavigateToCoa}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#3525cd] hover:bg-[#4f46e5] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Go to COA Management Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Message */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-[10px] font-mono uppercase font-bold text-emerald-900 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{actionErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            className="text-[10px] font-mono uppercase font-bold text-red-900 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Mode Metrics Summary */}
      {mode === "status" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-[#c7c4d8]/60 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#777587] uppercase tracking-wider block">Total Complaints</span>
            <span className="text-xl font-black text-[#191c1e]">{issues.length}</span>
            <span className="text-[10px] text-[#777587] block mt-0.5">Tracked in hierarchy</span>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Under Active Review</span>
            <span className="text-xl font-black text-amber-900">
              {issues.filter((i) => isActionRequiredAtCurrentLevel(i, user.userRole, user.empId)).length}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">Local review level</span>
          </div>
          <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider block">Escalated Higher</span>
            <span className="text-xl font-black text-orange-900">
              {issues.filter((i) => i.currentStatus.startsWith("Escalated")).length}
            </span>
            <span className="text-[10px] text-orange-700 block mt-0.5">Transferred upward</span>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Resolved & Certified</span>
            <span className="text-xl font-black text-emerald-900">
              {issues.filter((i) => isResolvedAtCurrentLevel(i, user.userRole, user.empId)).length}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">Verified at this level</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#c7c4d8]/60 shadow-xs text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777587]" />
          <input
            type="text"
            placeholder={mode === "status" ? "Search complaint status, ticket..." : "Search ticket, title, station..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#3525cd] text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            {mode === "status" ? "All Statuses" : "All Complaints"} ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            {mode === "status" ? "Pending / Escalated" : "Action Required"} ({issues.filter((i) => isActionRequiredAtCurrentLevel(i, user.userRole, user.empId)).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              statusFilter === "resolved"
                ? "bg-emerald-600 text-white"
                : "bg-[#f2f4f6] text-[#464555] hover:bg-[#eceef0]"
            }`}
          >
            Resolved ({issues.filter((i) => isResolvedAtCurrentLevel(i, user.userRole, user.empId)).length})
          </button>
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="p-10 bg-white rounded-xl border border-[#c7c4d8]/60 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#3525cd] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#777587]">Loading verified issues...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-10 bg-white rounded-xl border border-[#c7c4d8]/60 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-[#191c1e]">No Issues Found</h3>
          <p className="text-xs text-[#777587] max-w-sm mx-auto">
            There are no issues under your current jurisdiction or matching the active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isResolved =
              issue.currentStatus.startsWith("Resolved") ||
              issue.currentStatus === "Sanctioned by COA";
            const isWorker = user.userRole === "worker";
            const isSupervisor = user.userRole === "supervisor";
            const isZonal = user.userRole === "zonal_head";
            const isDept = user.userRole === "department_user";
            const isCoa = user.userRole === "coa_admin";

            // Determine if current role holds active decision/edit custody
            const isCurrentRoleCustodian =
              (isSupervisor &&
                (issue.currentStatus === "Reported" ||
                  issue.currentStatus === "Under Supervisor Review")) ||
              (isZonal &&
                (issue.currentStatus === "Escalated to Zonal Head" ||
                  issue.currentStatus === "Under Zonal Review")) ||
              (isDept &&
                (issue.currentStatus === "Escalated to Department Head" ||
                  issue.currentStatus === "Under Department Review")) ||
              (isCoa &&
                (issue.currentStatus === "Escalated to COA" ||
                  issue.currentStatus === "Under COA Review"));

            // Check if matter has been escalated past the current role
            const isMatterEscalated =
              !isResolved &&
              ((isWorker) ||
                (isSupervisor &&
                  !["Reported", "Under Supervisor Review"].includes(issue.currentStatus)) ||
                (isZonal &&
                  !["Escalated to Zonal Head", "Under Zonal Review"].includes(issue.currentStatus)) ||
                (isDept &&
                  !["Escalated to Department Head", "Under Department Review"].includes(issue.currentStatus)));

            // Higher authority name where the matter has been escalated
            const escalatedToLevelName =
              isWorker
                ? "Section Supervisor"
                : isSupervisor
                ? issue.currentStatus.includes("COA")
                  ? "COA Management"
                  : issue.currentStatus.includes("Department")
                  ? "Department Head"
                  : "Zonal Head"
                : isZonal
                ? issue.currentStatus.includes("COA")
                  ? "COA Management"
                  : "Department Head"
                : isDept
                ? "COA Management"
                : "Higher Authority";

            // Can current role edit? (Disabled once matter is escalated)
            const canEdit = !isResolved && isCurrentRoleCustodian;

            // Can current role escalate?
            const canEscalate = !isResolved && isCurrentRoleCustodian && !isCoa;

            // Can change priority (Only current custodian official)
            const canChangePriority = !isResolved && isCurrentRoleCustodian;

            // Target escalation label
            const targetEscalationLabel = isSupervisor
              ? "Escalate to Zonal Head"
              : isZonal
              ? "Forward to Dept Head"
              : "Escalate to COA";

            return (
              <div
                key={issue.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all ${
                  isResolved
                    ? "border-emerald-200"
                    : issue.activeRequest.priority === "Emergency"
                    ? "border-red-300 ring-1 ring-red-200"
                    : "border-[#c7c4d8]/70"
                }`}
              >
                {/* Header */}
                <div className="p-4 bg-[#f8f9fa] border-b border-[#eceef0] flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded">
                        {issue.ticketNo}
                      </span>
                      <span className="text-xs font-bold text-[#191c1e]">{issue.station} Station</span>
                      <span className="text-[11px] text-[#777587] font-mono">
                        {issue.activeRequest.trackSection} • {issue.activeRequest.lineType} •{" "}
                        {issue.activeRequest.nearestKmPost}
                      </span>
                      {canChangePriority ? (
                        <div className="inline-flex items-center gap-1 bg-white border border-[#c7c4d8]/80 rounded-md px-1.5 py-0.5 shadow-2xs">
                          <span className="text-[10px] text-[#777587] font-semibold">Priority:</span>
                          <select
                            value={issue.activeRequest.priority}
                            onChange={(e) => handleQuickPriorityChange(issue, e.target.value as PriorityType)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none border-0 ${
                              issue.activeRequest.priority === "Emergency"
                                ? "bg-red-100 text-red-800"
                                : issue.activeRequest.priority === "High"
                                ? "bg-orange-100 text-orange-800"
                                : issue.activeRequest.priority === "Medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                            title="Click to change priority for active complaint in your custody"
                          >
                            <option value="Emergency">🚨 Emergency</option>
                            <option value="High">⚠️ High</option>
                            <option value="Medium">⚡ Medium</option>
                            <option value="Low">ℹ️ Low</option>
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.activeRequest.priority === "Emergency"
                              ? "bg-red-100 text-red-800"
                              : issue.activeRequest.priority === "High"
                              ? "bg-orange-100 text-orange-800"
                              : issue.activeRequest.priority === "Medium"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {issue.activeRequest.priority} Priority
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#191c1e]">{issue.activeRequest.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isMatterEscalated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#f59e0b]/40">
                        <Lock className="w-3 h-3 text-[#d97706]" />
                        <span>Matter Escalated</span>
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isResolved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {issue.currentStatus}
                    </span>
                  </div>
                </div>

                {/* Body for Status Mode */}
                {mode === "status" ? (
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Status & Custodian Banner */}
                    <div className="p-3 bg-[#e2dfff]/20 border border-[#c7c4d8]/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#3525cd]" />
                        <span className="font-bold text-xs text-[#191c1e]">
                          Active Hierarchy Status:
                        </span>
                        <span className="font-bold text-xs text-[#3525cd]">
                          {issue.currentStatus}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-[#464555] bg-white px-2.5 py-1 rounded-md border border-[#eceef0]">
                        {getCustodianText(issue.currentStatus)}
                      </div>
                    </div>

                    {/* Multi-tier Stepper Timeline */}
                    <IssueTimelineView
                      issue={issue}
                      onViewHistory={() => setHistoryIssue(issue)}
                    />

                    {/* Complaint Field Evidence Photos Uploaded by Worker */}
                    <div className="p-3 bg-[#f8f9fa] border border-[#eceef0] rounded-xl">
                      <ComplaintMediaGallery
                        media={
                          issue.activeRequest.media && issue.activeRequest.media.length > 0
                            ? issue.activeRequest.media
                            : issue.originalRequest.media
                        }
                        ticketNo={issue.ticketNo}
                        station={issue.station}
                        title="Worker Defect Photos & Visual Evidence"
                      />
                    </div>

                    {/* Resolution banner if resolved */}
                    {isResolved && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Resolution Certified by {issue.resolvedBy?.level} ({issue.resolvedBy?.name})</span>
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700">
                            {issue.resolvedAt}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-950 font-medium">{issue.resolutionDetails}</p>
                      </div>
                    )}

                    {/* Collapsible Complaint Details */}
                    <div className="border border-[#eceef0] rounded-xl overflow-hidden bg-[#f8f9fa]">
                      <button
                        type="button"
                        onClick={() => toggleDetails(issue.id)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-[#464555] hover:bg-[#f2f4f6] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#777587]" />
                          <span>{expandedDetails[issue.id] ? "Hide Complaint Technical Details" : "View Complaint Technical Details"}</span>
                        </span>
                        {expandedDetails[issue.id] ? (
                          <ChevronUp className="w-4 h-4 text-[#777587]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#777587]" />
                        )}
                      </button>

                      {expandedDetails[issue.id] && (
                        <div className="p-3 bg-white border-t border-[#eceef0] space-y-2">
                          <p className="text-[#464555]">{issue.activeRequest.description}</p>
                          <div className="flex items-center gap-4 flex-wrap text-xs pt-1">
                            <span className="font-semibold text-[#191c1e]">
                              Est Fix Time: <strong className="text-[#3525cd]">{issue.activeRequest.estimatedFixTimeMinutes} mins</strong>
                            </span>
                            {issue.activeRequest.technicalNotes && (
                              <span className="text-[#777587]">
                                Notes: <span className="text-[#191c1e]">{issue.activeRequest.technicalNotes}</span>
                              </span>
                            )}
                          </div>
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setOriginalPeekIssue(issue)}
                              className="text-xs font-semibold text-[#3525cd] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Original Worker Submission</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Mode Footer */}
                    <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHistoryIssue(issue)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#464555] bg-[#f2f4f6] hover:bg-[#eceef0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Audit Log & Timeline ({issue.modificationHistory.length})</span>
                        </button>
                      </div>
                      <span className="text-[11px] text-[#777587] font-mono">
                        Last Modified: {issue.updatedAt || issue.createdAt || "Original Submission"}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Body for Complaints Review Mode */
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Active vs Original Summary Box */}
                    <div className="p-3 bg-[#f8f9fa] border border-[#eceef0] rounded-xl space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-[#191c1e]">
                          Complaint Technical Description & Scope:
                        </span>
                        <button
                          type="button"
                          onClick={() => setOriginalPeekIssue(issue)}
                          className="text-xs font-semibold text-[#3525cd] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Original Worker Submission</span>
                        </button>
                      </div>

                      <p className="text-[#464555] bg-white p-2.5 rounded-lg border border-[#eceef0]">
                        {issue.activeRequest.description}
                      </p>

                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <span className="text-sm font-bold text-[#191c1e] flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#3525cd]" />
                          <span>Est Work Time:</span>{" "}
                          <span className="text-base font-extrabold text-[#3525cd]">
                            {issue.activeRequest.estimatedFixTimeMinutes} minutes
                          </span>
                        </span>
                        {issue.activeRequest.technicalNotes && (
                          <span className="text-[11px] font-mono text-[#777587]">
                            Notes:{" "}
                            <strong className="text-[#191c1e]">
                              {issue.activeRequest.technicalNotes}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Media gallery */}
                      <div className="pt-2 border-t border-[#eceef0]">
                        <ComplaintMediaGallery
                          media={
                            issue.activeRequest.media && issue.activeRequest.media.length > 0
                              ? issue.activeRequest.media
                              : (issue.originalRequest as any)?.media || []
                          }
                          ticketNo={issue.ticketNo}
                          station={issue.station}
                          title="Worker Defect Photos & Visual Evidence"
                        />
                      </div>
                    </div>

                    {/* Resolution banner if resolved */}
                    {isResolved && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Resolved by {issue.resolvedBy?.level}</span>
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700">
                            {issue.resolvedAt}
                          </span>
                        </div>
                        <p className="text-xs">{issue.resolutionDetails}</p>
                      </div>
                    )}

                    {/* Matter Escalated Notice Banner */}
                    {isMatterEscalated && (
                      <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl text-xs text-[#92400e] flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock className="w-4 h-4 text-[#d97706] shrink-0" />
                          <span>
                            <strong>Matter Escalated:</strong> Forwarded to <strong>{escalatedToLevelName}</strong>. Editing and modifications are locked at your hierarchy level.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingHandoverIssue(issue)}
                          className="font-mono text-[11px] font-bold bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] px-3 py-1.5 rounded-lg border border-[#f59e0b]/50 shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#d97706]" />
                          <span>Read Only • View Submission &rarr;</span>
                        </button>
                      </div>
                    )}

                    {/* Action Controls Bar */}
                    <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHistoryIssue(issue)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#464555] bg-[#f2f4f6] hover:bg-[#eceef0] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Audit Log ({issue.modificationHistory.length})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isMatterEscalated && (
                          <button
                            type="button"
                            onClick={() => setViewingHandoverIssue(issue)}
                            className="px-3.5 py-1.5 bg-[#fef3c7] hover:bg-[#fde68a] text-[#92400e] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-[#f59e0b]/50 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#d97706]" />
                            <span>View Handover Submission</span>
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditingIssue(issue)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#191c1e] bg-white border border-[#c7c4d8] hover:bg-[#f8f9fa] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#3525cd]" />
                            <span>Edit Active Request</span>
                          </button>
                        )}

                        {!isResolved && !isWorker && (
                          <button
                            type="button"
                            onClick={() => setResolvingIssue(issue)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        {canEscalate && (
                          <button
                            type="button"
                            onClick={() => setEscalatingIssue(issue)}
                            className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              targetEscalationLabel.includes("COA")
                                ? "bg-[#ba1a1a] hover:bg-[#900000]"
                                : "bg-[#3525cd] hover:bg-[#4f46e5]"
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{targetEscalationLabel}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Edit Issue Modal */}
      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          userRoleTitle={
            user.userRole === "supervisor"
              ? "Supervisor"
              : user.userRole === "zonal_head"
              ? "Zonal Head"
              : user.userRole === "department_user"
              ? "Department Head"
              : "Authority"
          }
          onClose={() => setEditingIssue(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* MODAL 2: Escalate Issue Modal */}
      {escalatingIssue && (
        <EscalateIssueModal
          issue={escalatingIssue}
          sourceLevel={
            user.userRole === "supervisor"
              ? "Supervisor"
              : user.userRole === "zonal_head"
              ? "Zonal Head"
              : "Department Head"
          }
          targetLevel={
            user.userRole === "supervisor"
              ? "Zonal Head"
              : user.userRole === "zonal_head"
              ? "Department Head"
              : "COA Management"
          }
          onClose={() => setEscalatingIssue(null)}
          onConfirm={handleConfirmEscalate}
        />
      )}

      {/* MODAL 3: Resolve Issue Modal */}
      {resolvingIssue && (
        <ResolveIssueModal
          issue={resolvingIssue}
          resolverRole={user.role}
          onClose={() => setResolvingIssue(null)}
          onConfirm={handleConfirmResolve}
        />
      )}

      {/* MODAL 4: Modification History Modal */}
      {historyIssue && (
        <ModificationHistoryModal
          issue={historyIssue}
          onClose={() => setHistoryIssue(null)}
        />
      )}

      {/* MODAL 5: Original Worker Submission Peek Modal */}
      {originalPeekIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-emerald-300 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>ORIGINAL WORKER SUBMISSION (Permanent & Immutable)</span>
              </span>
              <button
                type="button"
                onClick={() => setOriginalPeekIssue(null)}
                className="text-[#777587] hover:text-[#191c1e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">Ticket No:</span>
                <span className="font-mono font-bold text-[#3525cd]">
                  {originalPeekIssue.ticketNo}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">Reported Title:</span>
                <p className="font-bold text-[#191c1e]">
                  {originalPeekIssue.originalRequest.title}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#777587] block">
                  Worker Field Observation:
                </span>
                <p className="p-2.5 bg-emerald-50 text-emerald-950 rounded-lg border border-emerald-200">
                  {originalPeekIssue.originalRequest.description}
                </p>
              </div>

              {/* Original Worker Defect Photos */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <ComplaintMediaGallery
                  media={originalPeekIssue.originalRequest.media}
                  ticketNo={originalPeekIssue.ticketNo}
                  station={originalPeekIssue.station}
                  title="Original Defect Field Photos Uploaded by Worker"
                  showOriginalTag={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-[#777587] block">Location:</span>
                  <span>
                    {originalPeekIssue.originalRequest.station} (
                    {originalPeekIssue.originalRequest.trackSection})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">KM Post / Line:</span>
                  <span>
                    {originalPeekIssue.originalRequest.nearestKmPost} •{" "}
                    {originalPeekIssue.originalRequest.lineType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Reported By:</span>
                  <span>{originalPeekIssue.originalRequest.reportedBy.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777587] block">Logged Date:</span>
                  <span>{originalPeekIssue.originalRequest.reportedAt}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#eceef0] flex justify-end">
              <button
                type="button"
                onClick={() => setOriginalPeekIssue(null)}
                className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Escalated Handover Details Modal */}
      {viewingHandoverIssue && (
        <EscalatedHandoverModal
          issue={viewingHandoverIssue}
          currentUser={user}
          onClose={() => setViewingHandoverIssue(null)}
        />
      )}
    </div>
  );
};
