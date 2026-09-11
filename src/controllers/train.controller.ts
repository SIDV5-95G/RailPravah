import { Request, Response } from 'express';
import { inMemoryStore } from '../db/in-memory-store.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { TrainSchedule } from '../types/database.types.js';

/**
 * GET /api/trains
 * Query trains scheduled on a given section/line or across the division.
 */
export const listTrains = async (req: Request, res: Response) => {
  try {
    const { section, lineType, timeStart, timeEnd, serviceType, limit } = req.query;

    let trains: TrainSchedule[] = [];

    // Try live Supabase table first
    if (isSupabaseConfigured()) {
      try {
        let query = supabaseAdmin.from('train_schedules').select('*');
        if (section && typeof section === 'string') {
          query = query.ilike('corridor_section', `%${section}%`);
        }
        if (lineType && typeof lineType === 'string') {
          query = query.ilike('line_type', `%${lineType}%`);
        }
        if (serviceType && typeof serviceType === 'string') {
          query = query.eq('service_type', serviceType);
        }
        if (limit) {
          query = query.limit(Number(limit));
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          trains = data as TrainSchedule[];
        }
      } catch (dbErr) {
        console.warn('Supabase train query fallback to in-memory:', dbErr);
      }
    }

    // Fallback / supplement with in-memory store
    if (trains.length === 0) {
      trains = Array.from(inMemoryStore.trainSchedules.values());

      if (section && typeof section === 'string') {
        const secLower = section.toLowerCase();
        trains = trains.filter(
          (t) =>
            t.corridor_section.toLowerCase().includes(secLower) ||
            t.station.toLowerCase().includes(secLower) ||
            secLower.includes(t.station.toLowerCase())
        );
      }

      if (lineType && typeof lineType === 'string') {
        const lineLower = lineType.toLowerCase();
        trains = trains.filter((t) => t.line_type.toLowerCase().includes(lineLower));
      }

      if (serviceType && typeof serviceType === 'string') {
        trains = trains.filter((t) => t.service_type === serviceType);
      }

      // If strict filter yielded 0, return all division trains rather than empty list
      if (trains.length === 0) {
        trains = Array.from(inMemoryStore.trainSchedules.values());
      }
    }

    res.json({
      success: true,
      total: trains.length,
      trains,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/trains
 * Ingest or update a train schedule record in the database.
 */
export const createTrainSchedule = async (req: Request, res: Response) => {
  try {
    const trainData: TrainSchedule = {
      id: req.body.id || `trn-${Date.now()}`,
      train_no: req.body.train_no,
      train_name: req.body.train_name,
      service_type: req.body.service_type || 'slow_local',
      direction: req.body.direction || 'DOWN',
      corridor_section: req.body.corridor_section || 'Central Line Mainline',
      station: req.body.station || 'Dadar',
      line_type: req.body.line_type || 'Down Fast Line',
      scheduled_slot: req.body.scheduled_slot || '12:00',
      origin: req.body.origin || 'CSMT',
      destination: req.body.destination || 'Kalyan',
      frequency_minutes: req.body.frequency_minutes || 5,
      priority_tier: req.body.priority_tier || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.trainSchedules.set(trainData.id, trainData);

    if (isSupabaseConfigured()) {
      await supabaseAdmin.from('train_schedules').upsert(trainData as any);
    }

    res.status(201).json({
      success: true,
      message: 'Train schedule saved to database',
      train: trainData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
