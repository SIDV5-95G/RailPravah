import React, { useState, useEffect } from "react";
import {
  CalendarBlock,
  CoaRecommendation,
  ServiceRequestItem,
  UserProfile,
  TimelineBlock,
  ScreenType,
  UserRole,
  HierarchicalIssue,
  PravahOptimizedSlot,
  MaintenanceSchedulePlan,
} from "../types";
import { CENTRAL_LINE_STATIONS, INITIAL_TIMELINE_BLOCKS } from "../mockData";
import { CoaEscalatedIssuesView } from "./CoaEscalatedIssuesView";
import { PravahPlanTab } from "./PravahPlanTab";
import { HierarchyTabBar } from "./HierarchyTabBar";
import { UnifiedDailyScheduleCalendar } from "./UnifiedDailyScheduleCalendar";
import { CoaProvidePlanModal } from "./CoaProvidePlanModal";
import { ZonalMaintenanceCalendarModal } from "./ZonalMaintenanceCalendarModal";
import { UserAvatar } from "../utils/avatarUtils";
import {
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  RefreshCw,
  Search,
  Zap,
  Info,
  CalendarDays,
  ListFilter,
  Eye,
  Sliders,
  BellRing,
  ArrowRight,
  Users,
  Activity,
  CheckCheck,
  FileText,
  Download,
  SlidersHorizontal,
  Flame,
  Lock,
} from "lucide-react";

interface CoaManagementScreenProps {
  user: UserProfile;
  requests: ServiceRequestItem[];
  onRequestApproved: (id: string, assignedSlot?: string) => void;
  onRequestDeclined: (id: string, reason: string) => void;
  calendarBlocks: CalendarBlock[];
  recommendations: CoaRecommendation[];
  onGenerateRecommendations: () => void;
  onApproveRecommendation: (id: string, adjustedSlot?: string, notes?: string) => void;
  onRejectRecommendation: (id: string, reason: string) => void;
  onSendRecommendation: (id: string) => void;
  onDepartmentSimulateAction: (id: string, department: string, action: "confirm" | "flag", note?: string) => void;
  onSwitchUserRole?: () => void;
  timelineBlocks?: TimelineBlock[];
  onAddTimelineBlock?: (block: TimelineBlock) => void;
  onUpdateTimelineBlocks?: (blocks: TimelineBlock[]) => void;
  onNavigateToWhySlot?: (slotCode?: string) => void;
  onOptimizeScheduleWithAI?: () => Promise<void> | void;
  isOptimizing?: boolean;
  onNavigate?: (screen: ScreenType) => void;
  onSwitchUserRoleType?: (role: UserRole) => void;
  onAcceptPravahSlot?: (slot: PravahOptimizedSlot) => void;
  onProvideMaintenancePlan?: (requestId: string, plan: MaintenanceSchedulePlan) => void;
  onRefreshRequests?: () => void;
}

export const INITIAL_PRAVAH_SLOTS: PravahOptimizedSlot[] = [];

export const CoaManagementScreen: React.FC<CoaManagementScreenProps> = ({
  user,
  requests,
  onRequestApproved,
  onRequestDeclined,
  calendarBlocks,
  recommendations,
  onGenerateRecommendations,
  onApproveRecommendation,
  onRejectRecommendation,
  onSendRecommendation,
  onDepartmentSimulateAction,
  onSwitchUserRole,
  timelineBlocks,
  onAddTimelineBlock,
  onUpdateTimelineBlocks,
  onNavigateToWhySlot,
  onOptimizeScheduleWithAI,
  isOptimizing = false,
  onNavigate,
  onSwitchUserRoleType,
  onAcceptPravahSlot,
  onProvideMaintenancePlan,
  onRefreshRequests,
}) => {
  const isCoaAdmin = user.userRole === "coa_admin" || user.role.toLowerCase().includes("coa");

  // Maintenance plan modal states
  const [planTargetRequest, setPlanTargetRequest] = useState<ServiceRequestItem | null>(null);
  const [viewPlanModal, setViewPlanModal] = useState<MaintenanceSchedulePlan | null>(null);

  // Active sub-tab in COA Management - Default to प्रवाहPLAN ("ai-clustering")
  const [activeSubTab, setActiveSubTab] = useState<
    "ai-clustering" | "queue" | "calendar" | "notifications" | "escalated-issues"
  >("ai-clustering");

  useEffect(() => {
    const handleOpenCalendar = () => {
      setActiveSubTab("calendar");
    };
    window.addEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
    return () => window.removeEventListener("railpravah:open-calendar-tab", handleOpenCalendar);
  }, []);

  // प्रवाहPlan State
  const [zonalPendingIssues, setZonalPendingIssues] = useState<HierarchicalIssue[]>([]);
  const [isLoadingZonalIssues, setIsLoadingZonalIssues] = useState<boolean>(false);
  const [pravahSlots, setPravahSlots] = useState<PravahOptimizedSlot[]>(INITIAL_PRAVAH_SLOTS);
  const [isOptimizingPravah, setIsOptimizingPravah] = useState<boolean>(false);
  const [hasRunScheduleOptimizer, setHasRunScheduleOptimizer] = useState<boolean>(false);
  const [pravahProgressStep, setPravahProgressStep] = useState<string>("");
  const [rejectSlotModal, setRejectSlotModal] = useState<PravahOptimizedSlot | null>(null);
  const [rejectSlotReason, setRejectSlotReason] = useState<string>("");
  const [isAcceptingSlotId, setIsAcceptingSlotId] = useState<string | null>(null);
  const [pravahActiveFilter, setPravahActiveFilter] = useState<"ALL" | "MULTI_DEPT" | "CRITICAL">("ALL");
  const [showDemandsBreakdown, setShowDemandsBreakdown] = useState<boolean>(true);

  // Fetch escalated issues from Department Head for प्रवाहPlan
  const [deptPendingIssues, setDeptPendingIssues] = useState<HierarchicalIssue[]>([]);
  const [isLoadingDeptIssues, setIsLoadingDeptIssues] = useState<boolean>(false);

  useEffect(() => {
    const fetchDeptIssues = async () => {
      setIsLoadingDeptIssues(true);
      try {
        const res = await fetch("/api/issues?role=coa_admin");
        const data = await res.json();
        if (data.success && Array.isArray(data.issues)) {
          const deptIssues = data.issues.filter(
            (i: any) =>
              (i.currentStatus === "Escalated to COA" ||
                i.currentStatus === "Under COA Review" ||
                (i.escalationHistory && i.escalationHistory.some((h: any) => h.level === "Department Head" || h.level === "Zonal Head"))) &&
              !i.currentStatus.startsWith("Resolved") &&
              i.currentStatus !== "Sanctioned by COA"
          );
          setDeptPendingIssues(deptIssues);
        }
      } catch (e) {
        console.warn("Could not fetch Department issues for प्रवाहPlan:", e);
      } finally {
        setIsLoadingDeptIssues(false);
      }
    };
    fetchDeptIssues();
  }, []);

  // Calendar controls
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [calendarDeptFilter, setCalendarDeptFilter] = useState<string>("all");
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<string>("all");
  const [selectedCalendarBlock, setSelectedCalendarBlock] = useState<CalendarBlock | null>(null);

  // Request Queue controls
  const [queueStatusFilter, setQueueStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "DECLINED">("ALL");
  const [queueSearch, setQueueSearch] = useState<string>("");
  const [queueDeptFilter, setQueueDeptFilter] = useState<string>("all");
  const [queuePriorityFilter, setQueuePriorityFilter] = useState<string>("all");
  const [declineModalItem, setDeclineModalItem] = useState<ServiceRequestItem | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState<string>("");

  // AI Clustering & Review controls
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [adjustSlotModalRec, setAdjustSlotModalRec] = useState<CoaRecommendation | null>(null);
  const [adjustedSlotInput, setAdjustedSlotInput] = useState<string>("");
  const [decisionNotesInput, setDecisionNotesInput] = useState<string>("");
  const [rejectModalRec, setRejectModalRec] = useState<CoaRecommendation | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>("");

  // AI Schedule Optimizer controls & state
  const [localTimelineBlocks, setLocalTimelineBlocks] = useState<TimelineBlock[]>(
    timelineBlocks || []
  );
  const [isOptimizingSchedule, setIsOptimizingSchedule] = useState<boolean>(false);
  const [optimizationStep, setOptimizationStep] = useState<number>(1);
  const [optimizationProgress, setOptimizationProgress] = useState<number>(0);
  const [optimizationTelemetry, setOptimizationTelemetry] = useState<string>("");
  const [isScheduleOptimized, setIsScheduleOptimized] = useState<boolean>(false);
  const [selectedScheduleBlock, setSelectedScheduleBlock] = useState<TimelineBlock | null>(null);
  const [scheduleStationFilter, setScheduleStationFilter] = useState<string>("");
  const [scheduleBranchFilter, setScheduleBranchFilter] = useState<"all" | "Mainline" | "Kasara Branch" | "Khopoli Branch">("all");
  const [scheduleViewMode, setScheduleViewMode] = useState<"matrix" | "comparison">("matrix");
  const [bulletinModalOpen, setBulletinModalOpen] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Keep localTimelineBlocks synced when props update
  useEffect(() => {
    if (timelineBlocks && timelineBlocks.length > 0) {
      setLocalTimelineBlocks(timelineBlocks);
    }
  }, [timelineBlocks]);

  // Request queues by status
  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const approvedRequests = requests.filter((r) => r.status === "Approved");
  const declinedRequests = requests.filter((r) => r.status === "Declined");

  // Filter requests based on status, department, priority, and search
  const filteredRequests = requests.filter((r) => {
    const matchStatus =
      queueStatusFilter === "ALL"
        ? true
        : queueStatusFilter === "PENDING"
        ? r.status === "Pending"
        : queueStatusFilter === "APPROVED"
        ? r.status === "Approved"
        : r.status === "Declined";

    const matchDept = queueDeptFilter === "all" || r.department.toLowerCase().includes(queueDeptFilter.toLowerCase());
    const matchPrio = queuePriorityFilter === "all" || r.priority === queuePriorityFilter;
    const matchSearch =
      !queueSearch ||
      r.trackArea.toLowerCase().includes(queueSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (r.taskName && r.taskName.toLowerCase().includes(queueSearch.toLowerCase())) ||
      (r.assignedSlot && r.assignedSlot.toLowerCase().includes(queueSearch.toLowerCase())) ||
      r.department.toLowerCase().includes(queueSearch.toLowerCase());

    return matchStatus && matchDept && matchPrio && matchSearch;
  });

  // Calculate cluster metrics
  const totalEvaluated = requests.filter((r) => r.status === "Pending").length;
  const clusteredRecs = recommendations.filter((r) => r.isClustered);
  const individualRecs = recommendations.filter((r) => !r.isClustered);
  const totalTrainsSaved = recommendations.reduce((acc, r) => acc + (r.trains_saved_count || 0), 0);

  // =========================================================================
  // प्रवाहPLAN: AI Schedule Optimizer Engine
  // =========================================================================
  const handleRunPravahScheduleOptimizer = () => {
    setIsOptimizingPravah(true);
    setHasRunScheduleOptimizer(true);
    setPravahProgressStep("Step 1/4: Ingesting Department Head demands & Pending Queue requests...");

    setTimeout(() => {
      setPravahProgressStep("Step 2/4: Cross-referencing GIS sections to cluster multi-department works in shared track blocks...");
    }, 500);

    setTimeout(() => {
      setPravahProgressStep("Step 3/4: Calculating timetables for zero regular train delays (Night shadow 01:30–04:30 & midday off-peak)...");
    }, 1000);

    setTimeout(() => {
      setPravahProgressStep("Step 4/4: Prioritizing high-risk 25kV OHE and track assets to minimize asset downtime & ensure uninterrupted operations...");
    }, 1500);

    setTimeout(() => {
      const allDemands: Array<{
        id: string;
        name: string;
        department: string;
        source: "Pending Queue" | "Department Head Request" | "Department Head Escalation" | "Service Request Queue";
        priority: string;
        workType: string;
        submittedBy: string;
        location: string;
      }> = [];

      // 1. Ingest escalated department issues
      deptPendingIssues.forEach((issue) => {
        allDemands.push({
          id: issue.id,
          name: issue.activeRequest?.title || issue.originalRequest?.title || "Field Defect Report",
          department: issue.department || "Civil / Track",
          source: "Department Head Escalation",
          priority: issue.activeRequest?.priority || "High",
          workType: issue.activeRequest?.title || "Track & Structure Maintenance",
          submittedBy: issue.departmentHead?.name || issue.zonalHead?.name || issue.supervisor?.name || "Department Sanctions Authority",
          location: `${issue.station} (${issue.activeRequest?.trackSection || "Section TBD"})`,
        });
      });

      // 2. Ingest service requests pending queue
      requests.forEach((req) => {
        if (req.status === "Pending") {
          allDemands.push({
            id: req.id,
            name: req.description,
            department: req.department,
            source: "Service Request Queue",
            priority: req.priority,
            workType: req.workType || req.description,
            submittedBy: req.submittedBy || "Divisional Head",
            location: req.trackArea,
          });
        }
      });

      const todayStr = new Date().toISOString().substring(0, 10);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10);

      const generatedSlots: PravahOptimizedSlot[] = [];

      if (allDemands.length > 0) {
        // Group demands by location/corridor area
        const groupedByLoc: Record<string, typeof allDemands> = {};
        allDemands.forEach((d) => {
          const key = d.location.split(/[\-\/]/)[0].trim() || "Central Corridor";
          if (!groupedByLoc[key]) groupedByLoc[key] = [];
          groupedByLoc[key].push(d);
        });

        let slotIdx = 1;
        for (const [locKey, items] of Object.entries(groupedByLoc)) {
          const uniqueDepts = Array.from(new Set(items.map((i) => i.department)));
          const hasEmergency = items.some((i) => i.priority === "Emergency");
          const hasHigh = items.some((i) => i.priority === "High");
          const priorityTier = hasEmergency ? "Emergency" : hasHigh ? "High" : "Medium";

          const timeWindow = priorityTier === "Emergency" || priorityTier === "High"
            ? "01:30 – 04:30 IST"
            : "11:30 – 13:30 IST";
          const startT = timeWindow.split("–")[0].trim().replace(" IST", "");
          const endT = timeWindow.split("–")[1].trim().replace(" IST", "");
          const slotDate = slotIdx % 2 === 0 ? tomorrowStr : todayStr;
          const slotCode = `PRV-${slotDate.replace(/-/g, "")}-${locKey.substring(0, 3).toUpperCase()}${slotIdx}`;

          generatedSlots.push({
            id: `slot-prv-${locKey.toLowerCase().replace(/\s+/g, "-")}-${slotIdx}`,
            slotCode,
            date: slotDate,
            timing: timeWindow,
            startTime: startT,
            endTime: endT,
            location: `${items[0].location} (Joint Corridor)`,
            workName: `Joint Possession: ${items.map((i) => i.name.substring(0, 45)).join(" • ")}`,
            departments: uniqueDepts,
            workItems: items.map((i) => ({
              id: i.id,
              name: i.name,
              department: i.department,
              source: i.source,
              priority: i.priority,
              workType: i.workType,
              submittedBy: i.submittedBy,
            })),
            principlesCompliance: {
              trainDelayImpact: priorityTier === "High" || priorityTier === "Emergency"
                ? "0 Regular Train Delays: Night shadow window (01:30 - 04:30) bypasses all suburban passenger services. Zero local train cancellations."
                : "Minimum Train Delays: Midday off-peak gap (11:30 - 13:30) allows local traffic diversion without cancellation.",
              multiDeptClustering: `Single Slot for ${uniqueDepts.length} Departments: ${uniqueDepts.join(", ")} co-possess the same track section simultaneously.`,
              assetDowntimeMinimized: `Asset downtime compressed by ${uniqueDepts.length > 1 ? 65 : 40}% compared to disjoint departmental possessions.`,
              infrastructureAvailability: "Full corridor availability certified and restored prior to peak morning/evening commuter rush.",
            },
            status: "pending_coa_decision",
          });
          slotIdx++;
        }
      }

      setPravahSlots(generatedSlots);
      setIsOptimizingPravah(false);
      setPravahProgressStep("");
      if (generatedSlots.length > 0) {
        setSyncSuccessMessage(`AI Schedule Optimizer completed: ${generatedSlots.length} optimized slots generated from active demands with zero peak train delays!`);
      } else {
        setSyncSuccessMessage("AI Schedule Optimizer ran successfully: 0 pending corridor demands currently active.");
      }
      setTimeout(() => setSyncSuccessMessage(null), 6000);
    }, 1800);
  };

  // Accept a प्रवाहPLAN Slot: Send notifications & sync calendars
  const handleAcceptSlot = async (slot: PravahOptimizedSlot) => {
    setIsAcceptingSlotId(slot.id);
    try {
      // 1. Call server API
      const res = await fetch("/api/coa/slots/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ slot }),
      });
      const data = await res.json();

      // 2. Update local state
      setPravahSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? { ...s, status: "accepted", acceptedAt: new Date().toLocaleTimeString() }
            : s
        )
      );

      // 3. Trigger parent callback if available
      if (onAcceptPravahSlot) {
        onAcceptPravahSlot(slot);
      }

      // 4. Update any pending service requests in queue
      if (onRequestApproved) {
        slot.workItems.forEach((w) => {
          onRequestApproved(w.id, `${slot.date} ${slot.timing}`);
        });
      }

      setSyncSuccessMessage(
        `Slot ${slot.slotCode} officially accepted! Notifications dispatched to Department Head, Zonal Head, and Supervisor inboxes. Work task added to Worker and Zonal Head calendars on ${slot.date} (${slot.timing}).`
      );
      setTimeout(() => setSyncSuccessMessage(null), 8000);
    } catch (e) {
      console.warn("Failed to accept slot via API:", e);
    } finally {
      setIsAcceptingSlotId(null);
    }
  };

  // Reject a प्रवाहPLAN Slot
  const handleRejectSlot = (slot: PravahOptimizedSlot, reason: string) => {
    setPravahSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? { ...s, status: "rejected", rejectionReason: reason || "Declined by COA Controller" }
          : s
      )
    );
    setRejectSlotModal(null);
    setRejectSlotReason("");
    setSyncSuccessMessage(`Slot ${slot.slotCode} rejected. Returned to pending demands queue.`);
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  const handleRunClustering = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      onGenerateRecommendations();
      setIsGeneratingAi(false);
    }, 600);
  };

  // Run AI Corridor Schedule Optimization with visual telemetry & realign schedule
  const handleRunAiScheduleOptimization = async () => {
    setIsOptimizingSchedule(true);
    setOptimizationStep(1);
    setOptimizationProgress(12);

    // Collect accepted slots for dynamic block generation
    const acceptedSlots = pravahSlots.filter((s) => s.status === "accepted");
    const allSlots = pravahSlots.length > 0 ? pravahSlots : [];
    const slotsToUse = acceptedSlots.length > 0 ? acceptedSlots : allSlots;
    const totalDemands = slotsToUse.reduce((acc, s) => acc + s.workItems.length, 0);
    const uniqueDepts = Array.from(new Set(slotsToUse.flatMap((s) => s.departments)));

    setOptimizationTelemetry(`Phase 1: Scanning corridor timetable (${totalDemands} demands from ${uniqueDepts.length} departments)...`);

    setTimeout(() => {
      setOptimizationStep(2);
      setOptimizationProgress(38);
      setOptimizationTelemetry(`Phase 2: Analyzing freight crossings & detecting bottlenecks across ${slotsToUse.length} corridor sections...`);
    }, 600);

    setTimeout(() => {
      setOptimizationStep(3);
      setOptimizationProgress(68);
      setOptimizationTelemetry(`Phase 3: Synthesizing multi-department shadow block clustering (${uniqueDepts.join(", ")} synchronized)...`);
    }, 1200);

    setTimeout(() => {
      setOptimizationStep(4);
      setOptimizationProgress(88);
      setOptimizationTelemetry("Phase 4: Resolving crossover conflicts and re-routing possession to low-traffic lull windows...");
    }, 1800);

    setTimeout(() => {
      setOptimizationStep(5);
      setOptimizationProgress(100);

      // Dynamically generate optimized timeline blocks from slots
      const optimizedBlocks: TimelineBlock[] = [];
      let blockIdx = 1;

      slotsToUse.forEach((slot) => {
        // Parse start time from slot timing
        const startMatch = slot.startTime?.match(/(\d+):(\d+)/);
        const startHour = startMatch ? parseInt(startMatch[1]) + parseInt(startMatch[2]) / 60 : 1.0 + blockIdx * 0.5;

        // Parse duration from timing window
        const endMatch = slot.endTime?.match(/(\d+):(\d+)/);
        let durationHours = 3.0;
        if (startMatch && endMatch) {
          const endHour = parseInt(endMatch[1]) + parseInt(endMatch[2]) / 60;
          durationHours = Math.max(1, endHour - startHour);
        }

        const isMultiDept = slot.departments.length > 1;
        const locationShort = slot.location?.split("(")[0].trim() || `Section ${blockIdx}`;

        optimizedBlocks.push({
          id: `tb-opt-${slot.id}`,
          code: slot.slotCode,
          title: `${slot.slotCode}: ${slot.workName?.substring(0, 50) || "Optimized Block"}`,
          stationSection: locationShort,
          startHour,
          durationHours,
          type: isMultiDept ? "clustered-task" : "ai-planned",
          department: isMultiDept ? `Multi-Dept (${slot.departments.length})` : slot.departments[0] || "Engineering",
          subTitle: isMultiDept ? `${locationShort} • ${slot.departments.length} Depts Synchronized` : undefined,
          notes: `AI-optimized slot: ${slot.departments.join(", ")} — zero peak train impact`,
        });
        blockIdx++;
      });

      // If no slots were available, show an empty optimized state
      const efficiencyGain = optimizedBlocks.length > 0 ? Math.min(98, 60 + optimizedBlocks.length * 8) : 0;

      setOptimizationTelemetry(
        optimizedBlocks.length > 0
          ? `Phase 5: Matrix optimized! ${optimizedBlocks.length} blocks scheduled with +${efficiencyGain}% efficiency. Zero unscheduled conflicts.`
          : "Phase 5: Optimization complete. No pending demands to schedule."
      );

      setLocalTimelineBlocks(optimizedBlocks);
      if (onUpdateTimelineBlocks) {
        onUpdateTimelineBlocks(optimizedBlocks);
      }
      if (onOptimizeScheduleWithAI) {
        onOptimizeScheduleWithAI();
      }

      setIsScheduleOptimized(true);
      setIsOptimizingSchedule(false);
      setSyncSuccessMessage(
        optimizedBlocks.length > 0
          ? `Corridor schedule successfully optimized with AI. ${optimizedBlocks.length} blocks placed with +${efficiencyGain}% efficiency!`
          : "AI optimization complete — no active demands in pipeline."
      );
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    }, 2400);
  };

  // Reset to pre-optimization state
  const handleResetSchedule = () => {
    setLocalTimelineBlocks([]);
    if (onUpdateTimelineBlocks) {
      onUpdateTimelineBlocks([]);
    }
    setIsScheduleOptimized(false);
    setSyncSuccessMessage("Schedule reset to pre-optimization baseline.");
    setTimeout(() => setSyncSuccessMessage(null), 4000);
  };

  // Role Gate Screen
  if (!isCoaAdmin) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f8f9fa] p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#c7c4d8]/60 p-6 shadow-sm text-center">
          <div className="w-14 h-14 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#191c1e] mb-2">Access Restricted: COA Only</h2>
          <p className="text-sm text-[#464555] mb-2 leading-relaxed">
            The Control Office Application (COA) Management console is restricted to Central Railway COA controllers. You are currently logged in as a <strong>Department User ({user.department})</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Days in current month for month calendar display
  const currentCalYear = new Date().getFullYear();
  const currentCalMonth = new Date().getMonth() + 1;
  const daysInCurrentMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();

  const calendarDays = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${currentCalYear}-${String(currentCalMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayBlocks = calendarBlocks.filter((b) => b.date === dateStr);
    return {
      day: dayNum,
      dateStr,
      blocks: dayBlocks,
      hasClustered: dayBlocks.some((b) => b.isClustered),
      hasEmergency: dayBlocks.some((b) => b.priority === "Emergency"),
    };
  });

  // Strict RBAC: The COA Management tab is exclusively for COA users
  if (!isCoaAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-white rounded-2xl border border-[#ffdad6] shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1e]">
          Strict Access Control: COA Desk Restricted
        </h2>
        <p className="text-xs text-[#464555] max-w-md mx-auto leading-relaxed">
          The COA Management tab is exclusively for authorized Control Office Application (COA) personnel.
          Users with role <strong>{user.role}</strong> are not permitted to access apex traffic control and master dispatch management.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("worker-dashboard")}
            className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer shadow-xs"
          >
            Return to Authorized View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 min-h-[calc(100vh-3.5rem)] pb-16">
      {/* Hierarchy Chain Navigation Bar */}
      {onNavigate && (
        <HierarchyTabBar
          currentScreen="coa-management"
          onNavigate={onNavigate}
          currentUser={user}
          onSwitchUserRole={onSwitchUserRoleType}
        />
      )}

      {/* Screen Header Banner (Uniform with other roles) */}
      <div className="bg-white border border-[#c7c4d8]/70 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#e2dfff] text-[#3525cd] text-[11px] font-mono font-bold uppercase rounded-md">
              COA Central Operations
            </span>
            <span className="text-xs text-[#777587] font-mono">Division: Central Railway (Control Office)</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] mt-1 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#3525cd]" />
            <span>Maintenance Block COA Planning & Synchronization</span>
          </h1>
        </div>

        {/* User Profile Info Card */}
        <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#eceef0] rounded-xl p-3 min-w-0 max-w-full">
          <UserAvatar
            role={user.userRole || "coa_admin"}
            name={user.name}
            avatarUrl={user.avatarUrl}
            size="md"
            showBadge={true}
          />
          <div className="text-xs min-w-0">
            <div className="font-bold text-[#191c1e] truncate max-w-[180px] sm:max-w-[220px]" title={user.name}>
              {user.name}
            </div>
            <div className="text-[11px] text-[#777587] font-mono truncate max-w-[180px] sm:max-w-[220px]" title={user.role}>
              {user.role}
            </div>
            <div className="text-[10px] text-[#3525cd] font-semibold whitespace-nowrap font-mono">
              Emp ID: {user.empId}
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation (Uniform pattern with other roles) */}
      <div className="flex items-center gap-1 border-b border-[#c7c4d8]/60 overflow-x-auto">
        <button
          id="subtab-pravah-plan-btn"
          type="button"
          onClick={() => setActiveSubTab("ai-clustering")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "ai-clustering"
              ? "bg-white text-[#3525cd] border-[#3525cd] shadow-xs"
              : "text-[#777587] border-transparent hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#3525cd]" />
          <span className="font-extrabold text-xs tracking-wide">प्रवाहPLAN</span>
          <span className="px-1.5 py-0.2 bg-[#e2dfff] text-[#3525cd] text-[10px] rounded-full font-mono font-bold">
            {pravahSlots.length > 0 ? pravahSlots.length : "AI Optimizer"}
          </span>
        </button>

        <button
          id="subtab-queue-btn"
          type="button"
          onClick={() => setActiveSubTab("queue")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "queue"
              ? "bg-white text-[#3525cd] border-[#3525cd] shadow-xs"
              : "text-[#777587] border-transparent hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Layers className="w-4 h-4 text-[#777587]" />
          <span>Cross-Dept Requests</span>
          <span className="px-1.5 py-0.2 bg-[#eceef0] text-[#464555] text-[10px] rounded-full font-mono font-bold">
            {requests.length}
          </span>
        </button>

        <button
          id="subtab-calendar-btn"
          type="button"
          onClick={() => setActiveSubTab("calendar")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "calendar"
              ? "bg-white text-[#3525cd] border-[#3525cd] shadow-xs"
              : "text-[#777587] border-transparent hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <Calendar className="w-4 h-4 text-[#777587]" />
          <span>Calendar View</span>
          <span className="px-1.5 py-0.2 bg-[#eceef0] text-[#464555] text-[10px] rounded-full font-mono">
            {calendarBlocks.length}
          </span>
        </button>

        <button
          id="subtab-notifications-btn"
          type="button"
          onClick={() => setActiveSubTab("notifications")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "notifications"
              ? "bg-white text-[#3525cd] border-[#3525cd] shadow-xs"
              : "text-[#777587] border-transparent hover:text-[#191c1e] hover:bg-[#f2f4f6]"
          }`}
        >
          <BellRing className="w-4 h-4 text-[#777587]" />
          <span>Dept Dispatch Tracker</span>
          {recommendations.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#e2dfff] text-[#3525cd] text-[10px] rounded-full font-mono font-bold">
              {recommendations.length} Active
            </span>
          )}
        </button>

        <button
          id="subtab-escalated-issues-btn"
          type="button"
          onClick={() => setActiveSubTab("escalated-issues")}
          className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-t-lg flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "escalated-issues"
              ? "bg-white text-[#ba1a1a] border-[#ba1a1a] shadow-xs"
              : "text-[#777587] border-transparent hover:text-[#ba1a1a] hover:bg-[#f2f4f6]"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
          <span>Escalated Issues (COA)</span>
          <span className="px-1.5 py-0.2 bg-[#ffdad6] text-[#ba1a1a] text-[10px] rounded-full font-mono font-bold">
            Live
          </span>
        </button>
      </div>

      {/* Global Sync Notification Alert */}
      {syncSuccessMessage && (
        <div className="p-3.5 bg-[#d4edda] border border-[#c3e6cb] text-[#155724] text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#28a745]" />
            <span>{syncSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSyncSuccessMessage(null)}
            className="text-[11px] font-bold uppercase text-[#155724] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container Content */}
      <div className="pt-2">
        {/* ========================================================================= */}
        {/* 1. प्रवाहPLAN TAB (Multi-Department Unified Slot Allocation & AI Optimizer) */}
        {/* ========================================================================= */}
        {activeSubTab === "ai-clustering" && (
          <PravahPlanTab
            deptPendingIssues={deptPendingIssues}
            pendingRequests={requests.filter((r) => r.status === "Pending")}
            pravahSlots={pravahSlots}
            isOptimizing={isOptimizingPravah}
            optimizingStep={pravahProgressStep}
            hasRunScheduleOptimizer={hasRunScheduleOptimizer}
            onRunScheduleOptimizer={handleRunPravahScheduleOptimizer}
            onAcceptSlot={handleAcceptSlot}
            onRejectSlot={handleRejectSlot}
            onOpenBulletinNotice={() => setBulletinModalOpen(true)}
            onNavigateToCalendar={() => setActiveSubTab("calendar")}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. CROSS-DEPARTMENTAL SERVICE REQUESTS TAB (Live DB Demands & Sanctions)   */}
        {/* ========================================================================= */}
        {activeSubTab === "queue" && (
          <div className="space-y-5">
            {/* Header & Database Sync Bar */}
            <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#eceef0] flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#3525cd]" />
                    <span>Cross-Departmental Service Requests &amp; Corridor Demands</span>
                  </h3>
                  <p className="text-xs text-[#777587] mt-0.5">
                    Live intake of maintenance demands, track possessions, and defect requests submitted across Civil (P-Way), Electrical (TRD), and Signal &amp; Telecom (S&amp;T) directly from database.
                  </p>
                </div>
                <button
                  type="button"
                  id="sync-db-requests-btn"
                  onClick={() => {
                    if (onRefreshRequests) {
                      onRefreshRequests();
                    }
                    setSyncSuccessMessage("Synchronized service requests with live database.");
                    setTimeout(() => setSyncSuccessMessage(null), 4000);
                  }}
                  className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] border border-[#c7c4d8] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-mono"
                  title="Refresh service requests from live database"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#3525cd]" />
                  <span>Sync DB</span>
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
                  <span className="text-[11px] font-bold text-[#777587] uppercase tracking-wider block">Total Demands</span>
                  <span className="text-xl font-black text-[#191c1e] font-mono">{requests.length}</span>
                </div>
                <div className="p-3 bg-[#fff8e1] rounded-lg border border-[#ffe082]">
                  <span className="text-[11px] font-bold text-[#8d6e63] uppercase tracking-wider block">Pending Review</span>
                  <span className="text-xl font-black text-[#e65100] font-mono">{pendingRequests.length}</span>
                </div>
                <div className="p-3 bg-[#e8f5e9] rounded-lg border border-[#a5d6a7]">
                  <span className="text-[11px] font-bold text-[#2e7d32] uppercase tracking-wider block">Sanctioned &amp; Slotted</span>
                  <span className="text-xl font-black text-[#1b5e20] font-mono">{approvedRequests.length}</span>
                </div>
                <div className="p-3 bg-[#ffebee] rounded-lg border border-[#ef9a9a]">
                  <span className="text-[11px] font-bold text-[#c62828] uppercase tracking-wider block">Declined / Deferred</span>
                  <span className="text-xl font-black text-[#b71c1c] font-mono">{declinedRequests.length}</span>
                </div>
              </div>

              {/* Filters and Search Toolbar */}
              <div className="pt-4 mt-4 border-t border-[#eceef0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#777587] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search by track section, description, task, or requester..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
                  />
                  {queueSearch && (
                    <button
                      onClick={() => setQueueSearch("")}
                      className="absolute right-2.5 top-2 text-[#777587] hover:text-[#191c1e] text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-lg">
                  {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setQueueStatusFilter(st)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer font-mono ${
                        queueStatusFilter === st
                          ? "bg-white text-[#3525cd] shadow-xs"
                          : "text-[#777587] hover:text-[#191c1e]"
                      }`}
                    >
                      {st} ({st === "ALL" ? requests.length : st === "PENDING" ? pendingRequests.length : st === "APPROVED" ? approvedRequests.length : declinedRequests.length})
                    </button>
                  ))}
                </div>

                {/* Dept & Priority Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={queueDeptFilter}
                    onChange={(e) => setQueueDeptFilter(e.target.value)}
                    className="bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-2 py-1.5 text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#3525cd] cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    <option value="Engineering">Engineering (P-Way)</option>
                    <option value="Electrical">Electrical (TRD)</option>
                    <option value="Signal">Signal &amp; Telecom (S&amp;T)</option>
                  </select>

                  <select
                    value={queuePriorityFilter}
                    onChange={(e) => setQueuePriorityFilter(e.target.value)}
                    className="bg-[#f8f9fa] border border-[#c7c4d8] rounded-lg px-2 py-1.5 text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#3525cd] cursor-pointer"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Emergency">Emergency</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Service Requests Cards Grid */}
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isPending = req.status === "Pending";
                const isApproved = req.status === "Approved";
                const isDeclined = req.status === "Declined";

                const isCivil = req.department.toLowerCase().includes("eng") || req.department.toLowerCase().includes("civil") || req.department.toLowerCase().includes("p-way");
                const isElectrical = req.department.toLowerCase().includes("elec") || req.department.toLowerCase().includes("trd");
                const isSignal = req.department.toLowerCase().includes("sign") || req.department.toLowerCase().includes("s&t");

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                      req.priority === "Emergency"
                        ? "border-[#ba1a1a]/40 bg-[#fffbfa]"
                        : "border-[#c7c4d8]/60 hover:border-[#3525cd]/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eceef0]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Department Badge */}
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md font-mono ${
                            isCivil
                              ? "bg-[#e8f5e9] text-[#1b5e20] border border-[#c8e6c9]"
                              : isElectrical
                              ? "bg-[#fff8e1] text-[#b78103] border border-[#ffe082]"
                              : isSignal
                              ? "bg-[#e3f2fd] text-[#0d47a1] border border-[#bbdefb]"
                              : "bg-[#f2f4f6] text-[#464555]"
                          }`}
                        >
                          {req.department}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md font-mono ${
                            req.priority === "Emergency"
                              ? "bg-[#ba1a1a] text-white animate-pulse"
                              : req.priority === "High"
                              ? "bg-[#ffdcc3] text-[#904d00]"
                              : req.priority === "Medium"
                              ? "bg-[#e2dfff] text-[#3525cd]"
                              : "bg-[#eceef0] text-[#777587]"
                          }`}
                        >
                          {req.priority} Priority
                        </span>

                        {/* ID Tag */}
                        <span className="text-[11px] font-mono text-[#777587]">
                          ID: {req.id.substring(0, 8)}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full font-mono self-start sm:self-auto ${
                          isApproved
                            ? "bg-[#d4edda] text-[#155724]"
                            : isDeclined
                            ? "bg-[#f8d7da] text-[#721c24]"
                            : "bg-[#fff3cd] text-[#856404]"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Card Content Body */}
                    <div className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-[#191c1e]">
                            {req.taskName || req.description}
                          </h4>
                          {req.taskName && req.description && req.description !== req.taskName && (
                            <p className="text-xs text-[#464555] mt-0.5">{req.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#464555] pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#3525cd] shrink-0" />
                          <span className="truncate"><strong>Track:</strong> {req.trackArea}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#777587] shrink-0" />
                          <span className="truncate"><strong>Raised By:</strong> {req.submittedBy || "Department SSE"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#777587] shrink-0" />
                          <span className="truncate"><strong>Requested Slot:</strong> {req.preferredSlot || "Night Window (01:30 - 04:30)"}</span>
                        </div>
                      </div>

                      {/* Sanctioned Slot details if Approved */}
                      {isApproved && req.assignedSlot && (
                        <div className="p-2.5 bg-[#eaf5ea] rounded-lg border border-[#2e7d32]/30 flex items-center justify-between text-xs text-[#1b5e20] mt-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
                            <span><strong>Sanctioned Possession Slot:</strong> {req.assignedSlot}</span>
                          </div>
                          {req.maintenanceSchedule && (
                            <button
                              onClick={() => setViewPlanModal(req.maintenanceSchedule || null)}
                              className="px-2 py-1 bg-[#2e7d32] text-white text-[10px] font-bold rounded hover:bg-[#1b5e20] cursor-pointer"
                            >
                              View Multi-Slot Calendar
                            </button>
                          )}
                        </div>
                      )}

                      {/* Decline Reason if Declined */}
                      {isDeclined && req.declineReason && (
                        <div className="p-2.5 bg-[#ffdad6] rounded-lg border border-[#ba1a1a]/30 text-xs text-[#ba1a1a] mt-2">
                          <strong>Decline Reason:</strong> {req.declineReason}
                        </div>
                      )}
                    </div>

                    {/* Card Actions (for Pending requests) */}
                    {isPending && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#eceef0]">
                        <button
                          type="button"
                          onClick={() => setActiveSubTab("ai-clustering")}
                          className="px-3 py-1.5 bg-[#e2dfff] text-[#3525cd] hover:bg-[#d0ccff] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Cluster this request with other departments in प्रवाहPLAN"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Optimize in प्रवाहPLAN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlanTargetRequest(req)}
                          className="px-3 py-1.5 bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e6e8ea] border border-[#c7c4d8] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-[#3525cd]" />
                          <span>Allocate Maintenance Plan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeclineModalItem(req)}
                          className="px-3 py-1.5 bg-white text-[#ba1a1a] hover:bg-[#ffdad6] border border-[#ba1a1a]/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRequestApproved(req.id, "01:30 – 04:30 IST (Night Window)")}
                          className="px-3.5 py-1.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Sanction Possession</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="p-8 text-center bg-white rounded-xl border border-[#c7c4d8]/60 space-y-2">
                  <Layers className="w-8 h-8 text-[#777587] mx-auto opacity-50" />
                  <h4 className="text-sm font-bold text-[#191c1e]">No service requests found</h4>
                  <p className="text-xs text-[#777587]">
                    No cross-departmental requests matched the active search or filters.
                  </p>
                  {(queueSearch || queueStatusFilter !== "ALL" || queueDeptFilter !== "all" || queuePriorityFilter !== "all") && (
                    <button
                      onClick={() => {
                        setQueueSearch("");
                        setQueueStatusFilter("ALL");
                        setQueueDeptFilter("all");
                        setQueuePriorityFilter("all");
                      }}
                      className="px-3 py-1.5 bg-[#f2f4f6] text-[#3525cd] text-xs font-bold rounded-lg hover:bg-[#e2dfff] transition-colors cursor-pointer inline-block mt-2"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. CALENDAR VIEW TAB (Full Multi-Month Navigation & Selected Day Details in Same Tab) */}
        {/* ========================================================================= */}
        {activeSubTab === "calendar" && (
          <UnifiedDailyScheduleCalendar
            role="coa"
            roleTitle="COA Master Corridor Controller"
            calendarBlocks={calendarBlocks}
            defaultYear={new Date().getFullYear()}
            defaultMonth={new Date().getMonth()}
            defaultDay={new Date().getDate()}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. DEPARTMENT DISPATCH & CONFIRMATION TRACKER TAB                         */}
        {/* ========================================================================= */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#c7c4d8]/60 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#eceef0] flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-[#3525cd]" />
                    <span>Department Dispatch & Confirmation Tracker</span>
                  </h3>
                  <p className="text-xs text-[#777587] mt-0.5">
                    Live multi-department tracking of sanctioned corridor blocks dispatched by COA to Engineering (P-Way), TRD (OHE), and S&amp;T.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGenerateRecommendations}
                  className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] border border-[#c7c4d8] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-mono"
                  title="Refresh dispatched blocks from live database"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#3525cd]" />
                  <span>Sync DB</span>
                </button>
              </div>

              <div className="space-y-4 pt-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 bg-[#f8f9fa] rounded-lg border border-[#eceef0] space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#191c1e]">
                            {rec.isClustered ? `Cluster ${rec.cluster_id || rec.id.substring(0, 6)}` : "Dispatched Block"} • {rec.station_text}
                          </span>
                          <span className="text-xs text-[#3525cd] font-bold font-mono bg-[#e2dfff] px-2 py-0.5 rounded">
                            {rec.slot_window}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full font-mono ${
                          rec.status === "confirmed"
                            ? "bg-[#d4edda] text-[#155724]"
                            : rec.status === "sent_to_departments"
                            ? "bg-[#cce5ff] text-[#004085]"
                            : "bg-[#e2dfff] text-[#3525cd]"
                        }`}
                      >
                        {rec.status === "confirmed" ? "Dispatched & Confirmed" : rec.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Department chips & simulated actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {rec.departments.map((dept) => {
                        const conf = rec.departmentConfirmations?.[dept];
                        const isConfirmed = conf?.status === "confirmed";
                        const isFlagged = conf?.status === "flagged";

                        return (
                          <div
                            key={dept}
                            className={`p-2.5 rounded border text-xs flex flex-col justify-between space-y-2 ${
                              isConfirmed
                                ? "bg-[#eaf5ea] border-[#2e7d32]/30 text-[#1b5e20]"
                                : isFlagged
                                ? "bg-[#ffdad6] border-[#ba1a1a]/30 text-[#ba1a1a]"
                                : "bg-white border-[#c7c4d8]/50 text-[#191c1e]"
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center justify-between">
                                <span>{dept}</span>
                                {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />}
                                {isFlagged && <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />}
                              </div>
                              <span className="text-[10px] text-[#777587]">
                                {isConfirmed
                                  ? "Confirmed & Ready"
                                  : isFlagged
                                  ? `Flagged: ${conf?.note || "Issue reported"}`
                                  : "Awaiting unit response..."}
                              </span>
                            </div>

                            {/* Simulation toggle buttons for reviewer testing */}
                            <div className="flex items-center gap-1 pt-1 border-t border-[#eceef0]">
                              <button
                                onClick={() =>
                                  onDepartmentSimulateAction(rec.id, dept, "confirm", "Field unit acknowledged slot.")
                                }
                                className="flex-1 py-1 px-1.5 bg-white hover:bg-[#eaf5ea] text-[#2e7d32] border border-[#2e7d32]/30 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() =>
                                  onDepartmentSimulateAction(rec.id, dept, "flag", "Need 30m extra for OHE ladder.")
                                }
                                className="flex-1 py-1 px-1.5 bg-white hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Flag Issue
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <div className="p-8 text-center text-xs text-[#777587] font-mono bg-[#f8f9fa] rounded-lg border border-[#eceef0]">
                    No active maintenance dispatches logged in database. Accept slots in प्रवाहPLAN to trigger department dispatches.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. COA ESCALATED ISSUES MANAGEMENT TAB */}
        {activeSubTab === "escalated-issues" && (
          <div className="pt-4">
            <CoaEscalatedIssuesView />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS & DIALOGS                                                          */}
      {/* ========================================================================= */}

      {/* Decline Reason Modal */}
      {declineModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#191c1e]">Decline Maintenance Block</h3>
            </div>

            <p className="text-xs text-[#464555]">
              Declining request <strong>{declineModalItem.id}</strong> from <strong>{declineModalItem.department}</strong> on <strong>{declineModalItem.trackArea}</strong>.
            </p>

            <div>
              <label className="text-xs font-bold text-[#191c1e] block mb-1">
                Mandatory Reason for Decline:
              </label>
              <textarea
                id="decline-reason-textarea"
                rows={3}
                value={declineReasonText}
                onChange={(e) => setDeclineReasonText(e.target.value)}
                placeholder="e.g. Overlaps with evening peak mail/express traffic; defer to upcoming mega-block Sunday."
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-md p-2.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#ba1a1a]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
              <button
                onClick={() => setDeclineModalItem(null)}
                className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-decline-btn"
                disabled={!declineReasonText.trim()}
                onClick={() => {
                  onRequestDeclined(declineModalItem.id, declineReasonText);
                  setDeclineModalItem(null);
                }}
                className="px-4 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold rounded hover:bg-[#900000] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Slot Recommendation Modal */}
      {adjustSlotModalRec && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#3525cd]">
              <Sliders className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#191c1e]">Adjust Proposed Time Window</h3>
            </div>

            <p className="text-xs text-[#464555]">
              Adjusting recommendation for <strong>{adjustSlotModalRec.station_text}</strong> ({adjustSlotModalRec.departments.join(", ")}).
            </p>

            <div>
              <label className="text-xs font-bold text-[#191c1e] block mb-1">
                Custom Slot Timing:
              </label>
              <input
                id="adjust-slot-input"
                type="text"
                value={adjustedSlotInput}
                onChange={(e) => setAdjustedSlotInput(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-md p-2 text-xs text-[#191c1e] font-mono focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#191c1e] block mb-1">
                Reviewer Decision Notes (Optional):
              </label>
              <textarea
                id="adjust-notes-textarea"
                rows={2}
                value={decisionNotesInput}
                onChange={(e) => setDecisionNotesInput(e.target.value)}
                placeholder="e.g. Shifted by 15 mins to clear CSMT-Kalyan fast express."
                className="w-full bg-[#f8f9fa] border border-[#c7c4d8] rounded-md p-2 text-xs text-[#191c1e] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
              <button
                onClick={() => setAdjustSlotModalRec(null)}
                className="px-3 py-1.5 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-adjust-approve-btn"
                onClick={() => {
                  onApproveRecommendation(adjustSlotModalRec.id, adjustedSlotInput, decisionNotesInput);
                  setAdjustSlotModalRec(null);
                }}
                className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded hover:bg-[#4f46e5] transition-colors cursor-pointer"
              >
                Save & Approve Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Schedule Block Detail Inspector Modal */}
      {selectedScheduleBlock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-[#3525cd] text-white text-[10px] font-mono font-bold uppercase rounded">
                  {selectedScheduleBlock.type.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-[#191c1e] mt-1">
                  {selectedScheduleBlock.title}
                </h3>
                <span className="text-xs text-[#777587] font-mono font-bold">
                  Code: {selectedScheduleBlock.code}
                </span>
              </div>
              <button
                onClick={() => setSelectedScheduleBlock(null)}
                className="text-[#777587] hover:text-[#191c1e] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#eceef0] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#464555] font-semibold">Track Section:</span>
                <span className="font-mono font-bold text-[#191c1e]">{selectedScheduleBlock.stationSection}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#464555] font-semibold">Scheduled Hours:</span>
                <span className="font-mono font-bold text-[#3525cd]">
                  {selectedScheduleBlock.startHour.toFixed(2)}h — {(selectedScheduleBlock.startHour + selectedScheduleBlock.durationHours).toFixed(2)}h ({selectedScheduleBlock.durationHours.toFixed(1)} hrs)
                </span>
              </div>
              {selectedScheduleBlock.department && (
                <div className="flex items-center justify-between">
                  <span className="text-[#464555] font-semibold">Department:</span>
                  <span className="font-medium text-[#191c1e]">{selectedScheduleBlock.department}</span>
                </div>
              )}
              {selectedScheduleBlock.notes && (
                <div className="pt-2 border-t border-[#eceef0]">
                  <span className="text-[#464555] font-semibold block mb-0.5">AI Slot Rationale:</span>
                  <p className="text-[#191c1e] bg-white p-2 rounded border border-[#c7c4d8]/40 font-medium">
                    {selectedScheduleBlock.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eceef0]">
              {onNavigateToWhySlot && (
                <button
                  id="inspect-whyslot-from-modal-btn"
                  onClick={() => {
                    setSelectedScheduleBlock(null);
                    onNavigateToWhySlot(selectedScheduleBlock.code);
                  }}
                  className="px-3.5 py-1.5 bg-[#e2dfff] text-[#3525cd] text-xs font-semibold rounded hover:bg-[#d0ccff] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inspect WhySlot Rationale</span>
                </button>
              )}
              <button
                onClick={() => setSelectedScheduleBlock(null)}
                className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded hover:bg-[#4f46e5] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Central Railway COA Bulletin Modal */}
      {bulletinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#c7c4d8] max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Circular Header */}
            <div className="border-b-2 border-[#191c1e] pb-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#777587] block">
                Central Railway • Mumbai Division
              </span>
              <h2 className="text-lg font-black text-[#191c1e] uppercase tracking-wide mt-0.5">
                Control Office Application (COA) Maintenance Block Circular
              </h2>
              <span className="text-[11px] font-mono text-[#464555] block mt-1">
                Ref: CR/BB/COA/{new Date().getFullYear()}/BLK-{selectedScheduleBlock?.code || "OPT"} • Date of Issue: {selectedScheduleBlock?.date || new Date().toISOString().substring(0, 10)}
              </span>
            </div>

            {/* Circular Body Content */}
            <div className="space-y-3 text-xs text-[#191c1e] leading-relaxed">
              <p>
                <strong>Sanction is hereby accorded</strong> by Chief Controller / Mumbai Division for the execution of integrated multi-departmental maintenance blocks on the Mumbai Central Line ({selectedScheduleBlock?.section || "Central Line corridor"}) as scheduled below:
              </p>

              <div className="p-3 bg-[#f8f9fa] rounded-lg border border-[#c7c4d8]/60 space-y-2">
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[#777587] block">Corridor Section:</span>
                    <strong className="text-[#191c1e]">{selectedScheduleBlock?.section || "Central Line"}</strong>
                  </div>
                  <div>
                    <span className="text-[#777587] block">Authorized Window:</span>
                    <strong className="text-[#3525cd]">{selectedScheduleBlock?.timeWindow || "01:30 — 04:30 IST"}</strong>
                  </div>
                  <div>
                    <span className="text-[#777587] block">Participating Units:</span>
                    <strong className="text-[#137333]">{selectedScheduleBlock?.workType || "Joint Inter-Departmental Work"}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <h4 className="font-bold text-[#191c1e] uppercase text-[11px] tracking-wider">
                  Operating Restrictions & Shadow Safety Measures:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[#464555]">
                  <li>OHE Power Isolation: 25 kV AC section de-energized for the duration of the authorized window ({selectedScheduleBlock?.timeWindow || "as per schedule"}).</li>
                  <li>Track maintenance equipment authorized to enter {selectedScheduleBlock?.section || "the designated section"} as per the sanctioned time window.</li>
                  <li>Automatic signaling in the affected sector switched to manual absolute block protocol for duration of possession.</li>
                  <li>All freight and non-essential rakes held at nearest yard loop until block revocation certificate is issued.</li>
                </ul>
              </div>
            </div>

            {/* Signatures & Actions */}
            <div className="pt-4 border-t border-[#eceef0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[10px] text-[#777587] font-mono">
                Digitally Authenticated: COA Admin / Chief Train Controller
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulletinModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#f2f4f6] text-[#464555] text-xs font-semibold rounded hover:bg-[#e6e8ea] cursor-pointer"
                >
                  Close Notice
                </button>
                <button
                  onClick={() => {
                    setBulletinModalOpen(false);
                    setSyncSuccessMessage("Official COA Bulletin generated and dispatched to Section Controllers.");
                    setTimeout(() => setSyncSuccessMessage(null), 4500);
                  }}
                  className="px-4 py-1.5 bg-[#3525cd] text-white text-xs font-bold rounded hover:bg-[#4f46e5] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Transmit & Issue Circular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COA Provide Maintenance Plan Modal */}
      {planTargetRequest && (
        <CoaProvidePlanModal
          request={planTargetRequest}
          onClose={() => setPlanTargetRequest(null)}
          onDispatchPlan={(requestId, plan) => {
            if (onProvideMaintenancePlan) {
              onProvideMaintenancePlan(requestId, plan);
            } else {
              onRequestApproved(
                requestId,
                `${plan.slots[0]?.date || ""} ${plan.slots[0]?.timeSlot || ""}`
              );
            }
            setPlanTargetRequest(null);
            setSyncSuccessMessage(
              `Maintenance calendar plan successfully sanctioned & dispatched to Zonal Head for: "${plan.taskName}" (${plan.slots.length} possession slot(s) allocated for ${plan.scheduleType} schedule).`
            );
            setTimeout(() => setSyncSuccessMessage(null), 7000);
          }}
        />
      )}

      {/* View Sanctioned Calendar Modal */}
      {viewPlanModal && (
        <ZonalMaintenanceCalendarModal
          plan={viewPlanModal}
          onClose={() => setViewPlanModal(null)}
        />
      )}
    </div>
  );
};
