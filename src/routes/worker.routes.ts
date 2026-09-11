import { Router } from 'express';
import { reportIssue } from '../controllers/worker.controller.js';

const router = Router();

// POST /worker/report-issue
router.post('/report-issue', reportIssue);

export default router;
