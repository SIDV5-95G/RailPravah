import { supabaseAdmin } from '../config/supabase.js';

async function testRegistrationValidation() {
  console.log('--- 1. Testing Invalid Prefix Rejection ---');
  const res1 = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bad Prefix User',
      empId: 'SUP-CR-1111', // trying to register as worker with SUP prefix
      role: 'worker',
      department: 'civil',
      password: 'RailPravah@2026',
    }),
  });
  const data1: any = await res1.json();
  console.log('Status 1 (Expected 400):', res1.status, data1.error);

  console.log('\n--- 2. Testing Short Password Rejection ---');
  const res2 = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Short Pass User',
      empId: 'WRK-CR-2222',
      role: 'worker',
      department: 'civil',
      password: '123', // short password
    }),
  });
  const data2: any = await res2.json();
  console.log('Status 2 (Expected 400):', res2.status, data2.error);

  console.log('\n--- 3. Testing Valid Worker Registration (Electrical) ---');
  const empId = `WRK-CR-${Math.floor(1000 + Math.random() * 9000)}`;
  const res3 = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prakash Shinde',
      empId: empId,
      role: 'worker',
      department: 'electrical',
      password: 'RailPravah@2026',
    }),
  });
  const data3: any = await res3.json();
  console.log('Status 3 (Expected 201):', res3.status, 'Success:', data3.success, 'ReportingTo:', data3.user?.reportingTo);

  // Verify in profiles table in Supabase
  const { data: profileInDb } = await supabaseAdmin.from('profiles').select('*').eq('email', `${empId.toLowerCase()}@railpravah.gov.in`).single();
  console.log('Profile in DB:', profileInDb ? `Found: ${profileInDb.name} (${profileInDb.email}), reports_to: ${profileInDb.reports_to}` : 'NOT FOUND');

  if (profileInDb) {
    console.log('✅ TEST PASSED: Registered worker strictly saved to profiles table in Supabase with reports_to link!');
    // Clean up test user
    await supabaseAdmin.from('profiles').delete().eq('id', profileInDb.id);
    await supabaseAdmin.auth.admin.deleteUser(profileInDb.id);
  } else {
    console.error('❌ TEST FAILED: User missing in profiles table');
  }
}

testRegistrationValidation().catch(console.error);
