/**
 * Worker Controller
 * Worker issue reporting endpoint for the RAIL_PRAVAH_FRONTEND.
 */
import { Request, Response } from 'express';
import { coaFrontendStore } from '../db/coa-frontend-store.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getValidProfileId } from '../services/profile-lookup.js';

/** POST /worker/report-issue */
export const reportIssue = (req: Request, res: Response): void => {
  const issue = req.body;
  if (!issue || !issue.description) {
    res.status(400).json({ error: 'Missing required issue data or description' });
    return;
  }

  const validPriority =
    issue.priority === 'Emergency' || issue.priority === 'High' ||
    issue.priority === 'Medium' || issue.priority === 'Low'
      ? issue.priority
      : 'High';

  const newReq = {
    id: `req-wrk-${Date.now()}`,
    department: `${issue.department || 'Engineering'} Department`,
    trackArea: issue.location?.address || 'Dadar - Matunga Junction',
    description: `[Field Worker Log]: ${issue.description}`,
    priority: validPriority as 'High' | 'Low' | 'Medium' | 'Emergency',
    preferredSlot: 'Immediate / Next Available Night Window',
    status: 'Pending' as const,
    createdAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    workType: `${issue.department || 'Track'} Repair & Defect Clearance`,
    submittedBy: issue.reportedBy?.name || 'Field Maintainer Gang #12',
  };

  coaFrontendStore.requests.unshift(newReq);

  res.json({
    success: true,
    ticketNo: issue.ticketNo || `CR-WRK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    assignedSupervisor: issue.assignedSupervisor,
    status: 'Reported & Transmitted to Section Supervisor',
  });
};
