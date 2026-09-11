import { Router } from 'express';
import {
  getFieldGroups,
  createFieldGroup,
  updateFieldGroup,
  getCautionOrders,
  createCautionOrder,
  updateCautionOrder,
} from '../controllers/supervisor.controller.js';

const router = Router();

// Field Groups & Staff Rosters
router.get('/field-groups', getFieldGroups);
router.post('/field-groups', createFieldGroup);
router.put('/field-groups/:id', updateFieldGroup);
router.patch('/field-groups/:id', updateFieldGroup);

// Caution Orders & Patrol
router.get('/caution-orders', getCautionOrders);
router.post('/caution-orders', createCautionOrder);
router.put('/caution-orders/:id', updateCautionOrder);
router.patch('/caution-orders/:id', updateCautionOrder);

export default router;
