import { Request, Response, NextFunction } from 'express';
import { inMemoryStore } from '../db/in-memory-store.js';
import { whatIfService } from '../services/what-if.service.js';
import { conflictGuardService } from '../services/conflict.service.js';
import { aiOptimizerService } from '../services/ai-optimizer.service.js';
import { ServiceRequest } from '../types/database.types.js';

/**
 * GET /coa/schedule/:id/why-this-slot
 * Access: Zonal Head, Department Head, COA Admin
 */
export const getWhyThisSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const proposal = inMemoryStore.scheduleProposals.get(id);

    if (!proposal) {
      res.status(404).json({ error: `Schedule proposal ${id} not found.` });
      return;
    }

    const linkedRequests: ServiceRequest[] = proposal.linked_requests
      .map((reqId) => inMemoryStore.serviceRequests.get(reqId))
      .filter((r): r is ServiceRequest => Boolean(r));

    const explanation = await aiOptimizerService.explainSlot(proposal, linkedRequests);

    res.json({
      schedule_id: proposal.id,
      proposed_window: {
        start: proposal.proposed_start,
        end: proposal.proposed_end,
      },
      why_this_slot_explanation: explanation,
      impact_metrics: proposal.impact_metrics,
      departments_co_located: Array.from(new Set(linkedRequests.map((r) => r.department))),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /coa/schedule/:id/simulate
 * What-If Simulator — accepts alternate parameters, returns comparative delay/impact projection
 * Access: Zonal Head, Department Head, COA Admin
 */
export const simulateWhatIf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const proposal = inMemoryStore.scheduleProposals.get(id);

    if (!proposal) {
      res.status(404).json({ error: `Schedule proposal ${id} not found.` });
      return;
    }

    const linkedRequests: ServiceRequest[] = proposal.linked_requests
      .map((reqId) => inMemoryStore.serviceRequests.get(reqId))
      .filter((r): r is ServiceRequest => Boolean(r));

    const { shift_minutes, duration_extension_minutes, decoupled_departments } = req.body;
    const targetSection = linkedRequests[0]?.asset_section || 'Central Line Corridor Mainline';

    const simulation = await whatIfService.runSimulation({
      targetBlock: targetSection,
      section: targetSection,
      delayMinutes: Number(duration_extension_minutes) || Number(shift_minutes) || 15,
      shift_minutes: Number(shift_minutes) || 0,
      duration_extension_minutes: Number(duration_extension_minutes) || 0,
      decoupled_departments,
    });

    res.json({
      schedule_id: proposal.id,
      simulation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /blocks/:id/conflicts
 * ConflictGuard
 * Access: Supervisor, Zonal Head, Department Head, COA Admin
 */
export const getConflicts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if it's an approved block or schedule proposal
    const block = inMemoryStore.approvedBlocks.get(id);
    const proposal = inMemoryStore.scheduleProposals.get(id);

    if (!block && !proposal) {
      res.status(404).json({ error: `Block or proposal ${id} not found.` });
      return;
    }

    const section = block ? block.asset_section : 'NDLS-GZB-DN';
    const start = block ? block.start_time : proposal!.proposed_start;
    const end = block ? block.end_time : proposal!.proposed_end;

    const linkedIds = proposal ? proposal.linked_requests : [];
    const requests = linkedIds
      .map((rId) => inMemoryStore.serviceRequests.get(rId))
      .filter((r): r is ServiceRequest => Boolean(r));

    const conflicts = await conflictGuardService.checkConflicts(section, start, end, requests);

    res.json({
      target_id: id,
      asset_section: section,
      conflict_count: conflicts.length,
      conflicts,
      status: conflicts.some((c) => c.severity === 'critical') ? 'critical_conflict' : 'clear_to_proceed',
    });
  } catch (err) {
    next(err);
  }
};

import { getTrackStatsTelemetry } from './coa-frontend.controller.js';

/**
 * GET /stats/tracks?section=&period=
 * TrackStats
 * Access: Supervisor, Zonal Head, Department Head, COA Admin
 */
export const getTrackStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return getTrackStatsTelemetry(req, res);
};
