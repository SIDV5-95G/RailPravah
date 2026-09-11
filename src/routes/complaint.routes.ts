import { Router } from 'express';
import {
  createComplaint,
  editDraft,
  escalateComplaint,
  resolveComplaint,
  getComplaintById,
  listComplaints,
} from '../controllers/complaint.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import {
  forbidDirectStatusMutation,
  requireRoles,
} from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateUser);

// POST /complaints — Worker creates complaint -> auto open_supervisor
router.post('/', requireRoles(['worker']), createComplaint);

// PATCH /complaints/:id — Edit draft
// Writable by Supervisor-and-above, never Worker author, never touches status field
router.patch(
  '/:id',
  requireRoles(['supervisor', 'zonal_head', 'department_head', 'coa_admin']),
  forbidDirectStatusMutation,
  editDraft
);

// POST /complaints/:id/escalate — Advances status to next level in chain
router.post(
  '/:id/escalate',
  requireRoles(['supervisor', 'zonal_head', 'department_head']),
  escalateComplaint
);

// POST /complaints/:id/resolve — Sets status to closed
router.post('/:id/resolve', resolveComplaint);

// GET /complaints/:id — Read-only global visibility of complaint status & audit logs
router.get('/:id', getComplaintById);

// GET /complaints — Read-only list
router.get('/', listComplaints);

export default router;
