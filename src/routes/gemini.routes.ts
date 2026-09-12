import { Router, Request, Response, NextFunction } from 'express';
import { whatIfService } from '../services/what-if.service.js';
import { aiOptimizerService } from '../services/ai-optimizer.service.js';

const router = Router();

/**
 * POST /api/gemini/simulate-whatif, /api/ai/what-if, /api/gemini/what-if
 * What-If Delay Simulation Endpoint (Live Gemini AI / Fallback)
 * Matches updated Google AI Studio export
 */
const whatIfHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetBlock, delayMinutes, trackSector, section, duration } = req.body;
    const result = await whatIfService.runSimulation({
      targetBlock: targetBlock || section,
      delayMinutes: delayMinutes || duration,
      trackSector,
    });
    res.json({ ...result, result });
  } catch (err) {
    next(err);
  }
};

router.post('/simulate-whatif', whatIfHandler);
router.post('/what-if', whatIfHandler);
router.post('/whatif', whatIfHandler);

/**
 * POST /api/gemini/optimize-schedule, /api/ai/why-slot, /api/ai/optimize-schedule
 * AI Scheduler & Reasoning Optimization Endpoint (WhySlot / GapSense)
 * Matches updated Google AI Studio export
 */
const whySlotHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slotId, section, requestedTime, department, conflictReason } = req.body;
    const result = await aiOptimizerService.optimizeSlotWithReasoning({
      slotId,
      section,
      requestedTime,
      department,
      conflictReason,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

router.post('/optimize-schedule', whySlotHandler);
router.post('/why-slot', whySlotHandler);
router.post('/whyslot', whySlotHandler);

/**
 * POST /api/ai/schedule, /api/gemini/schedule
 * Aggregated schedule optimization
 */
router.post('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requests } = req.body;
    if (requests && Array.isArray(requests) && requests.length > 0) {
      const plan = aiOptimizerService.generatePlan(requests);
      res.json({ success: true, ...plan });
    } else {
      res.status(400).json({ success: false, error: 'No requests provided for scheduling' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
