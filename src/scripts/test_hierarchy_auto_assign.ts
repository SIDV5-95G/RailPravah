import { supabaseAdmin } from '../config/supabase.js';

async function testAutoAssignment() {
  console.log('🧪 Testing Auto-Assignment on Registration...');

  // 1. Register a new test worker in Civil Department
  const workerEmpId = `WRK-AUTO-${Date.now().toString().slice(-4)}`;
  const workerRes = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auto Assigned Worker',
      empId: workerEmpId,
      password: 'RailPravah@2026',
      role: 'worker',
      department: 'civil',
    }),
  });
  const workerData: any = await workerRes.json();
  console.log('Worker Registration Full Response:', JSON.stringify(workerData, null, 2));

  // Verify in Supabase
  const { data: dbWorker, error: dbErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', `${workerEmpId.toLowerCase()}@railpravah.gov.in`)
    .single();

  let superiorProfile = null;
  if (dbWorker?.reports_to) {
    const { data: sup } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', dbWorker.reports_to)
      .single();
    superiorProfile = sup;
  }

  console.log('DB Worker Profile:', {
    id: dbWorker?.id,
    name: dbWorker?.name,
    role: dbWorker?.role,
    department: dbWorker?.department,
    reports_to: dbWorker?.reports_to,
    superior: superiorProfile ? { name: superiorProfile.name, role: superiorProfile.role, email: superiorProfile.email } : null,
  });

  if (superiorProfile?.role === 'supervisor') {
    console.log('✅ Worker successfully auto-assigned to Supervisor in Supabase:', superiorProfile.name);
  } else {
    console.error('❌ Failed: Worker not assigned to supervisor');
  }

  // 2. Clean up test user
  if (workerData.user?.id) {
    await supabaseAdmin.from('profiles').delete().eq('id', workerData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(workerData.user.id);
    console.log('🧹 Cleaned up temporary test worker.');
  }
}

testAutoAssignment().catch(console.error);
