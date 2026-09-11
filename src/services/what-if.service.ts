import { getGeminiClient, getGeminiModelName, Type } from '../config/gemini.js';
import { AIScheduleProposal, ServiceRequest, TrainSchedule } from '../types/database.types.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';

export interface WhatIfSimulationParams {
  targetBlock?: string;
  delayMinutes?: number | string;
  trackSector?: string;
  section?: string;
  duration?: number | string;
  shift_minutes?: number;
  duration_extension_minutes?: number;
  decoupled_departments?: string[];
  notes?: string;
}

export interface WhatIfDelayItem {
  trainNo: string;
  location: string;
  scheduledTime: string;
  simulatedTime: string;
  delta: string;
  severity: string;
}

export interface WhatIfCancellationItem {
  trainNo: string;
  depTime: string;
  status: string;
  reason: string;
}

export interface WhatIfSimulationResult {
  success: boolean;
  source: string;
  telemetry: {
    cascadingDelayTotal: number;
    forcedCancellations: number;
    estSystemRecovery: string;
    impactRadiusStations: number;
  };
  cancellations: WhatIfCancellationItem[];
  delays: WhatIfDelayItem[];
  aiAnalysis: string;
  delta?: {
    delay_difference_minutes: number;
    risk_level: 'lower' | 'similar' | 'higher' | 'critical';
  };
  original?: {
    window_start: string;
    window_end: string;
    trains_delayed: number;
    cumulative_delay_minutes: number;
    passenger_impact_score: number;
  };
  simulated?: {
    window_start: string;
    window_end: string;
    trains_delayed: number;
    cumulative_delay_minutes: number;
    passenger_impact_score: number;
  };
  analysis_summary?: string;
  recommendations?: string[];
}

export class WhatIfService {
  /**
   * Helper: Retrieve real trains from database (Supabase or in-memory store) matching the target section
   */
  async getDatabaseTrainsForSection(targetBlock: string, trackSector?: string): Promise<TrainSchedule[]> {
    const searchTerms = `${targetBlock} ${trackSector || ''}`.toLowerCase();

    let allTrains: TrainSchedule[] = [];

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin.from('train_schedules').select('*');
        if (!error && data && data.length > 0) {
          allTrains = data as TrainSchedule[];
        }
      } catch (err) {
        console.warn('Could not query Supabase train_schedules, using in-memory store:', err);
      }
    }

    if (allTrains.length === 0) {
      allTrains = Array.from(inMemoryStore.trainSchedules.values());
    }

    // Filter relevant trains by section keywords
    const filtered = allTrains.filter((train) => {
      const trainStr = `${train.train_no} ${train.train_name} ${train.corridor_section} ${train.station} ${train.line_type}`.toLowerCase();
      return (
        searchTerms.includes(train.station.toLowerCase()) ||
        searchTerms.includes(train.corridor_section.toLowerCase()) ||
        trainStr.split(' ').some((word) => word.length > 3 && searchTerms.includes(word))
      );
    });

    return filtered.length > 0 ? filtered : allTrains.slice(0, 8);
  }

  /**
   * Run What-If delay simulation based on live database train schedules and Gemini 2.5 Flash
   */
  async runSimulation(params: WhatIfSimulationParams): Promise<WhatIfSimulationResult> {
    const delayMinutes =
      Number(params.delayMinutes) ||
      Number(params.duration) ||
      Number(params.duration_extension_minutes) ||
      15;

    const targetBlock =
      params.targetBlock ||
      params.section ||
      'Central Line Corridor Mainline';

    const trackSector =
      params.trackSector || 'Central Railway Mumbai Division';

    // 1. Fetch genuine database train records
    const dbTrains = await this.getDatabaseTrainsForSection(targetBlock, trackSector);

    const trainSummaryForPrompt = dbTrains
      .map((t) => `${t.train_no} (${t.train_name}) | Section: ${t.corridor_section} | Scheduled: ${t.scheduled_slot} | Line: ${t.line_type}`)
      .join('\n');

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are the AI railway dispatch engine (ConflictGuard & प्रवाहPlan) for the Central Line, Mumbai Division (Indian Railways).
Simulate a schedule overrun of +${delayMinutes} minutes on maintenance problem / possession: "${targetBlock}".
Corridor Context: ${trackSector}.

The following scheduled trains are actively running on this track corridor from the database timetable:
${trainSummaryForPrompt}

Analyze the cascading delay impact on these specific trains when this possession overruns by +${delayMinutes} minutes beyond its scheduled time. Return the affected trains with their simulated delayed arrival/departure slots, delay deltas (e.g. +${delayMinutes}m), signal hold locations, and severity.`;

        const responsePromise = ai.models.generateContent({
          model: getGeminiModelName(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                telemetry: {
                  type: Type.OBJECT,
                  properties: {
                    cascadingDelayTotal: {
                      type: Type.INTEGER,
                      description: 'Total number of delayed trains',
                    },
                    forcedCancellations: {
                      type: Type.INTEGER,
                      description: 'Number of cancelled trains',
                    },
                    estSystemRecovery: {
                      type: Type.STRING,
                      description: "e.g., '2h 15m'",
                    },
                    impactRadiusStations: {
                      type: Type.INTEGER,
                      description: 'Number of stations affected',
                    },
                  },
                  required: [
                    'cascadingDelayTotal',
                    'forcedCancellations',
                    'estSystemRecovery',
                    'impactRadiusStations',
                  ],
                },
                cancellations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      trainNo: {
                        type: Type.STRING,
                        description: "e.g., '12111 (CSMT-AMI)'",
                      },
                      depTime: { type: Type.STRING, description: "e.g., '19:55'" },
                      status: {
                        type: Type.STRING,
                        description: "e.g., 'CANCELLED'",
                      },
                      reason: {
                        type: Type.STRING,
                        description: 'Brief justification',
                      },
                    },
                    required: ['trainNo', 'depTime', 'status', 'reason'],
                  },
                },
                delays: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      trainNo: {
                        type: Type.STRING,
                        description: "e.g. '97089 (CSMT-TNA SLOW)'",
                      },
                      location: {
                        type: Type.STRING,
                        description: "e.g. 'Vikhroli Home Signal'",
                      },
                      scheduledTime: {
                        type: Type.STRING,
                        description: "e.g. '15:15'",
                      },
                      simulatedTime: {
                        type: Type.STRING,
                        description: "e.g. '15:30'",
                      },
                      delta: { type: Type.STRING, description: "e.g. '+15m'" },
                      severity: {
                        type: Type.STRING,
                        description: 'high | medium | low',
                      },
                    },
                    required: [
                      'trainNo',
                      'location',
                      'scheduledTime',
                      'simulatedTime',
                      'delta',
                      'severity',
                    ],
                  },
                },
                aiAnalysis: {
                  type: Type.STRING,
                  description:
                    'Concise summary of delay propagation and dispatch recommendation',
                },
              },
              required: ['telemetry', 'cancellations', 'delays', 'aiAnalysis'],
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
        );

        const response = (await Promise.race([responsePromise, timeoutPromise])) as any;

        const parsedData = JSON.parse(response.text || '{}');
        const diff = delayMinutes;
        const riskLevel =
          diff < 15 ? 'lower' : diff < 45 ? 'similar' : diff < 90 ? 'higher' : 'critical';

        return {
          success: true,
          source: getGeminiModelName(),
          ...parsedData,
          delta: {
            delay_difference_minutes: diff,
            risk_level: riskLevel,
          },
          analysis_summary: parsedData.aiAnalysis,
          recommendations: [
            'Maintain off-peak possession to contain suburban spillover.',
            'Regulate lower-priority freight on 5th/6th line loops.',
            'Verify line clearance with Divisional Signal Engineer.',
          ],
        };
      } catch (err) {
        console.warn('Gemini API call failed in WhatIfService, executing database-driven simulation fallback:', err);
      }
    }

    return this.fallbackSimulationFromDatabase(targetBlock, delayMinutes, trackSector, dbTrains);
  }

  /**
   * Deterministic simulation strictly backed by database train schedules
   */
  private fallbackSimulationFromDatabase(
    targetBlock: string,
    numDelay: number,
    trackSector: string,
    dbTrains: TrainSchedule[]
  ): WhatIfSimulationResult {
    const parseTime = (timeStr: string, addMins: number) => {
      const parts = timeStr.split(':');
      let h = parseInt(parts[0] || '14', 10);
      let m = parseInt(parts[1] || '0', 10);
      const total = (h * 60 + m + addMins) % 1440;
      const resH = String(Math.floor(total / 60)).padStart(2, '0');
      const resM = String(total % 60).padStart(2, '0');
      return `${resH}:${resM}`;
    };

    const delays: WhatIfDelayItem[] = dbTrains.slice(0, 7).map((t, idx) => {
      const trainDelay = Math.max(5, numDelay - idx * 3);
      return {
        trainNo: `${t.train_no} (${t.train_name})`,
        location: `${t.station} Approach Signal`,
        scheduledTime: t.scheduled_slot,
        simulatedTime: parseTime(t.scheduled_slot, trainDelay),
        delta: `+${trainDelay}m`,
        severity: idx < 3 ? 'high' : idx < 5 ? 'medium' : 'low',
      };
    });

    const computedDelays = Math.max(delays.length, Math.round(14 * (numDelay / 30)));
    const computedRadius = Math.max(2, Math.min(6, Math.round(3 * (numDelay / 25))));

    return {
      success: true,
      source: 'database_timetable_engine',
      telemetry: {
        cascadingDelayTotal: computedDelays,
        forcedCancellations: numDelay >= 45 ? 2 : numDelay >= 30 ? 1 : 0,
        estSystemRecovery: `${Math.floor(numDelay / 20)}h ${(numDelay % 20) * 3}m`,
        impactRadiusStations: computedRadius,
      },
      cancellations: [],
      delays,
      aiAnalysis: `Possession overrun of +${numDelay}m on ${targetBlock} holds ${delays.length} active scheduled trains from database timetable across ${trackSector}. Cascades delays to ${computedDelays} total dependencies across ${computedRadius} stations with estimated system recovery of ${Math.floor(numDelay / 20)}h ${(numDelay % 20) * 3}m.`,
      delta: {
        delay_difference_minutes: numDelay,
        risk_level: numDelay > 30 ? 'higher' : 'similar',
      },
      analysis_summary: `Track possession overrun of +${numDelay}m cascades delays across ${computedRadius} stations.`,
      recommendations: [
        'Regulate suburban trains on loop lines to maintain main running corridors.',
        'Issue caution orders to downstream drivers between adjacent stations.',
      ],
    };
  }

  /**
   * Run simulation on a proposed schedule
   */
  async simulateProposal(
    proposal: AIScheduleProposal,
    shiftMinutes = 0,
    durationExtension = 0
  ): Promise<WhatIfSimulationResult> {
    const totalDelay = shiftMinutes + durationExtension;
    const simRes = await this.runSimulation({
      targetBlock: proposal.linked_requests.join(', '),
      delayMinutes: totalDelay,
      duration_extension_minutes: durationExtension,
    });

    const origStart = new Date(proposal.proposed_start);
    const origEnd = new Date(proposal.proposed_end);
    const simStart = new Date(origStart.getTime() + shiftMinutes * 60000);
    const simEnd = new Date(origEnd.getTime() + (shiftMinutes + durationExtension) * 60000);

    return {
      ...simRes,
      original: {
        window_start: origStart.toISOString(),
        window_end: origEnd.toISOString(),
        trains_delayed: 2,
        cumulative_delay_minutes: 18,
        passenger_impact_score: 22,
      },
      simulated: {
        window_start: simStart.toISOString(),
        window_end: simEnd.toISOString(),
        trains_delayed: simRes.telemetry?.cascadingDelayTotal || 4,
        cumulative_delay_minutes: totalDelay,
        passenger_impact_score: Math.min(95, 20 + totalDelay * 0.8),
      },
    };
  }
}

export const whatIfService = new WhatIfService();
