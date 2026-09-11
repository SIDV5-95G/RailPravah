import { Request, Response, NextFunction } from 'express';
import { inMemoryStore } from '../db/in-memory-store.js';
import { aiOptimizerService } from '../services/ai-optimizer.service.js';
import { notificationAndBlockService } from '../services/notification.service.js';
import { AIScheduleProposal, ServiceRequest } from '../types/database.types.js';
import { randomUUID } from 'crypto';

/**
 * GET /coa/pending-requests?overlapping=true
 * Groups pending requests across departments whose requested_windows overlap
 */
export const getPendingRequests = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const overlappingOnly = req.query.overlapping === 'true';

    const pending = Array.from(inMemoryStore.serviceRequests.values()).filter(
      (r) => r.status === 'pending'
    );

    if (!overlappingOnly) {
      res.json({ total: pending.length, requests: pending });
      return;
    }

    // Group overlapping requests by section
    const groupedBySection: Record<string, ServiceRequest[]> = {};
    for (const reqItem of pending) {
      if (!groupedBySection[reqItem.asset_section]) {
        groupedBySection[reqItem.asset_section] = [];
      }
      groupedBySection[reqItem.asset_section].push(reqItem);
    }

    const clusters: Array<{
      section: string;
      departments_present: string[];
      has_overlap: boolean;
      requests: ServiceRequest[];
    }> = [];

    for (const [section, reqList] of Object.entries(groupedBySection)) {
      // Check if any windows overlap
      let hasOverlap = false;
      for (let i = 0; i < reqList.length; i++) {
        for (let j = i + 1; j < reqList.length; j++) {
          const startA = new Date(reqList[i].requested_start).getTime();
          const endA = new Date(reqList[i].requested_end).getTime();
          const startB = new Date(reqList[j].requested_start).getTime();
          const endB = new Date(reqList[j].requested_end).getTime();

          if (startA < endB && startB < endA) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      clusters.push({
        section,
        departments_present: Array.from(new Set(reqList.map((r) => r.department))),
        has_overlap: hasOverlap,
        requests: reqList,
      });
    }

    res.json({
      total_sections: clusters.length,
      clusters,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /coa/schedule/optimize
 * Triggers the AI optimizer against the aggregated request set;
 * returns an AIScheduleProposal with proposed_window, linked_requests[], and why_this_slot_explanation.
 * Status: pending_review.
 */
export const optimizeSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { section, request_ids } = req.body;

    let targetRequests: ServiceRequest[] = [];

    if (Array.isArray(request_ids) && request_ids.length > 0) {
      targetRequests = request_ids
        .map((id) => inMemoryStore.serviceRequests.get(id))
        .filter((r): r is ServiceRequest => Boolean(r && r.status === 'pending'));
    } else if (section) {
      targetRequests = Array.from(inMemoryStore.serviceRequests.values()).filter(
        (r) => r.asset_section === section && r.status === 'pending'
      );
    } else {
      // All pending
      targetRequests = Array.from(inMemoryStore.serviceRequests.values()).filter(
        (r) => r.status === 'pending'
      );
    }

    if (targetRequests.length === 0) {
      res.status(400).json({
        error: 'No eligible pending requests found to optimize for the specified parameters.',
      });
      return;
    }

    // Run AI block optimization
    const aiResult = await aiOptimizerService.optimize(targetRequests);

    // Create new proposal record
    const proposal: AIScheduleProposal = {
      id: randomUUID(),
      proposed_start: aiResult.proposed_start,
      proposed_end: aiResult.proposed_end,
      linked_requests: aiResult.linked_requests,
      why_this_slot_explanation: aiResult.why_this_slot_explanation,
      impact_metrics: aiResult.impact_metrics,
      status: 'pending_review',
      decided_at: null,
      decided_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.scheduleProposals.set(proposal.id, proposal);

    // Update status of linked requests to 'linked'
    for (const reqId of proposal.linked_requests) {
      const r = inMemoryStore.serviceRequests.get(reqId);
      if (r) {
        r.status = 'linked';
        inMemoryStore.serviceRequests.set(r.id, r);
      }
    }

    res.status(201).json({
      message: 'AI Schedule proposal generated and pending COA review.',
      proposal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /coa/schedule/:id/decision
 * Body: { decision: "accept" | "reject" }
 */
export const decisionSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (decision !== 'accept' && decision !== 'reject') {
      res.status(400).json({
        error: "Invalid decision. Body must contain { decision: 'accept' | 'reject' }.",
      });
      return;
    }

    const result = await notificationAndBlockService.handleProposalDecision(
      id,
      decision,
      req.user!
    );

    res.json({
      message: `Schedule proposal has been ${decision}ed successfully.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /coa/proposals
 * List all proposals
 */
export const getProposals = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const proposals = Array.from(inMemoryStore.scheduleProposals.values());
    res.json({ total: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /coa/generate-plan (or /coa/generate-recommendations)
 * Generates AI-clustered multi-department maintenance recommendations
 */
export const generatePlan = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const pending = Array.from(inMemoryStore.serviceRequests.values()).map((r) => ({
      id: r.id,
      department: r.department,
      trackArea: r.asset_section,
      description: r.description,
      priority: (r.urgency === 'emergency'
        ? 'Emergency'
        : r.urgency === 'high'
        ? 'High'
        : r.urgency === 'low'
        ? 'Low'
        : 'Medium') as 'Low' | 'Medium' | 'High' | 'Emergency',
      status: r.status === 'pending' ? 'Pending' : r.status,
      createdAt: r.created_at || new Date().toISOString(),
      workType: r.description,
    }));

    const plan = aiOptimizerService.generatePlan(pending);
    res.json({
      success: true,
      count: plan.recommendations.length,
      recommendations: plan.recommendations,
      summary: plan.summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /coa/recommendations
 */
export const getRecommendations = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const pending = Array.from(inMemoryStore.serviceRequests.values()).map((r) => ({
      id: r.id,
      department: r.department,
      trackArea: r.asset_section,
      description: r.description,
      priority: (r.urgency === 'emergency'
        ? 'Emergency'
        : r.urgency === 'high'
        ? 'High'
        : r.urgency === 'low'
        ? 'Low'
        : 'Medium') as 'Low' | 'Medium' | 'High' | 'Emergency',
      status: r.status === 'pending' ? 'Pending' : r.status,
      createdAt: r.created_at || new Date().toISOString(),
      workType: r.description,
    }));

    const plan = aiOptimizerService.generatePlan(pending);
    res.json({
      success: true,
      recommendations: plan.recommendations,
    });
  } catch (err) {
    next(err);
  }
};

