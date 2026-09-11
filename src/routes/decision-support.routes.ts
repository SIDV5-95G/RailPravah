import { Router } from 'express';
import {
  getConflicts,
  getTrackStats,
} from '../controllers/decision-support.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// TrackStats: GET /stats/tracks?section=&period=
// Allowed: Supervisor, Zonal Head, Department Head, COA Admin (Worker is blocked)
router.get(
  '/stats/tracks',
  authenticateUser,
  requireRoles(['supervisor', 'zonal_head', 'department_head', 'coa_admin']),
  getTrackStats
);

// ConflictGuard: GET /blocks/:id/conflicts
// Allowed: Supervisor, Zonal Head, Department Head, COA Admin (Worker is blocked)
router.get(
  '/blocks/:id/conflicts',
  authenticateUser,
  requireRoles(['supervisor', 'zonal_head', 'department_head', 'coa_admin']),
  getConflicts
);

export default router;
