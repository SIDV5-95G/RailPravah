import { Router } from 'express';
import {
  listIssues,
  getIssueById,
  createIssue,
  editIssue,
  updateIssuePriority,
  escalateIssue,
  resolveIssue,
  addRemarks,
} from '../controllers/issue.controller.js';

const router = Router();

// GET /issues — Role-filtered list
router.get('/', listIssues);

// GET /issues/:id — Single issue with audit trail
router.get('/:id', getIssueById);

// POST /issues — Worker creates a new issue
router.post('/', createIssue);

// PATCH /issues/:id/priority — Dedicated priority update for hierarchy roles
router.patch('/:id/priority', updateIssuePriority);
router.post('/:id/priority', updateIssuePriority);

// PUT & POST & PATCH /issues/:id/edit — Edit active request (hierarchy only)
router.put('/:id/edit', editIssue);
router.post('/:id/edit', editIssue);
router.patch('/:id', editIssue);

// POST /issues/:id/escalate — Stepwise escalation
router.post('/:id/escalate', escalateIssue);

// POST /issues/:id/resolve — Mark resolved
router.post('/:id/resolve', resolveIssue);

// POST /issues/:id/add-remarks & /issues/:id/remarks — Add technical remarks
router.post('/:id/add-remarks', addRemarks);
router.post('/:id/remarks', addRemarks);

export default router;
