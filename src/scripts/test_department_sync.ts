import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5001';

async function runTests() {
  console.log('=== Testing Registration Department Synchronization & Validation ===\n');

  // Test 1: Invalid department should fail
  console.log('Test 1: Register with invalid department "Operations" for Worker...');
  const res1 = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Worker Invalid',
      empId: 'WRK-CR-9901',
      password: 'RailPravah@2026',
      role: 'worker',
      department: 'Operations',
    }),
  });
  const data1: any = await res1.json();
  console.log('Response Status:', res1.status);
  console.log('Response Body:', data1);
  if (res1.status === 400 && !data1.success) {
    console.log('✅ Test 1 Passed: Rejected invalid department.\n');
  } else {
    console.error('❌ Test 1 Failed: Should have rejected invalid department.\n');
  }

  // Test 2: Valid department "Engineering"
  console.log('Test 2: Register with "Engineering" (Civil)...');
  const res2 = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Worker Civil',
      empId: 'WRK-CR-9902',
      password: 'RailPravah@2026',
      role: 'worker',
      department: 'Engineering',
    }),
  });
  const data2: any = await res2.json();
  console.log('Response Status:', res2.status);
  console.log('User Profile:', data2.user);
  if (res2.ok && data2.success && data2.user.department === 'civil' && data2.user.reportingTo?.role === 'supervisor') {
    console.log('✅ Test 2 Passed: Successfully registered in Civil with supervisor.\n');
  } else {
    console.error('❌ Test 2 Failed:', data2);
  }

  // Test 3: Valid department "Traction"
  console.log('Test 3: Register with "Traction" (Electrical)...');
  const res3 = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Worker TRD',
      empId: 'WRK-CR-9903',
      password: 'RailPravah@2026',
      role: 'worker',
      department: 'Traction',
    }),
  });
  const data3: any = await res3.json();
  console.log('Response Status:', res3.status);
  console.log('User Profile:', data3.user);
  if (res3.ok && data3.success && data3.user.department === 'electrical' && data3.user.reportingTo?.empId === 'SUP-CR-3105') {
    console.log('✅ Test 3 Passed: Successfully registered in Electrical with Sunil Gaikwad (SUP-CR-3105).\n');
  } else {
    console.error('❌ Test 3 Failed:', data3);
  }

  // Test 4: Valid department "S&T"
  console.log('Test 4: Register with "S&T" (Signal & Telecom)...');
  const res4 = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Worker ST',
      empId: 'WRK-CR-9904',
      password: 'RailPravah@2026',
      role: 'worker',
      department: 'S&T',
    }),
  });
  const data4: any = await res4.json();
  console.log('Response Status:', res4.status);
  console.log('User Profile:', data4.user);
  if (res4.ok && data4.success && data4.user.department === 'signal_comm' && data4.user.reportingTo?.empId === 'SUP-CR-3106') {
    console.log('✅ Test 4 Passed: Successfully registered in Signal & Telecom with Amit G. Bhosle (SUP-CR-3106).\n');
  } else {
    console.error('❌ Test 4 Failed:', data4);
  }

  console.log('=== All Synchronization Tests Completed ===');
}

runTests().catch(console.error);
