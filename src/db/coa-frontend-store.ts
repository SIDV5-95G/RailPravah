/**
 * Frontend-compatible data store for COA Management, Calendar, Issues, and Notifications.
 * This complements the existing in-memory-store.ts with data shapes the frontend expects.
 */
import {
  CoaServiceRequest,
  CoaCalendarBlock,
  CoaRecommendation,
  HierarchicalIssue,
  SlotNotification,
} from '../types/coa-frontend.types.js';

import {
  SEED_COA_REQUESTS,
  SEED_CALENDAR_BLOCKS,
  SEED_RECOMMENDATIONS,
  SEED_HIERARCHICAL_ISSUES,
  SEED_NOTIFICATIONS,
} from './coa-seed-data.js';

class CoaFrontendStore {
  requests: CoaServiceRequest[] = [];
  calendarBlocks: CoaCalendarBlock[] = [];
  recommendations: CoaRecommendation[] = [];
  hierarchicalIssues: HierarchicalIssue[] = [];
  slotNotifications: SlotNotification[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.requests = [];
    this.calendarBlocks = [];
    this.recommendations = [];
    this.hierarchicalIssues = [];
    this.slotNotifications = [];
  }
}

export const coaFrontendStore = new CoaFrontendStore();
