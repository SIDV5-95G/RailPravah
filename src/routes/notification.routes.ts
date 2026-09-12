import { Router, Request, Response } from 'express';
import { inMemoryStore } from '../db/in-memory-store.js';
import { coaFrontendStore } from '../db/coa-frontend-store.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { getValidProfileId } from '../services/profile-lookup.js';
import { Notification } from '../types/database.types.js';
import { randomUUID } from 'crypto';

const router = Router();

// GET /notifications (and /api/notifications)
router.get('/', async (req: Request, res: Response) => {
  const userRole = (((req.headers['x-user-role'] || req.headers['x-mock-role'] || req.query.role || '') as string)).toLowerCase();
  const userDept = (((req.headers['x-user-dept'] || req.query.department || req.query.dept || '') as string)).toLowerCase();

  let userDeptKey = 'civil';
  if (userDept.includes('elect') || userDept.includes('trd') || userDept.includes('tract')) userDeptKey = 'electrical';
  else if (userDept.includes('sign') || userDept.includes('s&t') || userDept.includes('comm')) userDeptKey = 'signal_comm';

  if (isSupabaseConfigured()) {
    try {
      const { data: dbNotifs } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbNotifs && dbNotifs.length > 0) {
        for (const n of dbNotifs) {
          const exists = inMemoryStore.notifications.find((item) => item.id === n.id);
          if (!exists) {
            inMemoryStore.notifications.push({
              id: n.id,
              user_id: n.user_id,
              title: n.title,
              message: n.message,
              type: n.type || 'operational_alert',
              is_read: n.is_read || false,
              created_at: n.created_at,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Supabase notifications query note:', e);
    }
  }

  const userEmpId = (((req.headers['x-user-empid'] || req.headers['x-user-emp-id'] || req.query.empId || '') as string)).trim();
  const userIdHeader = (((req.headers['x-user-id'] || req.query.userId || '') as string)).trim();

  // If userEmpId is provided, find the user's supabase profile ID if available
  let userProfileId: string | null = null;
  if (isSupabaseConfigured() && (userEmpId || userIdHeader)) {
    try {
      if (userIdHeader) {
        userProfileId = userIdHeader;
      } else if (userEmpId) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('employee_id', userEmpId)
          .single();
        if (prof) userProfileId = prof.id;
      }
    } catch {
      // ignore
    }
  }

  // Combine both slot notifications and system notifications
  let slotList = [...coaFrontendStore.slotNotifications];
  let sysList = [...inMemoryStore.notifications];

  if (userRole && userRole !== 'coa_admin' && userRole !== 'coa') {
    slotList = slotList.filter((n: any) => {
      // Role match
      const roles = n.recipientRoles || n.recipient_roles;
      const roleMatches =
        !roles ||
        (Array.isArray(roles) &&
          roles.some(
            (r: string) =>
              r.toLowerCase() === userRole ||
              (userRole === 'department_head' && r === 'department_user') ||
              (userRole === 'department_user' && r === 'department_head')
          ));

      // Department match
      const depts = n.recipientDepts || n.recipient_depts || n.departments;
      const deptMatches =
        !depts ||
        !userDept ||
        (Array.isArray(depts) &&
          depts.some((d: string) => {
            const dLow = d.toLowerCase();
            return (
              dLow.includes(userDeptKey) ||
              dLow.includes(userDept) ||
              dLow.includes('multi') ||
              dLow.includes('joint')
            );
          }));

      return roleMatches && deptMatches;
    });

    sysList = sysList.filter((n: any) => {
      // Direct user_id match if available
      if (userProfileId && n.user_id === userProfileId) {
        return true;
      }

      const roles = n.recipient_roles || n.recipientRoles;
      const roleMatches =
        !roles ||
        (Array.isArray(roles) &&
          roles.some(
            (r: string) =>
              r.toLowerCase() === userRole ||
              (userRole === 'department_head' && r === 'department_user') ||
              (userRole === 'department_user' && r === 'department_head')
          ));

      const depts = n.recipient_depts || n.recipientDepts || n.departments;
      let deptMatches = true;
      if (depts && Array.isArray(depts)) {
        deptMatches = depts.some((d: string) => {
          const dLow = d.toLowerCase();
          return (
            dLow.includes(userDeptKey) ||
            dLow.includes(userDept) ||
            dLow.includes('multi') ||
            dLow.includes('joint')
          );
        });
      } else if (userDept) {
        // Infer from title / message text if not explicit
        const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        const mentionsCivil = text.includes('civil') || text.includes('track') || text.includes('sleeper') || text.includes('bridge');
        const mentionsElect = text.includes('electrical') || text.includes('ohe') || text.includes('traction') || text.includes('power');
        const mentionsSig = text.includes('signal') || text.includes('telecom') || text.includes('s&t') || text.includes('point machine');
        const isMulti = text.includes('multi') || text.includes('joint') || text.includes('corridor');

        if (!isMulti) {
          if (userDeptKey === 'civil' && !mentionsCivil && (mentionsElect || mentionsSig)) deptMatches = false;
          if (userDeptKey === 'electrical' && !mentionsElect && (mentionsCivil || mentionsSig)) deptMatches = false;
          if (userDeptKey === 'signal_comm' && !mentionsSig && (mentionsCivil || mentionsElect)) deptMatches = false;
        }
      }

      return roleMatches && deptMatches;
    });
  }

  // Helper to extract a canonical key for slot / complaint notifications
  const getCanonicalKey = (item: any): string => {
    const rawMsg = (item.message || '').trim();
    const rawTitle = (item.title || '').trim();

    // 1. Explicit slot code or ID from fields or regex
    const slotCodeMatch =
      item.slotCode ||
      item.slot_code ||
      item.slotId ||
      rawTitle.match(/(?:SLOT|SANCTION|WHYSLOT|CLUSTER)-[A-Z0-9\-_]+/i)?.[0] ||
      rawMsg.match(/(?:SLOT|SANCTION|WHYSLOT|CLUSTER)-[A-Z0-9\-_]+/i)?.[0];

    if (slotCodeMatch) {
      return `slot_${slotCodeMatch.toUpperCase()}`;
    }

    // 2. Event signature: location + date + timing + workName
    const locMatch = rawMsg.match(/for\s+(.*?)\s+on\s+(\d{4}-\d{2}-\d{2})/i) || rawTitle.match(/for\s+(.*?)\s+on\s+(\d{4}-\d{2}-\d{2})/i);
    const timeMatch = rawMsg.match(/\((\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}[^)]*)\)/) || rawMsg.match(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/);
    const workMatch = rawMsg.match(/Work:\s*([^.]+)/i);

    const loc = (locMatch ? locMatch[1] : (item.location || '')).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dStr = (locMatch ? locMatch[2] : (item.date || '')).trim();
    const tStr = (timeMatch ? timeMatch[1] : (item.timing || '')).trim().replace(/[^0-9]/g, '');
    const wStr = (workMatch ? workMatch[1] : (item.workName || '')).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (loc || dStr || tStr) {
      return `event_${loc}_${dStr}_${tStr}_${wStr}`;
    }

    // 3. Fallback: normalized title and message text prefix
    const normTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normMsg = rawMsg.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
    if (normTitle || normMsg) {
      return `msg_${normTitle}_${normMsg}`;
    }

    return `id_${item.id || randomUUID()}`;
  };

  // Deduplicate and combine by canonical key
  const notifMap = new Map<string, any>();
  for (const item of [...slotList, ...sysList] as any[]) {
    const key = getCanonicalKey(item);

    if (notifMap.has(key)) {
      const existing = notifMap.get(key)!;
      // Prefer richer slotNotification payload or newer createdAt
      if ((!existing.slotCode && item.slotCode) || (!existing.workName && item.workName)) {
        notifMap.set(key, { ...existing, ...item });
      }
    } else {
      notifMap.set(key, item);
    }
  }

  const combined = Array.from(notifMap.values());

  res.json({
    success: true,
    count: combined.length,
    notifications: combined,
  });
});

// POST /notifications (and /api/notifications)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || !body.title) {
    res.status(400).json({ success: false, error: 'Title is required' });
    return;
  }

  const notification: Notification = {
    id: body.id || randomUUID(),
    user_id: body.user_id || body.userId || 'system',
    title: body.title,
    message: body.message || body.description || '',
    type: body.type || 'operational_alert',
    is_read: false,
    created_at: body.createdAt || body.created_at || new Date().toISOString(),
  };

  inMemoryStore.notifications.unshift(notification);

  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        const validUserId = await getValidProfileId(body.user_id || body.userId);
        const { error } = await supabaseAdmin.from('notifications').insert({
          user_id: validUserId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          created_at: notification.created_at,
        });
        if (error) console.warn('Supabase notification insert note:', error.message);
      } catch (err) {
        console.warn('Supabase notification error:', err);
      }
    })();
  }

  res.status(201).json({ success: true, notification });
});

export default router;
