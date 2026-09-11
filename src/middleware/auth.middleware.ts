import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { UserProfile } from '../types/database.types.js';
import { isSupabaseConfigured } from '../config/env.js';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const mockUserIdHeader = (req.headers['x-user-id'] || req.headers['x-mock-user-id']) as string | undefined;
    const mockRoleHeader = (req.headers['x-user-role'] || req.headers['x-mock-role']) as string | undefined;

    // 1. Direct test/development mock header resolution
    if (mockUserIdHeader) {
      const user = inMemoryStore.profiles.get(mockUserIdHeader);
      if (user) {
        req.user = user;
        return next();
      }
    }

    if (mockRoleHeader) {
      const user = Array.from(inMemoryStore.profiles.values()).find(
        (p) => p.role === mockRoleHeader
      );
      if (user) {
        req.user = user;
        return next();
      }
    }

    // 2. Bearer token verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (isSupabaseConfigured()) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          res.status(401).json({ error: 'Invalid or expired Supabase authentication token.' });
          return;
        }

        // Fetch user profile from database or in-memory fallback
        let profile = inMemoryStore.profiles.get(authData.user.id);
        if (!profile) {
          const { data: dbProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (dbProfile) {
            profile = dbProfile as UserProfile;
          }
        }

        if (!profile) {
          res.status(403).json({ error: 'User authenticated but profile not registered.' });
          return;
        }

        req.user = profile;
        return next();
      } else {
        // Fallback for mock token: format 'mock-user-<id>' or 'token-<role>'
        const user = Array.from(inMemoryStore.profiles.values()).find(
          (p) => p.id === token || p.role === token || p.email === token
        );
        if (user) {
          req.user = user;
          return next();
        }
      }
    }

    res.status(401).json({
      error: 'Unauthorized: Authentication required. Provide Bearer token or x-user-id header.',
    });
  } catch (err) {
    next(err);
  }
};
