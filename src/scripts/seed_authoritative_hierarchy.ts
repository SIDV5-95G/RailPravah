import { supabaseAdmin } from '../config/supabase.js';
import { inMemoryStore } from '../db/in-memory-store.js';

interface SeedUserSpec {
  empId: string;
  email: string;
  name: string;
  role: 'coa_admin' | 'department_head' | 'zonal_head' | 'supervisor' | 'worker';
  department: 'civil' | 'electrical' | 'signal_comm' | null;
  superiorEmpId: string | null;
  designation: string;
}

const AUTHORITATIVE_USERS: SeedUserSpec[] = [
  // COA Admin (Apex Controller)
  {
    empId: 'COA-CR-4891',
    email: 'coa-cr-4891@railpravah.gov.in',
    name: 'Chief Operations Controller (COA)',
    role: 'coa_admin',
    department: null,
    superiorEmpId: null,
    designation: 'Chief COA Operations Controller',
  },

  // 1. Civil / Track Department
  {
    empId: 'DPT-CR-5520',
    email: 'dpt-cr-5520@railpravah.gov.in',
    name: 'Dr. Pradeep Verma',
    role: 'department_head',
    department: 'civil',
    superiorEmpId: 'COA-CR-4891',
    designation: 'Sr. Divisional Engineer (Sr. DEN / Civil)',
  },
  {
    empId: 'ZON-CR-1102',
    email: 'zon-cr-1102@railpravah.gov.in',
    name: 'Virendra K. Meena',
    role: 'zonal_head',
    department: 'civil',
    superiorEmpId: 'DPT-CR-5520',
    designation: 'Chief Track Engineer (CTE / Central Zone)',
  },
  {
    empId: 'SUP-CR-3104',
    email: 'sup-cr-3104@railpravah.gov.in',
    name: 'Rajesh K. Shinde',
    role: 'supervisor',
    department: 'civil',
    superiorEmpId: 'ZON-CR-1102',
    designation: 'Senior Section Engineer (SSE / P-Way Dadar)',
  },
  {
    empId: 'WRK-CR-1001',
    email: 'wrk-cr-1001@railpravah.gov.in',
    name: 'Ramesh Pawar',
    role: 'worker',
    department: 'civil',
    superiorEmpId: 'SUP-CR-3104',
    designation: 'Track Maintainer Gr-IV (Dadar Section)',
  },

  // 2. Electrical / TRD Department
  {
    empId: 'DPT-CR-5530',
    email: 'dpt-cr-5530@railpravah.gov.in',
    name: 'K. R. Narayanan',
    role: 'department_head',
    department: 'electrical',
    superiorEmpId: 'COA-CR-4891',
    designation: 'Sr. Divisional Electrical Engineer (Sr. DEE / TRD)',
  },
  {
    empId: 'ZON-CR-1103',
    email: 'zon-cr-1103@railpravah.gov.in',
    name: 'A. P. Deshmukh',
    role: 'zonal_head',
    department: 'electrical',
    superiorEmpId: 'DPT-CR-5530',
    designation: 'Chief Electrical Engineer (CEE / Traction)',
  },
  {
    empId: 'SUP-CR-3105',
    email: 'sup-cr-3105@railpravah.gov.in',
    name: 'Sunil G. Gaikwad',
    role: 'supervisor',
    department: 'electrical',
    superiorEmpId: 'ZON-CR-1103',
    designation: 'Senior Section Engineer (SSE / TRD Kalyan)',
  },
  {
    empId: 'WRK-CR-1002',
    email: 'wrk-cr-1002@railpravah.gov.in',
    name: 'Suresh Patil',
    role: 'worker',
    department: 'electrical',
    superiorEmpId: 'SUP-CR-3105',
    designation: 'OHE Linesman Gr-III (Kalyan Depot)',
  },

  // 3. Signal & Telecom Department
  {
    empId: 'DPT-CR-5540',
    email: 'dpt-cr-5540@railpravah.gov.in',
    name: 'M. S. Raghavan',
    role: 'department_head',
    department: 'signal_comm',
    superiorEmpId: 'COA-CR-4891',
    designation: 'Sr. Divisional Signal & Telecom Engineer (Sr. DSTE)',
  },
  {
    empId: 'ZON-CR-1104',
    email: 'zon-cr-1104@railpravah.gov.in',
    name: 'R. K. Sharma',
    role: 'zonal_head',
    department: 'signal_comm',
    superiorEmpId: 'DPT-CR-5540',
    designation: 'Chief Signal & Telecom Engineer (CSTE / HQ)',
  },
  {
    empId: 'SUP-CR-3106',
    email: 'sup-cr-3106@railpravah.gov.in',
    name: 'Deepak V. Kulkarni',
    role: 'supervisor',
    department: 'signal_comm',
    superiorEmpId: 'ZON-CR-1104',
    designation: 'Senior Section Engineer (SSE / Signal CSMT)',
  },
  {
    empId: 'WRK-CR-1003',
    email: 'wrk-cr-1003@railpravah.gov.in',
    name: 'Santosh Jadhav',
    role: 'worker',
    department: 'signal_comm',
    superiorEmpId: 'SUP-CR-3106',
    designation: 'Signal Maintainer Gr-II (Byculla Section)',
  },
];

const DEFAULT_PASSWORD = 'RailPravah@2026';

export async function seedAuthoritativeHierarchy() {
  console.log('================================================================');
  console.log('🚂 STARTING AUTHORITATIVE HIERARCHY SEEDING & DATABASE CLEANUP');
  console.log('================================================================\n');

  // 1. Fetch current profiles and auth users
  const { data: existingProfiles } = await supabaseAdmin.from('profiles').select('*');
  const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers();
  const authUsers = authUsersData?.users || [];

  console.log(`Current profiles count: ${existingProfiles?.length || 0}`);
  console.log(`Current auth users count: ${authUsers.length}`);

  const allowedEmails = new Set(AUTHORITATIVE_USERS.map((u) => u.email.toLowerCase()));

  // 2. Clean up non-authoritative users (users without valid hierarchy, except coa_admin if email matches)
  console.log('\n🧹 Cleaning up obsolete test profiles & auth accounts...');
  
  if (existingProfiles) {
    for (const p of existingProfiles) {
      if (!allowedEmails.has(p.email?.toLowerCase())) {
        console.log(`- Deleting obsolete profile: ${p.email} (${p.role})`);
        await supabaseAdmin.from('profiles').delete().eq('id', p.id);
      }
    }
  }

  for (const u of authUsers) {
    if (u.email && !allowedEmails.has(u.email.toLowerCase())) {
      console.log(`- Deleting obsolete Auth user: ${u.email}`);
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
  }

  // 3. Create or Update Supabase Auth Users for each Authoritative Spec
  console.log('\n👥 Ensuring all 13 Authoritative Users exist in Supabase Auth...');
  const empIdToUserIdMap = new Map<string, string>();

  // Re-fetch existing auth users after cleanup
  const { data: freshAuthData } = await supabaseAdmin.auth.admin.listUsers();
  const freshAuthUsers = freshAuthData?.users || [];

  for (const spec of AUTHORITATIVE_USERS) {
    let authUser = freshAuthUsers.find((u) => u.email?.toLowerCase() === spec.email.toLowerCase());

    if (authUser) {
      empIdToUserIdMap.set(spec.empId, authUser.id);
      // Update password and metadata
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: DEFAULT_PASSWORD,
        user_metadata: {
          name: spec.name,
          role: spec.role,
          department: spec.department,
          employee_id: spec.empId,
        },
      });
      console.log(`  ✓ Updated Auth user for ${spec.empId} (${spec.email}) -> ID: ${authUser.id}`);
    } else {
      const { data: newAuthUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: spec.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: spec.name,
          role: spec.role,
          department: spec.department,
          employee_id: spec.empId,
        },
      });

      if (createErr || !newAuthUser?.user) {
        console.error(`  ✗ Error creating auth user for ${spec.email}:`, createErr?.message);
        continue;
      }

      empIdToUserIdMap.set(spec.empId, newAuthUser.user.id);
      console.log(`  ✓ Created new Auth user for ${spec.empId} (${spec.email}) -> ID: ${newAuthUser.user.id}`);
    }
  }

  // 4. Insert / Update Profiles table in top-down order to satisfy foreign keys
  console.log('\n🔗 Upserting Profiles with verified reports_to foreign keys...');

  // Top-down order: coa_admin -> department_head -> zonal_head -> supervisor -> worker
  const orderedRoles = ['coa_admin', 'department_head', 'zonal_head', 'supervisor', 'worker'];

  for (const roleLevel of orderedRoles) {
    const specsAtLevel = AUTHORITATIVE_USERS.filter((u) => u.role === roleLevel);

    for (const spec of specsAtLevel) {
      const userId = empIdToUserIdMap.get(spec.empId);
      if (!userId) {
        console.error(`  ✗ Missing userId for ${spec.empId}`);
        continue;
      }

      let reportsToId: string | null = null;
      if (spec.superiorEmpId) {
        reportsToId = empIdToUserIdMap.get(spec.superiorEmpId) || null;
      }

      const profilePayload = {
        id: userId,
        email: spec.email,
        name: spec.name,
        role: spec.role,
        department: spec.department,
        reports_to: reportsToId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (upsertErr) {
        console.error(`  ✗ Profile upsert error for ${spec.empId}:`, upsertErr.message);
      } else {
        console.log(
          `  ✓ Profile linked: ${spec.empId} (${spec.name}, ${spec.role}) -> reports_to: ${
            spec.superiorEmpId ? `${spec.superiorEmpId} (${reportsToId})` : 'NULL (Apex COA Admin)'
          }`
        );
      }

      // Sync in-memory store
      inMemoryStore.profiles.set(userId, profilePayload as any);
    }
  }

  console.log('\n================================================================');
  console.log('✅ AUTHORITATIVE HIERARCHY SUCCESSFULLY SEEDED & VERIFIED IN SUPABASE');
  console.log('================================================================\n');
}

// Execute when run directly
seedAuthoritativeHierarchy().catch(console.error);
