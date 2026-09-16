import React, { useState } from "react";
import {
  ServiceRequestItem,
  DepartmentType,
  PriorityType,
  UserProfile,
  MaintenancePeriodType,
  MaintenanceSchedulePlan,
} from "../types";
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ArrowUpRight,
  Lock,
  ShieldCheck,
  Calendar,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { ZonalMaintenanceCalendarModal } from "./ZonalMaintenanceCalendarModal";

interface ServiceRequestScreenProps {
  requests: ServiceRequestItem[];
  onSubmitRequest: (req: Omit<ServiceRequestItem, "id" | "createdAt">) => void;
  onSendToScheduler: (req: ServiceRequestItem) => void;
  currentUser?: UserProfile;
}

export const ServiceRequestScreen: React.FC<ServiceRequestScreenProps> = ({
  requests,
  onSubmitRequest,
  onSendToScheduler,
  currentUser,
}) => {
  const isAuthorized =
    currentUser?.userRole === "zonal_head" ||
    currentUser?.userRole === "department_head" ||
    currentUser?.userRole === "department_user";
  const [taskName, setTaskName] = useState("Track Deep Screening & Ballast Packing");
  const [department, setDepartment] = useState<DepartmentType>("Engineering");
  const [trackArea, setTrackArea] = useState("Kurla - Thane");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityType>("High");
  const [timePeriodType, setTimePeriodType] = useState<MaintenancePeriodType>("weekly");
  const [preferredSlot, setPreferredSlot] = useState(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return `${tmr.toISOString().split('T')[0]} 01:30 - 04:30`;
  });
  const [customTimePeriod, setCustomTimePeriod] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MaintenanceSchedulePlan | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      return;
    }
    if (!description.trim() || !taskName.trim()) {
      return;
    }

    const submitterLabel =
      currentUser?.name ||
      (currentUser?.userRole === "department_head" || currentUser?.userRole === "department_user"
        ? "Principal Chief Engineer (Dept Head)"
        : "Chief Track Engineer (Zonal Head)");

    onSubmitRequest({
      taskName: taskName.trim(),
      department,
      trackArea,
      description: description.trim(),
      priority,
      preferredSlot,
      status: "Pending",
      timePeriodType,
      customTimePeriod: timePeriodType === "manual" ? customTimePeriod.trim() : undefined,
      submittedBy: submitterLabel,
    });

    setDescription("");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status.toUpperCase() === filterStatus;
  });

  const getPriorityBadge = (p: PriorityType) => {
    switch (p) {
      case "Emergency":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#ffdad6] text-[#ba1a1a]">Emergency</span>;
      case "High":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#ffdcc3] text-[#904d00]">High</span>;
      case "Medium":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#e2dfff] text-[#3525cd]">Medium</span>;
      case "Low":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#f2f4f6] text-[#464555]">Low</span>;
    }
  };

  const getPeriodBadge = (type?: MaintenancePeriodType, customText?: string) => {
    switch (type) {
      case "weekly":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f3e8ff] text-[#7c3aed] border border-[#7c3aed]/20">
            Weekly
          </span>
        );
      case "monthly":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#e0f2fe] text-[#0369a1] border border-[#0369a1]/20">
            Monthly
          </span>
        );
      case "manual":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#fef3c7] text-[#b45309] border border-[#b45309]/20">
            {customText || "Custom"}
          </span>
        );
      case "none":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f1f5f9] text-[#64748b]">
            Ad-hoc
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f1f5f9] text-[#64748b]">
            Standard
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
            <CheckCircle2 className="w-3 h-3" />
            Scheduled
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#15803d]">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef9c3] text-[#a16207]">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "Rejected":
      case "Declined":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f2f4f6] text-[#464555]">
            {s}
          </span>
        );
    }
  };

  return (
    <div id="service-request-screen" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#c7c4d8]/60 pb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#191c1e] tracking-tight flex items-center gap-2.5">
            <span className="p-1.5 rounded-md bg-[#e2dfff] text-[#3525cd]">
              <Wrench className="w-5 h-5" />
            </span>
            Service Request Entry
          </h1>
          <p className="text-[13px] text-[#777587] mt-0.5">
            Submit and monitor maintenance blocks across Central Line track segments (Mumbai Division).
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#c7c4d8] px-3.5 py-1.5 rounded-md text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777587] block">Active Log</span>
            <span className="text-[14px] font-mono font-bold text-[#3525cd]">{requests.length} Requests</span>
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <div className="p-3.5 bg-[#dcfce7] border border-[#86efac] text-[#166534] text-[13px] font-medium rounded-lg flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            <span>Service request submitted successfully. Queued into AI Conflict Engine.</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-[12px] font-bold uppercase hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form + Live Requests Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Request Form */}
        <div className="lg:col-span-5 bg-white border border-[#c7c4d8] rounded-lg shadow-xs overflow-hidden">
          <div className={`p-4 border-b flex items-center justify-between ${isAuthorized ? "bg-[#fafafa] border-[#c7c4d8]" : "bg-[#fff8f8] border-[#ffdad6]"}`}>
            <div>
              <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">Service Request Submission</h2>
              {isAuthorized ? (
                <span className="text-[11px] text-[#155724] font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#28a745]" />
                  Authorized: {currentUser?.userRole === "department_head" || currentUser?.userRole === "department_user" ? "Principal Chief Engineer (Dept Head)" : "Chief Track Engineer (Zonal Head)"}
                </span>
              ) : (
                <span className="text-[11px] text-[#ba1a1a] font-semibold flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  Restricted: Zonal Head or Department Head authorization required
                </span>
              )}
            </div>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${isAuthorized ? "text-[#3525cd] bg-[#e2dfff]" : "text-[#ba1a1a] bg-[#ffdad6]"}`}>
              {isAuthorized ? "FORM TR-01" : "READ-ONLY"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!isAuthorized && (
              <div className="p-3 bg-[#fff3cd] border border-[#ffeeba] text-[#856404] text-xs rounded-md flex items-start gap-2">
                <Lock className="w-4 h-4 text-[#856404] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Permission Restricted:</strong> Only <strong>Chief Track Engineer (Zonal Head)</strong> and <strong>Principal Chief Engineer (Dept Head)</strong> are authorized to submit new service requests through this portal. Personnel with other roles can review existing active requests in the registry on the right.
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                Task Name / Work Title
              </label>
              <input
                id="req-task-name-input"
                type="text"
                required
                disabled={!isAuthorized}
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder={isAuthorized ? "e.g. Track Deep Screening & Ballast Packing on UP Line" : "Submission restricted to Authorized Heads"}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] text-[#191c1e] font-semibold placeholder:text-[#777587] placeholder:font-normal focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Maintenance Time Period Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555]">
                Maintenance Time Period (Calendar Plan Scope)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  id="period-opt-weekly"
                  disabled={!isAuthorized}
                  onClick={() => setTimePeriodType("weekly")}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    timePeriodType === "weekly"
                      ? "bg-[#e2dfff] border-[#3525cd] text-[#3525cd] font-bold ring-1 ring-[#3525cd]"
                      : "bg-[#f8f9fa] border-[#c7c4d8]/70 text-[#464555] hover:bg-[#eceef0]"
                  }`}
                >
                  <div className="text-[11px] font-bold">Weekly</div>
                  <div className="text-[9px] text-[#777587]">7-day block plan</div>
                </button>
                <button
                  type="button"
                  id="period-opt-monthly"
                  disabled={!isAuthorized}
                  onClick={() => setTimePeriodType("monthly")}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    timePeriodType === "monthly"
                      ? "bg-[#e2dfff] border-[#3525cd] text-[#3525cd] font-bold ring-1 ring-[#3525cd]"
                      : "bg-[#f8f9fa] border-[#c7c4d8]/70 text-[#464555] hover:bg-[#eceef0]"
                  }`}
                >
                  <div className="text-[11px] font-bold">Monthly</div>
                  <div className="text-[9px] text-[#777587]">Full month plan</div>
                </button>
                <button
                  type="button"
                  id="period-opt-manual"
                  disabled={!isAuthorized}
                  onClick={() => setTimePeriodType("manual")}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    timePeriodType === "manual"
                      ? "bg-[#e2dfff] border-[#3525cd] text-[#3525cd] font-bold ring-1 ring-[#3525cd]"
                      : "bg-[#f8f9fa] border-[#c7c4d8]/70 text-[#464555] hover:bg-[#eceef0]"
                  }`}
                >
                  <div className="text-[11px] font-bold">Manual Entry</div>
                  <div className="text-[9px] text-[#777587]">Type custom days</div>
                </button>
                <button
                  type="button"
                  id="period-opt-none"
                  disabled={!isAuthorized}
                  onClick={() => setTimePeriodType("none")}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    timePeriodType === "none"
                      ? "bg-[#e2dfff] border-[#3525cd] text-[#3525cd] font-bold ring-1 ring-[#3525cd]"
                      : "bg-[#f8f9fa] border-[#c7c4d8]/70 text-[#464555] hover:bg-[#eceef0]"
                  }`}
                >
                  <div className="text-[11px] font-bold">None of Above</div>
                  <div className="text-[9px] text-[#777587]">One-time ad-hoc</div>
                </button>
              </div>

              {timePeriodType === "manual" && (
                <div className="pt-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    id="req-custom-period-input"
                    disabled={!isAuthorized}
                    required
                    value={customTimePeriod}
                    onChange={(e) => setCustomTimePeriod(e.target.value)}
                    placeholder="Specify manual time period (e.g., 10 Days, Fortnightly, 3 Weeks, Every Alternate Sunday)..."
                    className="w-full bg-white border border-[#3525cd] rounded-md py-1.5 px-3 text-[12px] font-medium text-[#191c1e] placeholder:text-[#777587] focus:outline-none focus:ring-1 focus:ring-[#3525cd]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                Department
              </label>
              <select
                id="req-dept-select"
                value={department}
                disabled={!isAuthorized}
                onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Engineering">Engineering (Civil / Permanent Way)</option>
                <option value="Traction">Traction (Overhead Electrical OHE / TRD)</option>
                <option value="S&T">S&T (Signals & Telecommunication)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                Track Area / Section (Central Line)
              </label>
              <select
                id="req-track-select"
                value={trackArea}
                disabled={!isAuthorized}
                onChange={(e) => setTrackArea(e.target.value)}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="CSMT - Dadar">CSMT - Dadar (KM 0.0 - 9.0)</option>
                <option value="Dadar - Kurla">Dadar - Kurla (KM 9.0 - 15.0)</option>
                <option value="Kurla - Thane">Kurla - Thane (KM 15.0 - 34.0)</option>
                <option value="Thane - Kalyan">Thane - Kalyan (KM 34.0 - 54.0)</option>
                <option value="Kalyan - Kasara">Kalyan - Kasara (KM 54.0 - 120.0)</option>
                <option value="Kalyan - Karjat">Kalyan - Karjat (KM 54.0 - 100.0)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                Work Description & Track Occupation Reason
              </label>
              <textarea
                id="req-desc-input"
                rows={3}
                required
                disabled={!isAuthorized}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isAuthorized ? "e.g. Deep screening, ballast packing on UP Through line, girder bolt inspection..." : "Submission restricted to Authorized Heads"}
                className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] text-[#191c1e] placeholder:text-[#777587] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                  Priority
                </label>
                <select
                  id="req-priority-select"
                  value={priority}
                  disabled={!isAuthorized}
                  onChange={(e) => setPriority(e.target.value as PriorityType)}
                  className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#464555] mb-1.5">
                  Preferred Slot Window
                </label>
                <input
                  id="req-slot-input"
                  type="text"
                  disabled={!isAuthorized}
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full bg-[#f2f4f6] border border-[#c7c4d8] rounded-md py-2 px-3 text-[13px] font-mono text-[#191c1e] focus:outline-none focus:border-[#3525cd] focus:bg-white focus:ring-1 focus:ring-[#3525cd] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              id="req-submit-button"
              type="submit"
              disabled={!isAuthorized}
              className={`w-full mt-2 py-2.5 px-4 text-white text-[13px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 shadow-xs ${
                isAuthorized
                  ? "bg-[#3525cd] hover:bg-[#4f46e5] active:scale-[0.98] cursor-pointer"
                  : "bg-[#777587] opacity-60 cursor-not-allowed"
              }`}
            >
              {isAuthorized ? (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Service Request</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Submission Restricted to Zonal & Dept Heads</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Requests Table */}
        <div className="lg:col-span-7 bg-white border border-[#c7c4d8] rounded-lg shadow-xs overflow-hidden flex flex-col">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-[#c7c4d8] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">My Recent Requests</h2>
              <span className="text-[11px] text-[#777587]">Central Line Division Traffic Register</span>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#777587]" />
              <div className="flex items-center gap-1 bg-[#eceef0] p-0.5 rounded-md border border-[#c7c4d8]/40">
                {["ALL", "PENDING", "SCHEDULED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    id={`filter-btn-${s.toLowerCase()}`}
                    onClick={() => setFilterStatus(s)}
                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                      filterStatus === s
                        ? "bg-white text-[#3525cd] shadow-xs"
                        : "text-[#777587] hover:text-[#191c1e]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Data Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f2f4f6] text-[#464555] uppercase text-[10px] font-bold tracking-wider border-b border-[#c7c4d8]">
                  <th className="py-2.5 px-3">Dept & Corridor</th>
                  <th className="py-2.5 px-3">Task Name & Description</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Schedule Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {filteredRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#191c1e] text-[11px] font-mono">{item.department}</div>
                      <div className="text-[#464555] text-[11px] font-medium whitespace-nowrap mt-0.5">{item.trackArea}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="font-bold text-[#191c1e] text-[12px] truncate" title={item.taskName || item.description}>
                        {item.taskName || "Track Possession Work"}
                      </div>
                      <div className="text-[11px] text-[#777587] truncate mt-0.5" title={item.description}>
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getPeriodBadge(item.timePeriodType, item.customTimePeriod)}
                    </td>
                    <td className="py-3 px-3">{getPriorityBadge(item.priority)}</td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {getStatusBadge(item.status)}
                        {item.maintenanceSchedule && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>COA Plan Active</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.maintenanceSchedule ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPlan(item.maintenanceSchedule!)}
                            title="View COA Calendar Plan"
                            className="px-2.5 py-1 bg-[#3525cd] hover:bg-[#4f46e5] text-white rounded-md text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Calendar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#a09eaf] italic">Awaiting COA</span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSendToScheduler(item)}
                          title="Inspect in प्रवाहPlan"
                          className="p-1 text-[#3525cd] hover:bg-[#e2dfff] rounded transition-colors inline-flex items-center gap-0.5 text-[11px] font-semibold cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#777587]">
                      No service requests match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#f8fafc] border-t border-[#c7c4d8] flex items-center justify-between text-[11px] font-mono text-[#777587]">
            <span>Showing {filteredRequests.length} of {requests.length} records</span>
            <span className="text-[#3525cd] font-semibold">Central Line Live Dispatch Register</span>
          </div>
        </div>
      </div>

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
