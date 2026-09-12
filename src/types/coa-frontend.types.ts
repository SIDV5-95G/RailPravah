/**
 * Frontend-compatible types for COA Management, Hierarchical Issues,
 * and PravahPlan Slot Notifications.
 * These mirror the data shapes expected by the RAIL_PRAVAH_FRONTEND.
 */

export type PriorityType = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface CoaServiceRequest {
  id: string;
  department: string;
  trackArea: string;
  taskName?: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  preferredSlot: string;
  status: 'Pending' | 'Scheduled' | 'Rejected' | 'In Progress' | 'Completed' | 'Approved' | 'Declined';
  createdAt: string;
  cluster_id?: string | null;
  workType?: string;
  declineReason?: string;
  departmentActionStatus?: 'awaiting' | 'confirmed' | 'flagged';
  flagReason?: string;
  assignedSlot?: string;
  submittedBy?: string;
}

export interface CoaCalendarBlock {
  id: string;
  title: string;
  station: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency' | 'Critical';
  status: 'approved' | 'pending' | 'conflict' | 'emergency';
  description: string;
  slotCode?: string;
  clusterId?: string;
  isClustered?: boolean;
  isCluster?: boolean;
  departments?: string[];
  taskName?: string;
  machineryGangs?: string;
  cautionOrder?: string;
  timeSlot?: string;
  periodLabel?: string;
  trainsAffected?: number;
}

export interface CoaRecommendation {
  id: string;
  cluster_id?: string;
  isClustered: boolean;
  stations: string[];
  station_text: string;
  proposed_slot: string;
  slot_window: string;
  priority_tier: 'Low' | 'Medium' | 'High' | 'Emergency';
  trains_affected_clustered: number;
  trains_affected_individual_sum: number;
  trains_saved_count: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'sent_to_departments' | 'confirmed';
  coa_reviewer_id?: string;
  decision_notes?: string;
  departments: string[];
  request_ids: string[];
  plain_language_reason: string;
  safety_check_passed: boolean;
  safety_notes?: string;
  departmentConfirmations?: Record<
    string,
    { status: 'confirmed' | 'flagged' | 'awaiting'; note?: string; time?: string }
  >;
  createdAt: string;
}

export type IssueLifecycleStatus =
  | 'Reported'
  | 'Under Supervisor Review'
  | 'Resolved by Supervisor'
  | 'Escalated to Zonal Head'
  | 'Under Zonal Review'
  | 'Resolved by Zonal Head'
  | 'Escalated to Department Head'
  | 'Under Department Review'
  | 'Resolved by Department Head'
  | 'Escalated to COA'
  | 'Under COA Review'
  | 'Sanctioned by COA'
  | 'Resolved / Closed';

export interface IssueModificationRecord {
  id: string;
  level: string;
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
  department: string;
  station: string;
  trackSection: string;
  nearestKmPost: string;
  lineType: string;
  coordinates: { lat: number; lng: number };
  description: string;
  voiceTranscript?: string;
  priority: string;
  estimatedFixTimeMinutes: number;
  media: any[];
  technicalNotes?: string;
  hazardCategory?: string;
}

export interface HierarchicalIssue {
  id: string;
  ticketNo: string;
  currentStatus: IssueLifecycleStatus;
  originalRequest: IssueSnapshot & {
    reportedBy: {
      name: string;
      empId: string;
      phone: string;
      gangNo?: string;
    };
    reportedAt: string;
  };
  activeRequest: IssueSnapshot;
  station: string;
  zone: string;
  department: string;
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
  escalatedToZonalAt?: string;
  zonalEscalationReason?: string;
  zonalRemarks?: string;
  escalatedToDeptAt?: string;
  deptEscalationReason?: string;
  deptRemarks?: string;
  escalatedToCoaAt?: string;
  coaEscalationReason?: string;
  coaRemarks?: string;
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    empId: string;
    level: string;
  };
  resolutionDetails?: string;
  modificationHistory: IssueModificationRecord[];
  escalationHistory?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SlotNotification {
  id: string;
  slotId?: string;
  slotCode?: string;
  title: string;
  message: string;
  timing?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  location?: string;
  workName?: string;
  departments?: string[];
  recipientRoles?: string[];
  recipientDepts?: string[];
  createdAt: string;
  sanctionedBy?: string;
  status: 'active' | 'acknowledged';
  // Allow any extra fields from frontend
  [key: string]: any;
}
