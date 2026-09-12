import React, { useState, useEffect } from "react";
import {
  ScreenType,
  UserProfile,
  ServiceRequestItem,
  TimelineBlock,
  WhySlotDetail,
  ConflictQueueItem,
  WhatIfSimulationResult,
  InterventionLog,
  CalendarBlock,
  CoaRecommendation,
  WorkerReportedIssue,
  DepartmentType,
  UserRole,
  PravahOptimizedSlot,
  PravahSlotNotification,
  MaintenanceSchedulePlan,
  PriorityType,
} from "./types";
import {
  INITIAL_USER,
  DEMO_USER_PROFILES,
} from "./mockData";
import { Navigation } from "./components/Navigation";
import { LoginRegistrationScreen } from "./components/LoginRegistrationScreen";
import { ServiceRequestScreen } from "./components/ServiceRequestScreen";
import { WhySlotScreen } from "./components/WhySlotScreen";
import { WhatIfSimulatorScreen } from "./components/WhatIfSimulatorScreen";
import { ConflictGuardScreen } from "./components/ConflictGuardScreen";
import { TrackStatsScreen } from "./components/TrackStatsScreen";
import { CoaManagementScreen } from "./components/CoaManagementScreen";
import { WorkerDashboardScreen } from "./components/WorkerDashboardScreen";
import { SupervisorDashboardScreen } from "./components/SupervisorDashboardScreen";
import { ZonalHeadDashboardScreen } from "./components/ZonalHeadDashboardScreen";
import { DepartmentHeadDashboardScreen } from "./components/DepartmentHeadDashboardScreen";
import { SupportLogsModal } from "./components/SupportLogsModal";
import { ShieldAlert, AlertTriangle, X, Lock } from "lucide-react";
import {
  auth,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  persistSlotNotificationToFirestore,
  fetchSlotNotificationsFromFirestore,
} from "./lib/firebase";

// Strict Role-Based Access Matrix Definitions
const ROLE_PERMITTED_SCREENS: Record<UserRole, ScreenType[]> = {
  worker: ["worker-dashboard"],
  supervisor: ["supervisor-dashboard"],
  zonal_head: [
    "zonal-dashboard",
    "service-request",
    "whyslot",
    "whatif",
    "conflictguard",
    "trackstats",
  ],
  department_user: [
    "department-dashboard",
    "service-request",
    "whyslot",
    "whatif",
    "conflictguard",
    "trackstats",
  ],
  department_head: [
    "department-dashboard",
    "service-request",
    "whyslot",
    "whatif",
    "conflictguard",
    "trackstats",
  ],
  coa_admin: [
    "coa-management",
    "whyslot",
    "whatif",
    "conflictguard",
    "trackstats",
  ],
};

const getDefaultScreenForRole = (role: UserRole): ScreenType => {
  switch (role) {
    case "worker":
      return "worker-dashboard";
    case "supervisor":
      return "supervisor-dashboard";
    case "zonal_head":
      return "zonal-dashboard";
    case "department_user":
    case "department_head":
      return "department-dashboard";
    case "coa_admin":
      return "coa-management";
    default:
      return "login";
  }
};

const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case "worker":
      return "Field Worker";
    case "supervisor":
      return "SUPERVISOR";
    case "zonal_head":
      return "Chief Track Engineer (Zonal Head)";
    case "department_user":
    case "department_head":
      return "Sr. Divisional Engineer (Department Head)";
    case "coa_admin":
      return "Chief Controller (COA)";
    default:
      return "User";
  }
};

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("railpravah_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return parsed;
      } catch {}
    }
    return INITIAL_USER;
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const saved = localStorage.getItem("railpravah_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return getDefaultScreenForRole(parsed.userRole);
      } catch {}
    }
    return "login";
  });

  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([]);
  const [whySlots, setWhySlots] = useState<WhySlotDetail[]>([]);
  const [conflictQueue, setConflictQueue] = useState<ConflictQueueItem[]>([]);
  const [whatIfData, setWhatIfData] = useState<WhatIfSimulationResult>({
    telemetry: {
      cascadingDelayTotal: 22,
      forcedCancellations: 2,
      estSystemRecovery: "2h 15m",
      impactRadiusStations: 4,
    },
    cancellations: [],
    delays: [],
    aiAnalysis: "Simulating live Central Railway suburban corridor track block impact.",
  });
  const [interventions, setInterventions] = useState<InterventionLog[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
  const [recommendations, setRecommendations] = useState<CoaRecommendation[]>([]);
  const [operationalNotifications, setOperationalNotifications] = useState<PravahSlotNotification[]>([]);

  // Load live data from Backend API & Supabase on mount
  useEffect(() => {
    // 1. Fetch Service Requests
    fetch("/api/coa/requests")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
      })
      .catch((e) => console.warn("Could not load /api/coa/requests:", e));

    // 2. Fetch Block Calendar
    fetch("/api/coa/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.blocks)) {
          setCalendarBlocks(data.blocks);
        }
      })
      .catch((e) => console.warn("Could not load /api/coa/calendar:", e));

    // 3. Fetch Recommendations
    fetch("/api/coa/recommendations")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        }
      })
      .catch((e) => console.warn("Could not load /api/coa/recommendations:", e));

    // 4. Fetch WhySlot AI Proposals
    fetch("/api/coa/whyslot-proposals")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.proposals)) {
          setWhySlots(data.proposals);
        }
      })
      .catch((e) => console.warn("Could not load /api/coa/whyslot-proposals:", e));

    // 5. Fetch ConflictGuard Live Urgency Queue from Database
    const fetchConflictQueue = () => {
      fetch("/api/coa/conflict-queue")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.queue)) {
            setConflictQueue(data.queue);
          }
        })
        .catch((e) => console.warn("Could not load /api/coa/conflict-queue:", e));
    };
    fetchConflictQueue();
    const conflictInterval = setInterval(fetchConflictQueue, 6000);

    // 6. Fetch Operational Notifications periodically with role & department context
    const fetchNotifications = () => {
      if (!user) return;
      const headers: Record<string, string> = {
        "x-user-role": user.userRole,
        "x-user-dept": user.department || "",
        "x-user-empid": user.empId || "",
      };
      fetch(`/api/notifications?role=${encodeURIComponent(user.userRole)}&department=${encodeURIComponent(user.department || "")}`, {
        headers,
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.notifications)) {
            setOperationalNotifications(data.notifications);
          }
        })
        .catch((e) => console.warn("Could not load /api/notifications:", e));
    };

    fetchNotifications();
    const notifInterval = setInterval(fetchNotifications, 5000);

    fetchSlotNotificationsFromFirestore()
      .then((fbNotifs) => {
        if (Array.isArray(fbNotifs) && fbNotifs.length > 0) {
          setOperationalNotifications((prev) => {
            const ids = new Set(prev.map((n) => n.id));
            const newItems = fbNotifs.filter((n) => !ids.has(n.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch((e) => console.warn("Could not load Firestore notifications:", e));

    return () => {
      clearInterval(conflictInterval);
      clearInterval(notifInterval);
    };
  }, [user?.userRole, user?.department, user?.empId]);

  // Modals state
  const [supportLogsModal, setSupportLogsModal] = useState<{
    isOpen: boolean;
    type: "support" | "logs";
  }>({ isOpen: false, type: "support" });

  // Sidebar minimization state (collapsible for all roles)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // AI loading state
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const syncedUser: UserProfile = {
              id: fbUser.uid,
              name: data.name || fbUser.displayName || "Authorized Personnel",
              email: fbUser.email || undefined,
              empId: data.empId || `WRK-G-${fbUser.uid.slice(0, 4).toUpperCase()}`,
              department: data.department || "Engineering",
              role: data.role || "Worker Gr-IV",
              userRole: data.userRole || "worker",
              avatarUrl:
                fbUser.photoURL ||
                data.avatarUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              isLoggedIn: true,
              authProvider: "google",
            };
            setUser(syncedUser);
          }
        } catch (e) {
          console.warn("Could not sync Firebase user profile on state change:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Unauthorized Access Interception Alert State
  const [unauthorizedAlert, setUnauthorizedAlert] = useState<{
    attemptedScreen: ScreenType;
    targetScreen: ScreenType;
    message: string;
  } | null>(null);

  // Security Route Guard: Enforce that user cannot sit on an unauthorized screen
  useEffect(() => {
    if (!user.isLoggedIn || currentScreen === "login") return;

    const permitted = ROLE_PERMITTED_SCREENS[user.userRole] || [];
    if (!permitted.includes(currentScreen)) {
      const fallback = getDefaultScreenForRole(user.userRole);
      setUnauthorizedAlert({
        attemptedScreen: currentScreen,
        targetScreen: fallback,
        message: `Access Denied: The '${currentScreen}' view is strictly restricted. As a ${getRoleDisplayName(
          user.userRole
        )}, you have been redirected to your authorized workspace.`,
      });
      setCurrentScreen(fallback);
    }
  }, [currentScreen, user.userRole, user.isLoggedIn]);

  // Secure Navigation Handler
  const handleNavigate = (targetScreen: ScreenType) => {
    if (targetScreen === "login") {
      setCurrentScreen("login");
      return;
    }

    const permitted = ROLE_PERMITTED_SCREENS[user.userRole] || [];
    if (!permitted.includes(targetScreen)) {
      const fallback = getDefaultScreenForRole(user.userRole);
      setUnauthorizedAlert({
        attemptedScreen: targetScreen,
        targetScreen: fallback,
        message: `Unauthorized Access Blocked: You do not have permissions for '${targetScreen}'. Only designated role authorities may access that view.`,
      });
      setCurrentScreen(fallback);
      return;
    }

    setUnauthorizedAlert(null);
    setCurrentScreen(targetScreen);
  };

  // Role Authentication / Switch Handlers
  const handleSwitchUserRole = (targetRole: UserRole) => {
    const matchedProfile = DEMO_USER_PROFILES.find((p) => p.userRole === targetRole);
    if (matchedProfile) {
      setUser({
        ...user,
        userRole: matchedProfile.userRole,
        name: matchedProfile.name,
        empId: matchedProfile.empId,
        role: matchedProfile.role,
        department: matchedProfile.department,
        avatarUrl: matchedProfile.avatarUrl,
        isLoggedIn: true,
      });
      const newScreen = getDefaultScreenForRole(matchedProfile.userRole);
      setCurrentScreen(newScreen);
      setUnauthorizedAlert(null);
    }
  };

  const handleToggleUserRole = () => {
    const rolesOrder: UserRole[] = [
      "worker",
      "supervisor",
      "zonal_head",
      "department_user",
      "coa_admin",
    ];
    const currentIdx = rolesOrder.indexOf(user.userRole);
    const nextIdx = (currentIdx + 1) % rolesOrder.length;
    handleSwitchUserRole(rolesOrder[nextIdx]);
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem("railpravah_user", JSON.stringify(newUser));
    const targetScreen = getDefaultScreenForRole(newUser.userRole);
    setCurrentScreen(targetScreen);
    setUnauthorizedAlert(null);
  };

  const handleToggleAuth = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
    localStorage.removeItem("railpravah_user");
    localStorage.removeItem("railpravah_token");
    setUser(INITIAL_USER);
    setCurrentScreen("login");
  };

  // When worker reports an issue from WorkerDashboardScreen
  const handleWorkerIssueReported = async (issue: WorkerReportedIssue) => {
    const mappedDept: DepartmentType =
      issue.department === "Track"
        ? "Engineering"
        : issue.department === "Electrical"
        ? "Traction"
        : issue.department === "Signal"
        ? "S&T"
        : "Operations";

    const newServiceReq: ServiceRequestItem = {
      id: `req-${issue.id}`,
      department: mappedDept,
      trackArea: issue.location.address,
      description: `[Field Issue: ${issue.ticketNo}] ${issue.description}`,
      priority: issue.priority,
      preferredSlot: "Immediate / Next Available Night Window",
      status: "Pending",
      createdAt: issue.createdAt,
      workType: `${issue.department} Repair & Clearance (Est. ${issue.estimatedFixTimeMinutes}m)`,
      submittedBy: `${issue.reportedBy.name} (${issue.reportedBy.empId})`,
    };

    setRequests((prev) => [newServiceReq, ...prev]);
  };

  const handleSubmitServiceRequest = (newReq: Omit<ServiceRequestItem, "id" | "createdAt">) => {
    const createdItem: ServiceRequestItem = {
      ...newReq,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    setRequests([createdItem, ...requests]);
  };

  // COA Management Handlers
  const handleRequestApproved = async (id: string, assignedSlot?: string) => {
    const targetReq = requests.find((r) => r.id === id);
    if (!targetReq) return;

    const finalSlot = assignedSlot || targetReq.preferredSlot;

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Approved", assignedSlot: finalSlot } : r))
    );

    const newCalBlock: CalendarBlock = {
      id: `cal-${Date.now()}`,
      title: `${targetReq.department}: ${targetReq.workType || "Maintenance Block"}`,
      station: targetReq.trackArea,
      department: targetReq.department,
      date: "2026-08-29",
      startTime: "02:00",
      endTime: "04:30",
      priority: targetReq.priority,
      status: "approved",
      description: targetReq.description,
      trainsAffected: 2,
    };
    setCalendarBlocks((prev) => [newCalBlock, ...prev]);

    try {
      await fetch(`/api/coa/requests/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ assignedSlot: finalSlot }),
      });
    } catch (e) {
      console.warn("Backend request approval notice:", e);
    }
  };

  const handleProvideMaintenancePlan = (requestId: string, plan: MaintenanceSchedulePlan) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              planProvidedByCoa: true,
              maintenanceSchedule: plan,
              status: "Approved",
              assignedSlot: `${plan.slots[0]?.date || ""} ${plan.slots[0]?.timeSlot || ""}`,
            }
          : r
      )
    );

    // Map each sanctioned slot into calendarBlocks so all system calendars reflect the schedule with task name & description
    const newCalBlocks: CalendarBlock[] = plan.slots.map((s, idx) => ({
      id: s.id || `cal-plan-${Date.now()}-${idx}`,
      title: plan.taskName,
      station: s.trackArea || s.corridorSector || plan.trackArea,
      department: plan.department,
      date: s.date,
      startTime: s.timeSlot.split("–")[0]?.trim() || s.startTime || "01:30",
      endTime: s.timeSlot.split("–")[1]?.replace("IST", "").trim() || s.endTime || "04:30",
      priority: (s.priority || plan.priority || "High") as PriorityType,
      status: "approved",
      description: s.description || plan.description,
      trainsAffected: s.trainsAffected || 0,
      taskName: plan.taskName,
      machineryGangs: s.machineryGangs,
      cautionOrder: s.cautionOrder,
      timeSlot: s.timeSlot,
      periodLabel: plan.scheduleType,
      planReference: requestId,
    }));

    setCalendarBlocks((prev) => [...newCalBlocks, ...prev]);
  };

  const handleRequestDeclined = async (id: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Declined", declineReason: reason } : r))
    );

    try {
      await fetch(`/api/coa/requests/${id}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ reason }),
      });
    } catch (e) {
      console.warn("Backend request decline notice:", e);
    }
  };

  const handleRefreshRequests = async () => {
    try {
      const res = await fetch("/api/coa/requests");
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.warn("Could not reload requests:", e);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const res = await fetch("/api/coa/generate-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
      });
      const data = await res.json();
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
        const mappedWhySlots: WhySlotDetail[] = data.recommendations.map((rec: any, idx: number) => ({
          id: rec.id || `slot-${idx}`,
          slotCode: rec.cluster_id || `SLOT-${(rec.id || "").substring(0, 6).toUpperCase()}`,
          priority: rec.priority_tier === "Emergency" || rec.priority_tier === "High" ? "High Priority" : "Standard Priority",
          timeWindow: rec.slot_window || rec.proposed_slot || "01:30 - 04:30",
          location: rec.station_text || "Central Line Corridor",
          score: rec.isClustered ? 96 : 91,
          confidence: "Very High",
          trainsAffectedCount: rec.trains_affected_clustered || 0,
          trainsAffectedList: [
            { name: "12124 Deccan Qn", status: "Rescheduled", color: "secondary" },
            { name: "11009 Sinhagad Exp", status: "Regulated", color: "secondary" },
            { name: "Local 90432", status: "Diversion via Slow", color: "primary" },
          ],
          savedMinutes: rec.trains_saved_count ? rec.trains_saved_count * 15 : 45,
          wastedMinutes: 12,
          netGainMinutes: rec.trains_saved_count ? rec.trains_saved_count * 15 - 12 : 33,
          travelerImpactLevel: "Low",
          travelerImpactText: `Zero suburban cancellations during the ${rec.slot_window} possession window.`,
          justificationParagraphs: [
            rec.plain_language_reason || "AI optimizer identified optimal non-peak possession gap.",
            rec.safety_notes || "Multi-department safety protocol verified.",
          ],
          status: rec.status === "approved" ? "approved" : rec.status === "rejected" ? "rejected" : "pending",
        }));
        setWhySlots(mappedWhySlots);
      }
    } catch (e) {
      console.warn("Error triggering AI recommendations:", e);
    }
  };

  const handleApproveRecommendation = async (
    id: string,
    adjustedSlot?: string,
    notes?: string
  ) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved",
              slot_window: adjustedSlot || r.slot_window,
              plain_language_reason: notes
                ? `${r.plain_language_reason} (Note: ${notes})`
                : r.plain_language_reason,
            }
          : r
      )
    );

    try {
      await fetch(`/api/coa/recommendations/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ adjustedSlot, notes }),
      });
    } catch (e) {
      console.warn("Backend recommendation approval notice:", e);
    }
  };

  const handleRejectRecommendation = async (id: string, reason?: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );

    try {
      await fetch(`/api/coa/recommendations/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ reason }),
      });
    } catch (e) {
      console.warn("Backend recommendation rejection notice:", e);
    }
  };

  const handleSendRecommendation = async (id: string) => {
    try {
      const res = await fetch(`/api/coa/recommendations/${id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? data.recommendation : r))
        );
      }
    } catch (e) {
      console.warn("Error sending recommendation to departments:", e);
    }
  };

  const handleDepartmentSimulateAction = async (
    id: string,
    department: string,
    action: "confirm" | "flag",
    note?: string
  ) => {
    try {
      const res = await fetch(`/api/coa/recommendations/${id}/department-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({ department, action, note }),
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? data.recommendation : r))
        );
      }
    } catch (e) {
      console.warn("Error recording department action:", e);
    }
  };

  const handleAddTimelineBlock = (block: TimelineBlock) => {
    setTimelineBlocks((prev) => [block, ...prev]);
  };

  const handleApproveWhySlot = (slotCode: string, newBlock?: CalendarBlock) => {
    setWhySlots((prev) =>
      prev.map((s) => (s.slotCode === slotCode ? { ...s, status: "approved" } : s))
    );
    if (newBlock) {
      setCalendarBlocks((prev) => [
        newBlock,
        ...prev.filter(
          (b) =>
            b.id !== newBlock.id &&
            (b as any).slotCode !== (newBlock as any).slotCode &&
            (b as any).slotCode !== slotCode &&
            !(b.station === newBlock.station && b.date === newBlock.date && b.startTime === newBlock.startTime)
        ),
      ]);
    }
    fetch("/api/coa/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.blocks)) {
          setCalendarBlocks(data.blocks);
        }
      })
      .catch((e) => console.warn("Could not reload /api/coa/calendar:", e));
  };

  const handleRejectWhySlot = (slotCode: string) => {
    setWhySlots((prev) =>
      prev.map((s) => (s.slotCode === slotCode ? { ...s, status: "rejected" } : s))
    );
  };

  const handleSimulateWhatIf = async (
    targetBlock: string,
    delayMinutes: number
  ): Promise<WhatIfSimulationResult | null> => {
    try {
      const res = await fetch("/api/gemini/simulate-whatif", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({
          targetBlock,
          delayMinutes,
          section: targetBlock,
          duration: delayMinutes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const simResult = data.result || data;
        setWhatIfData(simResult);
        return simResult;
      }
    } catch (e) {
      console.warn("What-if simulation backend fallback:", e);
    }
    return null;
  };

  const handleResolveConflict = async (id: string, notes: string, actionType: string = "assign") => {
    // Optimistic UI update
    setConflictQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, slotStatus: "Assigned" as const, resolutionNotes: notes }
          : item
      )
    );

    try {
      const res = await fetch(`/api/coa/conflict-queue/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.userRole || "coa_admin",
          "x-user-empid": user?.empId || "",
          "x-user-dept": user?.department || "",
        },
        body: JSON.stringify({ assignedSlot: notes, notes, actionType }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh calendar blocks and conflict queue
        fetch("/api/coa/calendar")
          .then((r) => r.json())
          .then((calData) => {
            if (calData.success && Array.isArray(calData.blocks)) {
              setCalendarBlocks(calData.blocks);
            }
          })
          .catch(() => {});
        
        fetch("/api/coa/conflict-queue")
          .then((r) => r.json())
          .then((qData) => {
            if (qData.success && Array.isArray(qData.queue)) {
              setConflictQueue(qData.queue);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn("Could not post conflict resolution to backend:", e);
    }

    setInterventions((prev) => [
      {
        id: `INT-${Date.now().toString().slice(-4)}`,
        timeUTC: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sectorNode: "MUM-Dadar",
        type: actionType === "prevent_shift" ? "Schedule Conflict Prevention" : "Path Conflict Clearance",
        timeRecovered: "+45 mins",
      },
      ...prev,
    ]);
  };

  const handleOptimizeScheduleWithAI = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch("/api/gemini/optimize-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.userRole,
        },
        body: JSON.stringify({
          slotId: "SLOT-992A",
          section: "DR - GC (Main)",
          requestedTime: "02:00 - 05:00",
          department: "Traction & Engineering",
          conflictReason: "Overlaps with freight corridor traffic",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.optimizationScore) {
          setWhySlots((prev) => [
            {
              id: "slot-" + Date.now(),
              slotCode: data.slotId || "SLOT-AI-OPT",
              priority: "High Priority",
              timeWindow: data.recommendedSlot?.window || "Tomorrow, 01:30 - 04:30",
              location: "DR - GC Sector",
              score: data.optimizationScore,
              confidence: data.confidence || "High",
              trainsAffectedCount: data.affectedTrainsCount || 3,
              trainsAffectedList: data.trainsAffected || [
                { name: "12124 Deccan Qn", status: "Rescheduled", color: "secondary" },
                { name: "11009 Sinhagad Exp", status: "Regulated", color: "secondary" },
                { name: "Local 90432", status: "Cancelled", color: "error" },
              ],
              savedMinutes: data.timeEfficiency?.savedMinutes || 45,
              wastedMinutes: data.timeEfficiency?.wastedMinutes || 12,
              netGainMinutes: data.timeEfficiency?.netGainMinutes || 33,
              travelerImpactLevel: data.travelerImpact?.level || "Moderate",
              travelerImpactText:
                data.travelerImpact?.description ||
                "Minor suburban density fluctuation during night window transition.",
              justificationParagraphs: data.justification || [
                "The proposed maintenance slot leverages historical lull in freight traffic on the down line.",
              ],
              status: "pending",
            },
            ...prev,
          ]);
        }
      }
    } catch (e) {
      console.warn("AI schedule optimization fallback:", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAcceptPravahSlot = (slot: PravahOptimizedSlot) => {
    // Add the task with slot timings, date, name, location of work into calendar of Worker and Zonal Head
    const newCalBlock: CalendarBlock = {
      id: `cal-prv-${slot.id}-${Date.now()}`,
      title: slot.workName,
      station: slot.location,
      department: Array.isArray(slot.departments) ? slot.departments.join(" & ") : (slot.departments || "Multi-Department"),
      date: slot.date,
      startTime: slot.startTime || "01:30",
      endTime: slot.endTime || "04:30",
      priority: "Critical",
      status: "approved",
      description: `Sanctioned by प्रवाहPlan AI Schedule Optimizer. ${Array.isArray(slot.workItems) ? slot.workItems.map((w: any) => w.name).join("; ") : slot.workName}. Location: ${slot.location}. Timings: ${slot.timing}. Zero train delays principle applied.`,
      trainsAffected: 0,
      isClustered: Array.isArray(slot.departments) && slot.departments.length > 1,
    };
    setCalendarBlocks((prev) => [newCalBlock, ...prev]);

    // Send notifications to all involved roles (Department Head, Zonal Head, Supervisor, Worker)
    const slotNotification: PravahSlotNotification = {
      id: `notif-slot-${slot.id}-${Date.now()}`,
      slotId: slot.id,
      slotCode: slot.slotCode,
      title: `COA Sanctioned AI Slot: ${slot.slotCode} - ${slot.workName}`,
      message: `COA Master Traffic Controller accepted AI Schedule Optimizer slot ${slot.slotCode} for ${slot.location} on ${slot.date} (${slot.timing}). Zero regular train delays guaranteed. Synced to calendars and dispatched to Department Head, Zonal Head, Supervisor, and Field Worker.`,
      timing: slot.timing,
      startTime: slot.startTime || "01:30",
      endTime: slot.endTime || "04:30",
      date: slot.date,
      location: slot.location,
      workName: slot.workName,
      departments: Array.isArray(slot.departments) ? slot.departments : [slot.departments],
      recipientRoles: ["department_user", "zonal_head", "supervisor", "worker"],
      recipientDepts: Array.isArray(slot.departments) ? slot.departments : [slot.departments],
      createdAt: new Date().toISOString(),
      sanctionedBy: "COA Master Traffic Controller",
      status: "active",
    };
    setOperationalNotifications((prev) => [slotNotification, ...prev]);
    persistSlotNotificationToFirestore(slotNotification);

    // Also update any matching pending request to approved
    if (Array.isArray(slot.workItems)) {
      slot.workItems.forEach((w) => {
        handleRequestApproved(w.id, `${slot.date} ${slot.timing}`);
      });
    }
  };

  const criticalConflictCount = conflictQueue.filter(
    (i) => i.priorityNum === 1 && i.slotStatus !== "Assigned"
  ).length;

  const isScreenAuthorized = ROLE_PERMITTED_SCREENS[user.userRole]?.includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col selection:bg-[#e2dfff] selection:text-[#0f0069]">
      {/* Top Navbar */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenSupportModal={(type) => setSupportLogsModal({ isOpen: true, type })}
        user={user}
        onToggleAuth={handleToggleAuth}
        onToggleUserRole={handleToggleUserRole}
        criticalConflictCount={criticalConflictCount}
        operationalNotifications={operationalNotifications}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Unauthorized Access Toast / Banner */}
      {unauthorizedAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-[#ffdad6] border border-[#ba1a1a] text-[#410002] p-4 rounded-xl shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <ShieldAlert className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-[#ba1a1a] flex items-center gap-1">
              <span>Security Notice: Unauthorized Role Access Denied</span>
            </div>
            <p className="mt-0.5 leading-relaxed">{unauthorizedAlert.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setUnauthorizedAlert(null)}
            className="text-[#ba1a1a] hover:bg-[#ba1a1a]/10 p-1 rounded transition-colors ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Container */}
      <div className={`flex-1 flex ${currentScreen === "login" ? "" : "pt-14"}`}>
        {currentScreen === "login" ? (
          <main className="flex-1">
            <LoginRegistrationScreen onLoginSuccess={handleLoginSuccess} currentUser={user} />
          </main>
        ) : (
          <main
            className={`flex-1 overflow-x-hidden transition-all duration-300 ${
              isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
            }`}
          >
            {/* Guard: If for any reason the current screen is not authorized, show access blocked message */}
            {!isScreenAuthorized && (
              <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12 bg-white rounded-2xl border border-[#ffdad6] shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-[#191c1e]">
                  Restricted Hierarchy Dashboard
                </h2>
                <p className="text-xs text-[#464555] max-w-md mx-auto leading-relaxed">
                  You are logged in as a <strong>{getRoleDisplayName(user.userRole)}</strong>.
                  According to the RailPravah Role-Based Access Control matrix, each hierarchy level
                  has access only to the tabs and dashboards assigned to their specific role.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen(getDefaultScreenForRole(user.userRole))}
                    className="px-4 py-2 bg-[#3525cd] text-white text-xs font-bold rounded-lg hover:bg-[#4f46e5] cursor-pointer shadow-xs"
                  >
                    Return to My Authorized Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Worker Dashboard: Strictly Worker role */}
            {isScreenAuthorized && currentScreen === "worker-dashboard" && (
              <WorkerDashboardScreen
                user={user}
                onIssueReported={handleWorkerIssueReported}
                onNavigate={handleNavigate}
                onSwitchUserRole={handleSwitchUserRole}
                calendarBlocks={calendarBlocks}
              />
            )}

            {/* Supervisor Dashboard: Strictly Supervisor role */}
            {isScreenAuthorized && currentScreen === "supervisor-dashboard" && (
              <SupervisorDashboardScreen
                user={user}
                onNavigate={handleNavigate}
                onSwitchUserRole={handleSwitchUserRole}
                calendarBlocks={calendarBlocks}
              />
            )}

            {/* Zonal Head Dashboard: Strictly Zonal Head role */}
            {isScreenAuthorized && currentScreen === "zonal-dashboard" && (
              <ZonalHeadDashboardScreen
                user={user}
                onNavigate={handleNavigate}
                onSwitchUserRole={handleSwitchUserRole}
                calendarBlocks={calendarBlocks}
                requests={requests}
              />
            )}

            {/* Department Head Dashboard: Strictly Department Head role */}
            {isScreenAuthorized && currentScreen === "department-dashboard" && (
              <DepartmentHeadDashboardScreen
                user={user}
                onNavigate={handleNavigate}
                onSwitchUserRole={handleSwitchUserRole}
                calendarBlocks={calendarBlocks}
              />
            )}

            {/* COA Management: Strictly COA role */}
            {isScreenAuthorized && currentScreen === "coa-management" && (
              <CoaManagementScreen
                user={user}
                requests={requests}
                onRequestApproved={handleRequestApproved}
                onRequestDeclined={handleRequestDeclined}
                calendarBlocks={calendarBlocks}
                recommendations={recommendations}
                onGenerateRecommendations={handleGenerateRecommendations}
                onApproveRecommendation={handleApproveRecommendation}
                onRejectRecommendation={handleRejectRecommendation}
                onSendRecommendation={handleSendRecommendation}
                onDepartmentSimulateAction={handleDepartmentSimulateAction}
                timelineBlocks={timelineBlocks}
                onAddTimelineBlock={handleAddTimelineBlock}
                onUpdateTimelineBlocks={(blocks) => setTimelineBlocks(blocks)}
                onNavigateToWhySlot={(_slotCode) => handleNavigate("whyslot")}
                onOptimizeScheduleWithAI={handleOptimizeScheduleWithAI}
                isOptimizing={isOptimizing}
                onNavigate={handleNavigate}
                onSwitchUserRoleType={handleSwitchUserRole}
                onAcceptPravahSlot={handleAcceptPravahSlot}
                onProvideMaintenancePlan={handleProvideMaintenancePlan}
                onRefreshRequests={handleRefreshRequests}
              />
            )}

            {/* Operations Tools (Permitted based on role matrix) */}
            {isScreenAuthorized && currentScreen === "service-request" && (
              <ServiceRequestScreen
                requests={requests}
                currentUser={user}
                onSubmitRequest={handleSubmitServiceRequest}
                onSendToScheduler={(_req) => {
                  if (user.userRole === "coa_admin") {
                    handleNavigate("coa-management");
                  } else {
                    handleNavigate("whyslot");
                  }
                }}
              />
            )}

            {isScreenAuthorized && currentScreen === "whyslot" && (
              <WhySlotScreen
                slots={whySlots}
                userRole={user.userRole}
                currentUser={user}
                onApproveSlot={handleApproveWhySlot}
                onRejectSlot={handleRejectWhySlot}
                onNavigateToWhatIf={(_code) => handleNavigate("whatif")}
              />
            )}

            {isScreenAuthorized && currentScreen === "whatif" && (
              <WhatIfSimulatorScreen
                initialData={whatIfData}
                requests={requests}
                calendarBlocks={calendarBlocks}
                timelineBlocks={timelineBlocks}
                onSimulate={handleSimulateWhatIf}
              />
            )}

            {isScreenAuthorized && currentScreen === "conflictguard" && (
              <ConflictGuardScreen
                queueItems={conflictQueue}
                currentUser={user}
                onResolveItem={handleResolveConflict}
              />
            )}

            {isScreenAuthorized && currentScreen === "trackstats" && (
              <TrackStatsScreen interventions={interventions} />
            )}
          </main>
        )}
      </div>

      {/* Global Support & Logs Modal */}
      <SupportLogsModal
        isOpen={supportLogsModal.isOpen}
        type={supportLogsModal.type}
        onClose={() => setSupportLogsModal({ isOpen: false, type: "support" })}
      />
    </div>
  );
};

export default App;
