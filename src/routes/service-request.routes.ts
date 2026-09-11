import { Router } from 'express';
import {
  createServiceRequest,
  getServiceRequests,
} from '../controllers/service-request.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateUser);

// POST /service-requests -> 403 for any role other than Zonal Head
router.post('/', requireRoles(['zonal_head']), createServiceRequest);

// GET /service-requests -> scoped to caller's department (or all for COA Admin)
router.get('/', getServiceRequests);

export default router;
