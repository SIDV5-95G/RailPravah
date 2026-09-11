import { Request, Response, NextFunction } from 'express';
import { complaintStateMachineService } from '../services/complaint-state-machine.service.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';

/**
 * POST /complaints
 * Worker creates complaint {description, photo} -> status auto-set to open_supervisor
 */
export const createComplaint = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user!;
    const { description, photo_url } = req.body;

    if (!description) {
      res.status(400).json({ error: 'Description is required to submit a complaint.' });
      return;
    }

    const complaint = complaintStateMachineService.createComplaint(
      user,
      description,
      photo_url
    );

    res.status(201).json({
      message:
        'Complaint registered successfully and assigned to your supervisor for inspection.',
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /complaints/:id
 * Edit draft: description/photo/notes
 * Allowed for Supervisor-and-above, never Worker author, never touches status.
 */
export const editDraft = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { description, photo_url, notes } = req.body;

    const updated = complaintStateMachineService.editDraft(id, user, {
      description,
      photo_url,
      notes,
    });

    res.json({
      message: 'Complaint draft updated successfully.',
      complaint: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /complaints/:id/escalate
 * Advances status to next level in chain: Supervisor -> Zonal Head -> Department Head -> COA Admin
 */
export const escalateComplaint = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { reason } = req.body;

    const updated = complaintStateMachineService.escalate(id, user, reason);

    res.json({
      message: `Complaint escalated successfully to state '${updated.status}'.`,
      complaint: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /complaints/:id/resolve
 * Marks complaint as closed and records resolved_by + resolved_at
 */
export const resolveComplaint = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { resolution_notes } = req.body;

    const resolved = complaintStateMachineService.resolve(id, user, resolution_notes);

    if (isSupabaseConfigured() && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      supabaseAdmin.from('complaints').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase complaint delete error in resolveComplaint:', error.message);
        else console.log(`Complaint ${id} automatically deleted from Supabase.`);
      });
    }

    res.json({
      message: 'Complaint resolved and removed from database.',
      complaint: resolved,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /complaints/:id
 * Global read-only visibility for all authenticated roles
 */
export const getComplaintById = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { id } = req.params;
    const complaint = inMemoryStore.complaints.get(id);

    if (!complaint) {
      res.status(404).json({ error: `Complaint ${id} not found.` });
      return;
    }

    // Attach audit logs
    const logs = inMemoryStore.complaintAuditLogs.filter((l) => l.complaint_id === id);

    res.json({
      complaint,
      audit_trail: logs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /complaints
 * Lists complaints with global visibility
 */
export const listComplaints = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const complaints = Array.from(inMemoryStore.complaints.values());
    res.json({
      total: complaints.length,
      complaints,
    });
  } catch (err) {
    next(err);
  }
};
