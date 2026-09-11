import { Router } from 'express';
import { listTrains, createTrainSchedule } from '../controllers/train.controller.js';

const router = Router();

// GET /api/trains — List database train schedules with filters
router.get('/', listTrains);

// POST /api/trains — Add/update train timetable record
router.post('/', createTrainSchedule);

export default router;
