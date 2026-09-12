import {
  UserProfile,
  ServiceRequest,
  AIScheduleProposal,
  ApprovedBlock,
  Complaint,
  ComplaintAuditLog,
  TrackStat,
  ConflictFlag,
  CalendarEvent,
  Notification,
  TrainSchedule,
} from '../types/database.types.js';
import { MOCK_USERS } from '../constants/roles.js';
import { INITIAL_TRAIN_SCHEDULES } from './train-seed-data.js';

class InMemoryStore {
  profiles: Map<string, UserProfile> = new Map();
  serviceRequests: Map<string, ServiceRequest> = new Map();
  scheduleProposals: Map<string, AIScheduleProposal> = new Map();
  approvedBlocks: Map<string, ApprovedBlock> = new Map();
  complaints: Map<string, Complaint> = new Map();
  complaintAuditLogs: ComplaintAuditLog[] = [];
  trackStats: Map<string, TrackStat> = new Map();
  conflictFlags: ConflictFlag[] = [];
  calendarEvents: CalendarEvent[] = [];
  notifications: Notification[] = [];
  trainSchedules: Map<string, TrainSchedule> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    // Seed Train Schedules
    for (const train of INITIAL_TRAIN_SCHEDULES) {
      this.trainSchedules.set(train.id, {
        ...train,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    // Seed Users
    for (const user of MOCK_USERS) {
      this.profiles.set(user.id, {
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Seed Sample Overlapping Service Requests on NDLS-GZB-DN
    const now = Date.now();
    const tomorrow1AM = new Date(now + 24 * 3600 * 1000);
    tomorrow1AM.setHours(1, 30, 0, 0);

    const tomorrow430AM = new Date(now + 24 * 3600 * 1000);
    tomorrow430AM.setHours(4, 30, 0, 0);

    const tomorrow2AM = new Date(now + 24 * 3600 * 1000);
    tomorrow2AM.setHours(2, 0, 0, 0);

    const tomorrow4AM = new Date(now + 24 * 3600 * 1000);
    tomorrow4AM.setHours(4, 0, 0, 0);

    const reqCivil: ServiceRequest = {
      id: '00000001-0000-0000-0000-000000000001',
      raised_by: 'c1000000-0000-0000-0000-000000000002', // Civil Zonal Head
      department: 'civil',
      asset_section: 'NDLS-GZB-DN',
      requested_start: tomorrow1AM.toISOString(),
      requested_end: tomorrow430AM.toISOString(),
      urgency: 'high',
      description: 'Deep screening and ballast packing on Down main line KM 12/4 to 14/8.',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const reqElec: ServiceRequest = {
      id: '00000001-0000-0000-0000-000000000002',
      raised_by: 'e2000000-0000-0000-0000-000000000002', // Electrical Zonal Head
      department: 'electrical',
      asset_section: 'NDLS-GZB-DN',
      requested_start: tomorrow1AM.toISOString(),
      requested_end: tomorrow4AM.toISOString(),
      urgency: 'medium',
      description: 'OHE contact wire replacement and cantilever bracket overhaul on Section NDLS-GZB.',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const reqST: ServiceRequest = {
      id: '00000001-0000-0000-0000-000000000003',
      raised_by: 'd3000000-0000-0000-0000-000000000002', // S&T Zonal Head
      department: 'signal_comm',
      asset_section: 'NDLS-GZB-DN',
      requested_start: tomorrow2AM.toISOString(),
      requested_end: tomorrow4AM.toISOString(),
      urgency: 'high',
      description: 'Digital Axle Counter (DAC) sensor calibration and point machine motor testing.',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.serviceRequests.set(reqCivil.id, reqCivil);
    this.serviceRequests.set(reqElec.id, reqElec);
    this.serviceRequests.set(reqST.id, reqST);

    // Seed Track Stats
    const stat1: TrackStat = {
      id: 'stat-0001',
      section: 'NDLS-GZB-DN',
      time_period: 'last_30_days',
      delay_metrics: {
        passenger_trains_delayed: 14,
        avg_delay_minutes: 12.4,
        total_blocks_granted: 8,
        block_efficiency_pct: 92.1,
        freight_throughput_index: 0.88,
      },
      congestion_index: 1.45,
      average_train_speed: 72.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const stat2: TrackStat = {
      id: 'stat-0002',
      section: 'BCT-VR-UP',
      time_period: 'last_30_days',
      delay_metrics: {
        passenger_trains_delayed: 28,
        avg_delay_minutes: 8.7,
        total_blocks_granted: 15,
        block_efficiency_pct: 88.6,
        freight_throughput_index: 0.74,
      },
      congestion_index: 1.82,
      average_train_speed: 58.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.trackStats.set(`${stat1.section}_${stat1.time_period}`, stat1);
    this.trackStats.set(`${stat2.section}_${stat2.time_period}`, stat2);
  }
}

export const inMemoryStore = new InMemoryStore();
