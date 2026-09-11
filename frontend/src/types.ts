export type ScreenType =
  | "login"
  | "worker-dashboard"
  | "supervisor-dashboard"
  | "zonal-dashboard"
  | "department-dashboard"
  | "coa-management"
  | "service-request"
  | "whyslot"
  | "whatif"
  | "conflictguard"
  | "trackstats";

export type DepartmentType =
  | "Engineering"
  | "Traction"
  | "S&T"
  | "Commercial"
  | "Operations"
  | "Engineering Department"
  | "Traction Distribution Department"
  | "Signal and Telecommunication Department";

export type UserRole = "worker" | "supervisor" | "department_user" | "department_head" | "zonal_head" | "coa_admin";

export type WorkerDepartment = "Track" | "Electrical" | "Signal" | "Other";

export interface WorkerMediaAttachment {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  size: string;
  file?: File;
}

export type IssueLifecycleStatus =
  | "Reported"
  | "Under Supervisor Review"
  | "Resolved by Supervisor"
  | "Escalated to Zonal Head"
  | "Under Zonal Review"
  | "Resolved by Zonal Head"
  | "Escalated to Department Head"
  | "Under Department Review"
  | "Resolved by Department Head"
  | "Escalated to COA"
  | "Under COA Review"
  | "Sanctioned by COA"
  | "Resolved / Closed";

export interface PravahOptimizedSlot {
  id: string;
  slotCode: string;
  date: string;
  timing: string;
  startTime: string;
  endTime: string;
  location: string;
  workName: string;
  departments: string[];
  workItems: Array<{
    id: string;
    name: string;
    department: string;
    source:
      | "Pending Queue"
      | "Department Head Request"
      | "Department Head Escalation"
      | "Zonal Head Request"
      | "Zonal Head Escalation"
      | "Service Request Queue";
    workType?: string;
    priority?: string;
    submittedBy?: string;
  }>;
  principlesCompliance: {
    trainDelayImpact: string;
    multiDeptClustering: string;
    assetDowntimeMinimized: string;
    infrastructureAvailability: string;
  };
  status: "pending_coa_decision" | "accepted" | "rejected";
  rejectionReason?: string;
  acceptedAt?: string;
}

export interface IssueModificationRecord {
  id: string;
  level: "Worker" | "Supervisor" | "Zonal Head" | "Department Head" | "COA Management";
  modifiedBy: {
    name: string;
    empId: string;
    role: string;
    department?: string;
  };
  dateTime: string;
  changes: string;
  remarks: string;
  actionTaken?: string;
}

export interface IssueSnapshot {
  title: string;
  department: WorkerDepartment | DepartmentType;
  station: string;
  trackSection: string;
  nearestKmPost: string;
  lineType: "Down Fast" | "Up Fast" | "Down Slow" | "Up Slow" | "Yard / Siding" | "Sanctioned Corridor Lines" | string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  voiceTranscript?: string;
  priority: PriorityType;
  estimatedFixTimeMinutes: number;
  media: WorkerMediaAttachment[];
  technicalNotes?: string;
  hazardCategory?: string;
}

export interface HierarchicalIssue {
  id: string;
  ticketNo: string;
  currentStatus: IssueLifecycleStatus;
  
  // Immutable Original Worker Request
  originalRequest: IssueSnapshot & {
    reportedBy: {
      name: string;
      empId: string;
      phone: string;
      gangNo?: string;
    };
    reportedAt: string;
  };

  // Current Active Request (editable at receiving hierarchy levels)
  activeRequest: IssueSnapshot;

  // Station and Hierarchy Relationship
  station: string;
  zone: string;
  department: DepartmentType | WorkerDepartment;
  supervisor: {
    name: string;
    empId: string;
    designation: string;
    phone: string;
    depot: string;
  };
  zonalHead?: {
    name: string;
    empId: string;
    designation: string;
    zone: string;
  };
  departmentHead?: {
    name: string;
    empId: string;
    designation: string;
    department: string;
  };
  coaReviewer?: {
    name: string;
    empId: string;
    designation: string;
  };

  // Escalation Metadata & Reasons
  escalatedToZonalAt?: string;
  zonalEscalationReason?: string;
  zonalRemarks?: string;

  escalatedToDeptAt?: string;
  deptEscalationReason?: string;
  deptRemarks?: string;

  escalatedToCoaAt?: string;
  coaEscalationReason?: string;
  coaRemarks?: string;

  // Resolution Details
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    empId: string;
    level: string;
  };
  resolutionDetails?: string;

  // Audit History
  modificationHistory: IssueModificationRecord[];
  escalationHistory?: any[];

  createdAt: string;
  updatedAt: string;
}

export interface WorkerReportedIssue {
  id: string;
  ticketNo: string;
  department: WorkerDepartment;
  assignedSupervisor: {
    name: string;
    designation: string;
    phone: string;
    depot: string;
    status: "Active on Duty" | "Standby";
  };
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    trackSection: string;
    nearestKmPost: string;
    lineType: "Down Fast" | "Up Fast" | "Down Slow" | "Up Slow" | "Yard / Siding" | "Sanctioned Corridor Lines" | string;
  };
  description: string;
  voiceTranscript?: string;
  estimatedFixTimeMinutes: number;
  media: WorkerMediaAttachment[];
  priority: PriorityType;
  status:
    | "Reported"
    | "Reported to Supervisor"
    | "Endorsed by Supervisor"
    | "Supervisor Dispatched"
    | "Block Queued"
    | "Under Repair"
    | "Resolved";
  reportedBy: {
    name: string;
    empId: string;
    phone: string;
  };
  createdAt: string;
}

export type PriorityType = "Low" | "Medium" | "High" | "Emergency" | "Critical";

export type RequestStatus =
  | "Pending"
  | "Scheduled"
  | "Rejected"
  | "In Progress"
  | "Completed"
  | "Approved"
  | "Declined";

export type MaintenancePeriodType = "weekly" | "monthly" | "manual" | "none";

export interface MaintenancePlanSlot {
  id: string;
  date: string; // "YYYY-MM-DD"
  dayName: string; // "Monday", etc.
  startTime: string; // "01:30"
  endTime: string; // "04:30"
  timeSlot: string; // "01:30 – 04:30 IST"
  trackArea: string;
  department: string;
  taskName: string;
  description: string;
  status: "Sanctioned" | "Completed" | "Pending";
  machineryGangs?: string;
  cautionOrder?: string;
  trainsAffected?: number;
  corridorSector?: string;
  priority?: PriorityType;
}

export interface MaintenanceSchedulePlan {
  scheduleType: MaintenancePeriodType;
  periodLabel: string; // "Weekly Plan (Sep 07 – Sep 13, 2026)" or "Monthly Plan (September 2026)"
  startDate: string;
  endDate: string;
  taskName: string;
  description: string;
  trackArea: string;
  department: DepartmentType | string;
  priority: PriorityType;
  slots: MaintenancePlanSlot[];
  dispatchedAt: string;
  dispatchedBy: string;
  sanctionCode: string;
  specialInstructions?: string;
}

export interface ServiceRequestItem {
  id: string;
  department: DepartmentType;
  trackArea: string;
  taskName?: string;
  description: string;
  priority: PriorityType;
  preferredSlot: string;
  status: RequestStatus;
  createdAt: string;
  timePeriodType?: MaintenancePeriodType;
  customTimePeriod?: string;
  planProvidedByCoa?: boolean;
  maintenanceSchedule?: MaintenanceSchedulePlan;
  coaPlanNotes?: string;
  cluster_id?: string | null;
  workType?: string;
  declineReason?: string;
  departmentActionStatus?: "awaiting" | "confirmed" | "flagged";
  flagReason?: string;
  assignedSlot?: string;
  submittedBy?: string;
}

export interface CoaRecommendation {
  id: string;
  cluster_id?: string;
  isClustered: boolean;
  stations: string[];
  station_text: string;
  proposed_slot: string;
  slot_window: string;
  priority_level: PriorityType;
  trains_affected_clustered: number;
  trains_affected_individual_sum: number;
  trains_saved_count: number;
  status: "pending_review" | "approved" | "rejected" | "sent_to_departments" | "confirmed";
  coa_reviewer_id?: string;
  decision_notes?: string;
  departments: string[];
  request_ids: string[];
  requests_detail?: ServiceRequestItem[];
  plain_language_reason: string;
  safety_check_passed: boolean;
  safety_notes?: string;
  departmentConfirmations?: Record<
    string,
    { status: "confirmed" | "flagged" | "awaiting"; note?: string; time?: string }
  >;
  createdAt: string;
}

export interface CalendarBlock {
  id: string;
  title: string;
  station: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  priority: PriorityType;
  status: "approved" | "pending" | "conflict" | "emergency";
  description: string;
  clusterId?: string;
  isClustered?: boolean;
  trainsAffected?: number;
  taskName?: string;
  machineryGangs?: string;
  cautionOrder?: string;
  timeSlot?: string;
  periodLabel?: string;
  planReference?: string;
}

export type HierarchyRole =
  | "COA"
  | "Department Head"
  | "Zonal Head"
  | "Supervisor"
  | "Technician";

export type DepartmentName =
  | "Engineering"
  | "Electrical / Traction"
  | "Signal & Telecom"
  | "Operations";

export type SubDepartmentName =
  | "Track Maintenance"
  | "Track Machine"
  | "Bridges / Structures"
  | "OHE Maintenance"
  | "OHE Inspection"
  | "Power Supply"
  | "Signalling"
  | "Interlocking"
  | "Telecom"
  | "Train Control"
  | "Traffic Management";

export type BlockStatus =
  | "Draft"
  | "Requested"
  | "AI Analysis"
  | "AI Optimized"
  | "Pending Approval"
  | "Department Approved"
  | "Operations Approved"
  | "Approved"
  | "Preparing"
  | "Active"
  | "Completed"
  | "Cancelled";

export type CorridorStatus = "Normal" | "Maintenance" | "Block Active" | "Conflict" | "AI Optimized";

export interface MumbaiCorridor {
  code: string; // "CSTM - BY", "BY - DR", "DR - GC", "GC - VK", "VK - TNA"
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  lengthKm: number;
  status: CorridorStatus;
  activeBlocksCount: number;
  tracks: string[]; // ["Up Fast", "Down Fast", "Up Slow", "Down Slow", "5th Line"]
}

export interface MaintenanceBlock {
  id: string;
  code: string; // e.g. "REQ-892", "BLK-101"
  title: string;
  corridor: string; // "DR - GC", "CSTM - BY", "BY - DR", "GC - VK", "VK - TNA"
  trackLine: string; // "Down Fast", "Up Fast", "Down Slow", "Up Slow"
  department: DepartmentName;
  subDepartment: SubDepartmentName;
  team: string; // e.g. "P-Way Team 1", "TRD Crew 3"
  activity: string; // e.g. "Track Tamping", "OHE Inspection", "Signal Maintenance"
  startHour: number; // e.g. 2.0 (02:00)
  durationHours: number; // e.g. 3.0
  status: BlockStatus;
  type: "ai-planned" | "scheduled-train" | "clustered-task" | "conflict-rejected" | "department-task";
  priority: PriorityType;
  trainCategory?: "Local Fast" | "Local Slow" | "Long-distance / Express" | "Freight" | "Special / Maintenance Train";
  
  // Dependency tracking
  dependencies?: {
    engineeringReady: boolean;
    electricalIsolationReady: boolean;
    signalProtectionReady: boolean;
    operationsApproved: boolean;
    waitingOn?: string;
  };

  // Collaboration / Cluster info
  clusterId?: string;
  isCollaborative?: boolean;
  partnerDepartments?: DepartmentName[];
  savedMinutes?: number;

  // AI & Reasoning
  aiRationale?: string;
  efficiencyGain?: number;
  conflictsWith?: string[];

  // Execution tracking
  actualStartTime?: string;
  actualEndTime?: string;
  reportedIssues?: string[];
  assignedStaff?: string;
}

export interface TimelineBlock {
  id: string;
  code: string;
  title: string;
  stationSection: string; // e.g. "DR - GC"
  startHour: number; // 0 to 24
  durationHours: number;
  type: "ai-planned" | "scheduled-train" | "clustered-task" | "conflict-rejected" | "department-task";
  department?: string;
  subTitle?: string;
  notes?: string;
  status?: BlockStatus;
  corridor?: string;
  activity?: string;
  team?: string;
  dependencies?: {
    engineeringReady: boolean;
    electricalIsolationReady: boolean;
    signalProtectionReady: boolean;
    operationsApproved: boolean;
    waitingOn?: string;
  };
  clusterId?: string;
  isCollaborative?: boolean;
  date?: string;
  section?: string;
  timeWindow?: string;
  workType?: string;
}

export interface AffectedTrainDetail {
  trainNo: string;
  trainName: string;
  serviceType: string;
  scheduledSlot: string;
  origin?: string;
  destination?: string;
  direction?: string;
  priorityTier: number;
  status: "Rescheduled" | "Regulated" | "Cancelled" | "Caution Order";
  color: "primary" | "secondary" | "error" | "warning";
  impact: string;
}

export interface SchedulingConflictInfo {
  hasConflict: boolean;
  conflictType?: "Timetable Train Collision" | "Track Possession Overlap" | "Safety Isolation Conflict" | "Throat Interlocking Lock" | string | null;
  conflictDetails?: string;
  preventionAction?: string;
}

export interface CustodyOfficerInfo {
  role: UserRole | string;
  roleLabel: string;
  level: number;
  assigneeName?: string;
  statusKey: string;
}

export interface ConflictQueueItem {
  id: string;
  priorityNum: number; // 1 = Critical/Emergency, 2 = High Asset Risk, 3 = Medium/Low Queued
  department: DepartmentType | string;
  description: string;
  fullDescription?: string;
  areaLoc: string;
  station?: string;
  lineType?: string;
  slotStatus: "Immediate Assignment" | "Pending Slot Eval" | "Queued" | "Assigned" | "Pending COA Sanction" | string;
  statusColor?: "error" | "warning" | "neutral" | "primary";
  timestamp: string;
  createdAt?: string;
  consequenceIfNotResolved?: string;
  riskLevel?: "Critical Safety Hazard" | "Severe Bottleneck Risk" | "Operational Caution" | string;
  affectedTrains?: AffectedTrainDetail[];
  recommendedSlot?: string;
  resolutionNotes?: string;
  sourceType?: "complaint" | "service_request";
  custodyOfficer?: CustodyOfficerInfo;
  schedulingConflict?: SchedulingConflictInfo;
}

export interface AffectedTrain {
  name: string;
  status: "Rescheduled" | "Regulated" | "Cancelled";
  color: "secondary" | "error" | "primary" | "warning";
}

export interface WhySlotDetail {
  id: string;
  slotCode: string;
  priority: "High Priority" | "Routine" | "Medium";
  timeWindow: string;
  scheduledDate?: string;
  scheduledDateFormatted?: string;
  location: string;
  score: number;
  confidence: string;
  trainsAffectedCount: number;
  trainsAffectedList: AffectedTrain[];
  savedMinutes: number;
  wastedMinutes: number;
  netGainMinutes: number;
  travelerImpactLevel: "Low" | "Moderate" | "High" | "Critical";
  travelerImpactText: string;
  justificationParagraphs: string[];
  status: "pending" | "approved" | "rejected";
  isCluster?: boolean;
  clusterId?: string;
  departments?: string[];
  departmentLabel?: string;
  complaintIds?: string[];
  combinedTasks?: Array<{
    title: string;
    department: string;
    priority?: string;
    complaintId?: string;
  }>;
}

export interface WhatIfSimulationResult {
  telemetry: {
    cascadingDelayTotal: number;
    forcedCancellations: number;
    estSystemRecovery: string;
    impactRadiusStations: number;
  };
  cancellations: Array<{
    trainNo: string;
    depTime: string;
    status: string;
    reason: string;
  }>;
  delays: Array<{
    trainNo: string;
    location: string;
    scheduledTime: string;
    simulatedTime: string;
    delta: string;
    severity: "high" | "medium" | "low";
  }>;
  aiAnalysis?: string;
}

export interface InterventionLog {
  id: string;
  dbId?: string;
  timeUTC: string;
  date?: string;
  timestamp?: number;
  sectorNode: string;
  type: "Path Conflict" | "Signal Optimization" | "Emergency Block" | "Speed Restriction Clearance" | string;
  timeRecovered: string;
  department?: string;
  description?: string;
  status?: string;
}

export interface ChartDataPoint {
  label: string;
  fullDate: string;
  manual: number;
  ai: number;
  savedHours: number;
}

export interface TrackStatsMetricItem {
  value: string;
  delta?: string;
  deltaColor?: string;
  badge?: string;
  badgeBg?: string;
  subBadge?: string;
  subBadgeColor?: string;
  context: string;
  subDetail: string;
}

export interface TrackStatsBenchmarkItem {
  ai?: string;
  manual?: string;
  pctReduction?: string;
  rate?: string;
  manualRate?: string;
  aiRate?: string;
  detail?: string;
  barPct: number;
}

export interface TrackStatsMetrics {
  dateRangeLabel: string;
  periodSubtitle: string;
  punctuality: TrackStatsMetricItem;
  timeRecovered: TrackStatsMetricItem;
  conflictsResolved: TrackStatsMetricItem;
  trackUtilization: TrackStatsMetricItem;
  chartAvgGain: string;
  chartNetSaved: string;
  benchmarks: {
    conflictLatency: TrackStatsBenchmarkItem;
    clusteringRate: TrackStatsBenchmarkItem;
    punctualityProtection: TrackStatsBenchmarkItem;
    divisionSummary: string;
  };
}

export interface TrackStatsTelemetryResponse {
  success: boolean;
  timeRange: string;
  metrics7D: TrackStatsMetrics;
  metrics30D: TrackStatsMetrics;
  chartData7D: ChartDataPoint[];
  chartData30D: ChartDataPoint[];
  interventions7D: InterventionLog[];
  interventions30D: InterventionLog[];
  telemetry?: {
    totalComplaints: number;
    totalTrainRuns: number;
    totalApprovedBlocks: number;
    totalServiceRequests: number;
    lastUpdated: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  empId: string;
  department: DepartmentType;
  role: string;
  userRole: UserRole;
  avatarUrl: string;
  isLoggedIn: boolean;
  authProvider?: "google" | "railway_sso";
  reports_to?: string | null;
  reportingTo?: {
    id?: string;
    name: string;
    role: string;
    empId: string;
    phone?: string;
    designation?: string;
    depot?: string;
  } | null;
}

export interface PravahSlotNotification {
  id: string;
  slotId: string;
  slotCode: string;
  title: string;
  message: string;
  timing: string;
  startTime: string;
  endTime: string;
  date: string;
  location: string;
  workName: string;
  departments: string[];
  recipientRoles: UserRole[];
  recipientDepts: string[];
  createdAt: string;
  sanctionedBy: string;
  status: "active" | "acknowledged";
  readByRoles?: UserRole[];
}

export interface GangRosterMember {
  emp_id: string;
  name: string;
  designation: string;
  status: "Present" | "On Duty" | "Leave" | "Rest";
  contact?: string;
}

export interface SectionFieldGroup {
  id: string;
  gang_code: string;
  name: string;
  department: DepartmentType;
  section_division: string;
  mate_name: string;
  mate_contact?: string;
  total_strength: number;
  on_duty_count: number;
  beat_location: string;
  operational_status: "on_patrol" | "possession_work" | "turnout_maintenance" | "standby" | "off_duty";
  shift_name: string;
  assigned_slot_id?: string | null;
  roster_members: GangRosterMember[];
  created_at?: string;
  updated_at?: string;
}

export interface CautionOrder {
  id: string;
  order_no: string;
  section_location: string;
  track_line: string;
  imposed_speed: string;
  reason: string;
  status: "active" | "revocation_review" | "cancelled";
  department: DepartmentType;
  imposed_at?: string;
  created_at?: string;
  updated_at?: string;
}


