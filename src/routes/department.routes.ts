import { Router } from 'express';
import {
  getJointClearances,
  updateJointClearanceStatus,
  getSanctionedBlocks,
} from '../controllers/department.controller.js';

const router = Router();

// GET /api/department/joint-clearances
router.get('/joint-clearances', getJointClearances);

// POST /api/department/joint-clearances/:department/status
router.post('/joint-clearances/:department/status', updateJointClearanceStatus);

// GET /api/department/sanctioned-blocks
router.get('/sanctioned-blocks', getSanctionedBlocks);

export default router;
