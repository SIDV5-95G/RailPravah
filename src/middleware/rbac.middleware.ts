import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/database.types.js';

/**
 * Enforce role whitelist on endpoints
 */
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this endpoint. Required role(s): [${allowedRoles.join(
          ', '
        )}]`,
      });
      return;
    }

    next();
  };
};

/**
 * Forbid client from directly submitting or mutating the 'status' field.
 * This satisfies Section 3 & Section 6 hard constraints.
 */
export const forbidDirectStatusMutation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && req.body.status !== undefined) {
    res.status(400).json({
      error:
        "Direct modification of the 'status' field is strictly prohibited. Status transitions must occur through dedicated lifecycle actions (e.g. /escalate or /resolve).",
    });
    return;
  }
  next();
};
