import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { randomUUID } from 'crypto';
import { UserRole, DepartmentType } from '../types/database.types.js';

let cachedSystemProfileId: string | null = null;

/**
 * Gets or creates a valid profile UUID in Supabase to satisfy foreign key constraints.
 */
export async function getValidProfileId(
  empIdOrEmail?: string,
  extra?: {
    name?: string;
    role?: UserRole;
    department?: DepartmentType | string | null;
  }
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return randomUUID();
  }

  try {
    if (empIdOrEmail) {
      const clean = empIdOrEmail.toLowerCase().trim();
      const cleanEmpId = clean.replace('@railpravah.gov.in', '');
      const userEmail = clean.includes('@') ? clean : `${cleanEmpId}@railpravah.gov.in`;

      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .or(`email.ilike.%${cleanEmpId}%,name.ilike.%${cleanEmpId}%,email.eq.${userEmail}`)
        .limit(1);

      if (data && data.length > 0 && data[0].id) {
        return data[0].id;
      }

      // If not found in DB, auto-provision this profile into profiles table so foreign key succeeds
      let dept: DepartmentType = 'civil';
      const rawDept = (extra?.department || '').toLowerCase();
      if (rawDept.includes('elect') || rawDept.includes('trd') || rawDept.includes('tract')) dept = 'electrical';
      else if (rawDept.includes('sign') || rawDept.includes('s&t') || rawDept.includes('comm')) dept = 'signal_comm';

      const userRole: UserRole = extra?.role || 'worker';
      const userName = extra?.name || `Worker (${cleanEmpId.toUpperCase()})`;

      // Find supervisor to report to
      let superiorId: string | null = null;
      try {
        const { data: supData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('role', 'supervisor')
          .eq('department', dept)
          .limit(1);
        if (supData && supData.length > 0) {
          superiorId = supData[0].id;
        }
      } catch (_) {}

      const newUserId = randomUUID();
      const { error: insertErr } = await supabaseAdmin.from('profiles').upsert({
        id: newUserId as any,
        email: userEmail,
        name: userName,
        role: userRole,
        department: dept,
        reports_to: superiorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      if (!insertErr) {
        return newUserId;
      } else {
        // If conflict on email, retrieve that id
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();
        if (existing?.id) return existing.id;
      }
    }

    if (cachedSystemProfileId) {
      return cachedSystemProfileId;
    }

    // Try finding any existing profile
    const { data: anyProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (anyProfile && anyProfile.length > 0 && anyProfile[0].id) {
      const foundId: string = anyProfile[0].id;
      cachedSystemProfileId = foundId;
      return foundId;
    }

    // Create a system operator profile if table is empty
    const newId = randomUUID();
    const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert({
      id: newId as any,
      email: 'system.controller@railpravah.gov.in',
      name: 'System Operations Controller',
      role: 'coa_admin',
      department: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (upsertErr) {
      console.warn('Profile upsert note in getValidProfileId:', upsertErr.message);
    }

    // Retrieve the actual ID of that profile
    const { data: sysData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'system.controller@railpravah.gov.in')
      .limit(1);

    if (sysData && sysData.length > 0 && sysData[0].id) {
      cachedSystemProfileId = sysData[0].id;
      return sysData[0].id;
    }

    cachedSystemProfileId = newId;
    return newId;
  } catch (err) {
    console.warn('Profile lookup note:', err);
    return randomUUID();
  }
}
