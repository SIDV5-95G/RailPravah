export type UserRole = 'worker' | 'supervisor' | 'zonal_head' | 'department_head' | 'coa_admin';
export type DepartmentType = 'civil' | 'electrical' | 'signal_comm';
export type ServiceRequestStatus = 'pending' | 'linked' | 'fulfilled' | 'cancelled';
export type ProposalStatus = 'pending_review' | 'accepted' | 'rejected';
export type ComplaintStatus = 'open_supervisor' | 'open_zonal_head' | 'open_department_head' | 'open_coa' | 'closed';

export interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  role: UserRole;
  department: DepartmentType | null;
  reports_to?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceRequest {
  id: string;
  raised_by: string;
  department: DepartmentType;
  asset_section: string;
  requested_start: string;
  requested_end: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  status: ServiceRequestStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AIScheduleProposal {
  id: string;
  proposed_start: string;
  proposed_end: string;
  linked_requests: string[];
  why_this_slot_explanation: string;
  impact_metrics?: Record<string, any>;
  status: ProposalStatus;
  decided_at?: string | null;
  decided_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovedBlock {
  id: string;
  schedule_id: string;
  asset_section: string;
  start_time: string;
  end_time: string;
  involved_users: string[];
  calendar_event_ids: string[];
  status?: string;
  created_at?: string;
}

export interface Complaint {
  id: string;
  raised_by: string;
  department: DepartmentType;
  description: string;
  photo_url?: string | null;
  status: ComplaintStatus;
  current_assignee?: string | null;
  last_edited_by?: string | null;
  last_edited_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ComplaintAuditLog {
  id: string;
  complaint_id: string;
  actor_id: string;
  action: 'created' | 'draft_edit' | 'escalated' | 'resolved';
  previous_status?: ComplaintStatus | null;
  new_status?: ComplaintStatus | null;
  notes?: string | null;
  created_at?: string;
}

export interface TrackStat {
  id: string;
  section: string;
  time_period: string;
  delay_metrics: Record<string, any>;
  congestion_index: number;
  average_train_speed: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConflictFlag {
  id: string;
  block_id?: string | null;
  request_id?: string | null;
  section: string;
  conflict_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  block_id: string;
  title: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

export interface TrainSchedule {
  id: string;
  train_no: string;
  train_name: string;
  service_type: 'slow_local' | 'fast_local' | 'mail_express' | 'freight';
  direction: 'UP' | 'DOWN';
  corridor_section: string;
  station: string;
  line_type: string;
  scheduled_slot: string; // HH:MM
  destination: string;
  origin: string;
  frequency_minutes?: number;
  priority_tier: number; // 1 = Rajdhani/Vande Bharat, 2 = Fast Local, 3 = Slow Local, 4 = Freight
  created_at?: string;
  updated_at?: string;
}

export interface GangRosterMember {
  emp_id: string;
  name: string;
  designation: string;
  status: 'Present' | 'On Duty' | 'Leave' | 'Rest';
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
  operational_status: 'on_patrol' | 'possession_work' | 'turnout_maintenance' | 'standby' | 'off_duty';
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
  status: 'active' | 'revocation_review' | 'cancelled';
  department: DepartmentType;
  imposed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<UserProfile>;
      };
      service_requests: {
        Row: ServiceRequest;
        Insert: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ServiceRequest>;
      };
      ai_schedule_proposals: {
        Row: AIScheduleProposal;
        Insert: Omit<AIScheduleProposal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<AIScheduleProposal>;
      };
      approved_blocks: {
        Row: ApprovedBlock;
        Insert: Omit<ApprovedBlock, 'id' | 'created_at'>;
        Update: Partial<ApprovedBlock>;
      };
      complaints: {
        Row: Complaint;
        Insert: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Complaint>;
      };
      complaint_audit_logs: {
        Row: ComplaintAuditLog;
        Insert: Omit<ComplaintAuditLog, 'id' | 'created_at'>;
        Update: Partial<ComplaintAuditLog>;
      };
      track_stats: {
        Row: TrackStat;
        Insert: Omit<TrackStat, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<TrackStat>;
      };
      conflict_flags: {
        Row: ConflictFlag;
        Insert: Omit<ConflictFlag, 'id' | 'created_at'>;
        Update: Partial<ConflictFlag>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, 'id' | 'created_at'>;
        Update: Partial<CalendarEvent>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Notification>;
      };
      train_schedules: {
        Row: TrainSchedule;
        Insert: Omit<TrainSchedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<TrainSchedule>;
      };
      section_field_groups: {
        Row: SectionFieldGroup;
        Insert: Omit<SectionFieldGroup, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<SectionFieldGroup>;
      };
      caution_orders: {
        Row: CautionOrder;
        Insert: Omit<CautionOrder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<CautionOrder>;
      };
    };
  };
}
