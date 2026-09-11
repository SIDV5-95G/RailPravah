import { Router } from 'express';
import {
  getPendingRequests,
  optimizeSchedule,
  decisionSchedule,
  getProposals,
  generatePlan,
  getRecommendations,
} from '../controllers/coa.controller.js';
import {
  getWhyThisSlot,
  simulateWhatIf,
} from '../controllers/decision-support.controller.js';
import {
  getCalendar,
  getPendingRequestsLegacy,
  approveSingleRequest,
  declineSingleRequest,
  generateRecommendationsFrontend,
  getRecommendationsFrontend,
  approveRecommendation,
  rejectRecommendation,
  sendRecommendation,
  departmentAction,
  acceptSlot,
  getWhySlotProposals,
  approveWhySlotProposal,
  rejectWhySlotProposal,
  getCorridorStatusOverview,
  getConflictUrgencyQueue,
  resolveConflictQueueItem,
  getTrackStatsTelemetry,
} from '../controllers/coa-frontend.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// ─── Frontend-compatible endpoints (no auth middleware — frontend uses headers) ───
// These match the exact paths the RAIL_PRAVAH_FRONTEND expects.

// GET /coa/conflict-queue — Real-Time Urgency Resolution Queue & Scheduling Conflict Prevention
router.get('/conflict-queue', getConflictUrgencyQueue);

// GET /coa/track-stats — Real-Time & Historical Performance Telemetry
router.get('/track-stats', getTrackStatsTelemetry);

// POST /coa/conflict-queue/:id/resolve
router.post('/conflict-queue/:id/resolve', resolveConflictQueueItem);
router.post('/conflict-queue/:id/prevent', resolveConflictQueueItem);

// GET /coa/corridors — Dynamic Central Line Corridor Status
router.get('/corridors', getCorridorStatusOverview);

// GET /coa/calendar?month=&year=
router.get('/calendar', getCalendar);

// GET /coa/requests & /coa/requests/pending
router.get('/requests/pending', getPendingRequestsLegacy);
router.get('/requests', getPendingRequestsLegacy);

// GET /coa/whyslot-proposals
router.get('/whyslot-proposals', getWhySlotProposals);

// POST /coa/whyslot-proposals/:id/approve
router.post('/whyslot-proposals/:id/approve', approveWhySlotProposal);

// POST /coa/whyslot-proposals/:id/reject
router.post('/whyslot-proposals/:id/reject', rejectWhySlotProposal);

// POST /coa/requests/:id/approve
router.post('/requests/:id/approve', approveSingleRequest);

// POST /coa/requests/:id/decline
router.post('/requests/:id/decline', declineSingleRequest);

// POST /coa/requests/:id/department-action
router.post('/requests/:id/department-action', departmentAction);

// POST /coa/departments/:name/action
router.post('/departments/:name/action', departmentAction);

// POST /coa/generate-recommendations (frontend-compatible clustering)
router.post('/generate-recommendations', generateRecommendationsFrontend);

// GET /coa/recommendations (frontend-compatible)
router.get('/recommendations', getRecommendationsFrontend);

// POST /coa/recommendations/:id/approve
router.post('/recommendations/:id/approve', approveRecommendation);

// POST /coa/recommendations/:id/reject
router.post('/recommendations/:id/reject', rejectRecommendation);

// POST /coa/recommendations/:id/send
router.post('/recommendations/:id/send', sendRecommendation);

// POST /coa/recommendations/:id/department-action
router.post('/recommendations/:id/department-action', departmentAction);

// POST /coa/slots/accept and /coa/slot/accept — PravahPlan slot accept
router.post('/slots/accept', acceptSlot);
router.post('/slot/accept', acceptSlot);

// ─── Original authenticated API endpoints ────────────────────────────────────
router.use(authenticateUser);

// GET /coa/pending-requests?overlapping=true
router.get('/pending-requests', requireRoles(['coa_admin']), getPendingRequests);

// POST /coa/schedule/optimize
router.post('/schedule/optimize', requireRoles(['coa_admin']), optimizeSchedule);

// POST /coa/schedule/:id/decision
router.post('/schedule/:id/decision', requireRoles(['coa_admin']), decisionSchedule);

// GET /coa/proposals
router.get('/proposals', requireRoles(['coa_admin']), getProposals);

// POST /coa/generate-plan
router.post('/generate-plan', requireRoles(['coa_admin']), generatePlan);

// Decision-Support Endpoints
router.get(
  '/schedule/:id/why-this-slot',
  requireRoles(['zonal_head', 'department_head', 'coa_admin']),
  getWhyThisSlot
);

router.post(
  '/schedule/:id/simulate',
  requireRoles(['zonal_head', 'department_head', 'coa_admin']),
  simulateWhatIf
);

export default router;
