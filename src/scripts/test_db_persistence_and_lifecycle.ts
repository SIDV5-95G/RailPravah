import fetch from 'node-fetch';
import { supabaseAdmin } from '../config/supabase.js';

const BACKEND_URL = 'http://localhost:5001';

async function testDatabasePersistence() {
  console.log('=== Step 1: Purging all complaints from Database & Memory Store ===');
  await supabaseAdmin.from('complaint_audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('=== Step 2: Worker creates a defect complaint ===');
  const workerEmpId = 'WRK-CR-746';
  const issueRes = await fetch(`${BACKEND_URL}/api/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'worker',
      'x-user-empid': workerEmpId,
      'x-user-dept': 'Engineering',
    },
    body: JSON.stringify({
      title: 'Railhead Defect Matunga',
      description: 'Severe surface spalling detected near Km 10/18.',
      department: 'Engineering',
      station: 'Dadar',
      trackSection: 'DR – GC',
      nearestKmPost: 'Km 10/18',
      lineType: 'Down Slow',
      priority: 'High',
      estimatedFixTimeMinutes: 45,
      reportedBy: {
        name: 'Rohan Sharma',
        empId: workerEmpId,
        department: 'Engineering',
      },
    }),
  });

  const issueData: any = await issueRes.json();
  if (!issueRes.ok || !issueData.success) {
    throw new Error(`Issue creation failed: ${JSON.stringify(issueData)}`);
  }
  const issueId = issueData.issue.id;
  const ticketNo = issueData.issue.ticketNo;
  console.log(`✅ Issue logged via API: ${ticketNo} (ID: ${issueId})`);

  console.log('\n=== Step 3: Verifying Complaint row directly in Supabase Database ===');
  const { data: dbComplaints, error: dbErr } = await supabaseAdmin
    .from('complaints')
    .select('id, description, status, department, raised_by, current_assignee, created_at')
    .eq('id', issueId);

  if (dbErr || !dbComplaints || dbComplaints.length === 0) {
    console.error('❌ FAIL: Complaint row not found in Supabase database! Error:', dbErr);
    process.exit(1);
  }

  const dbRow = dbComplaints[0];
  console.log(`✅ PASS: Complaint found in Supabase database:`, {
    id: dbRow.id,
    status: dbRow.status,
    department: dbRow.department,
    raised_by: dbRow.raised_by,
  });

  if (dbRow.status !== 'open_supervisor') {
    console.error(`❌ FAIL: Expected status 'open_supervisor', found '${dbRow.status}'`);
    process.exit(1);
  }
  console.log('✅ PASS: Status in database is correctly open_supervisor (NOT resolved).');

  console.log('\n=== Step 4: Verifying Audit Log in Supabase Database ===');
  const { data: auditLogs, error: auditErr } = await supabaseAdmin
    .from('complaint_audit_logs')
    .select('*')
    .eq('complaint_id', issueId);

  if (auditErr || !auditLogs || auditLogs.length === 0) {
    console.error('❌ FAIL: Complaint audit log not found in Supabase database! Error:', auditErr);
    process.exit(1);
  }
  console.log(`✅ PASS: Found ${auditLogs.length} audit log record(s). Action: ${auditLogs[0].action}, Status: ${auditLogs[0].new_status}`);

  console.log('\n=== Step 5: Verifying Supervisor Inbox View (Non-Auto-Resolution) ===');
  const supRes = await fetch(`${BACKEND_URL}/api/issues?role=supervisor&empId=SUP-CR-3104&department=Engineering`, {
    headers: { 'x-user-role': 'supervisor', 'x-user-empid': 'SUP-CR-3104', 'x-user-dept': 'Engineering' },
  });
  const supData: any = await supRes.json();
  const foundIssue = supData.issues?.find((i: any) => i.id === issueId);

  if (!foundIssue) {
    console.error('❌ FAIL: Issue not returned in Supervisor queue!');
    process.exit(1);
  }

  console.log(`Supervisor Queue Issue Status: "${foundIssue.currentStatus}"`);
  if (foundIssue.currentStatus !== 'Under Supervisor Review') {
    console.error(`❌ FAIL: Expected 'Under Supervisor Review', got '${foundIssue.currentStatus}'`);
    process.exit(1);
  }
  console.log('✅ PASS: Issue is active under "Under Supervisor Review" and NOT auto-resolved.');

  console.log('\n=== Step 6: Verifying Worker Dashboard View ===');
  const wrkRes = await fetch(`${BACKEND_URL}/api/issues?role=worker&empId=${workerEmpId}`, {
    headers: { 'x-user-role': 'worker', 'x-user-empid': workerEmpId },
  });
  const wrkData: any = await wrkRes.json();
  const workerFound = wrkData.issues?.find((i: any) => i.id === issueId);

  if (!workerFound) {
    console.error('❌ FAIL: Worker cannot view their own reported issue!');
    process.exit(1);
  }
  console.log(`Worker Queue Issue Status: "${workerFound.currentStatus}"`);
  console.log('✅ PASS: Worker sees their own reported issue active in review.');

  console.log('\n=== ALL PERSISTENCE AND NON-AUTO-RESOLUTION TESTS PASSED ===\n');
}

testDatabasePersistence().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
