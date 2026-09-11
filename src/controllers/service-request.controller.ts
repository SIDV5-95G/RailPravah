import { Request, Response, NextFunction } from 'express';
import { inMemoryStore } from '../db/in-memory-store.js';
import { ServiceRequest } from '../types/database.types.js';
import { randomUUID } from 'crypto';

export const createServiceRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user!;

    // Enforce role check: Only Zonal Head can create service requests
    if (user.role !== 'zonal_head') {
      res.status(403).json({
        error: 'Forbidden: Only Zonal Heads are authorized to submit track maintenance service requests.',
      });
      return;
    }

    const {
      department,
      asset_section,
      requested_start,
      requested_end,
      urgency,
      description,
    } = req.body;

    if (!asset_section || !requested_start || !requested_end || !description) {
      res.status(400).json({
        error:
          'Missing required fields: asset_section, requested_start, requested_end, and description are mandatory.',
      });
      return;
    }

    // Verify department matches Zonal Head's assigned department
    const targetDept = department || user.department;
    if (user.department && targetDept !== user.department) {
      res.status(403).json({
        error: `Forbidden: You are the Zonal Head for '${user.department}' and cannot raise requests for '${targetDept}'.`,
      });
      return;
    }

    // Window validation
    const start = new Date(requested_start);
    const end = new Date(requested_end);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      res.status(400).json({
        error: 'Invalid time window: requested_end must be after requested_start.',
      });
      return;
    }

    const newRequest: ServiceRequest = {
      id: randomUUID(),
      raised_by: user.id,
      department: targetDept,
      asset_section,
      requested_start: start.toISOString(),
      requested_end: end.toISOString(),
      urgency: urgency || 'medium',
      description,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.serviceRequests.set(newRequest.id, newRequest);

    res.status(201).json({
      message: 'Service request submitted successfully and marked pending.',
      request: newRequest,
    });
  } catch (err) {
    next(err);
  }
};

export const getServiceRequests = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user!;
    let requests = Array.from(inMemoryStore.serviceRequests.values());

    // Role-based scoping: Non-COA roles only see their own department's requests
    if (user.role !== 'coa_admin') {
      requests = requests.filter((r) => r.department === user.department);
    }

    res.json({
      total: requests.length,
      department_scope: user.role === 'coa_admin' ? 'all' : user.department,
      requests,
    });
  } catch (err) {
    next(err);
  }
};
