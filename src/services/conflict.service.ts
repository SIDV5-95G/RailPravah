import { ConflictFlag, ServiceRequest } from '../types/database.types.js';

export class ConflictGuardService {
  /**
   * Check for operational and physical conflicts on a maintenance block or proposal
   */
  async checkConflicts(
    section: string,
    windowStart: string,
    windowEnd: string,
    requests: ServiceRequest[] = []
  ): Promise<ConflictFlag[]> {
    const flags: ConflictFlag[] = [];

    const depts = new Set(requests.map((r) => r.department));

    // Rule 1: Electrical OHE power isolation requires safety clearance with track machines
    if (depts.has('electrical') && depts.has('civil')) {
      flags.push({
        id: `conf-${Date.now()}-1`,
        section,
        conflict_type: 'ohe_traction_power_permit_to_work',
        severity: 'medium',
        details:
          'TRD traction power isolation must be verified earthed prior to heavy Civil track tamping machine deployment.',
        created_at: new Date().toISOString(),
      });
    }

    // Rule 2: Check for S&T axle counter calibration during ballast cleaning
    if (depts.has('civil') && depts.has('signal_comm')) {
      flags.push({
        id: `conf-${Date.now()}-2`,
        section,
        conflict_type: 'signal_interlock_caution',
        severity: 'low',
        details:
          'Axle counter sensors must be clamped and insulated during tamping; auto-reconnection test required before block clearance.',
        created_at: new Date().toISOString(),
      });
    }

    // Rule 3: Single line / Down line block duration check (>4 hours is high risk)
    const durationHours =
      (new Date(windowEnd).getTime() - new Date(windowStart).getTime()) / (1000 * 3600);

    if (durationHours > 4.5) {
      flags.push({
        id: `conf-${Date.now()}-3`,
        section,
        conflict_type: 'extended_block_bottleneck',
        severity: 'high',
        details: `Requested block length (${durationHours.toFixed(1)}h) exceeds standard 4-hour window, risking freight backlog accumulation on adjacent division loops.`,
        created_at: new Date().toISOString(),
      });
    }

    return flags;
  }
}

export const conflictGuardService = new ConflictGuardService();
