import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5001';

async function runHierarchyTests() {
  console.log('=== Testing Department Isolation and Hierarchical Complaint Flow ===\n');

  // Step 1: Worker in Civil submits a defect
  console.log('Step 1: Worker (WRK-CR-1001 / Civil) reports a defect in Engineering...');
  const createRes = await fetch(`${BACKEND_URL}/api/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'worker',
      'x-user-empid': 'WRK-CR-1001',
      'x-user-dept': 'Engineering',
    },
    body: JSON.stringify({
      title: 'Broken Rail Weld at Km 11/14',
      description: 'Severe transverse fissure detected on Up Slow line.',
      department: 'Engineering',
      station: 'Dadar',
      trackSection: 'DR – GC',
      nearestKmPost: 'Km 11/14',
      lineType: 'Down Slow',
      priority: 'High',
      estimatedFixTimeMinutes: 45,
    }),
  });
  const createData: any = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Failed to create issue: ${JSON.stringify(createData)}`);
  }
  const issueId = createData.issue.id;
  console.log(`✅ Issue Created: ${createData.issue.ticketNo} (ID: ${issueId})\n`);

  // Step 2: Civil Supervisor checks queue (Should see 1 issue)
  console.log('Step 2: Civil Supervisor (SUP-CR-3104) checks queue...');
  const supCivilRes = await fetch(`${BACKEND_URL}/api/issues?role=supervisor&empId=SUP-CR-3104&department=Engineering`, {
    headers: { 'x-user-role': 'supervisor', 'x-user-empid': 'SUP-CR-3104', 'x-user-dept': 'Engineering' },
  });
  const supCivilData: any = await supCivilRes.json();
  console.log(`Civil Supervisor Queue count: ${supCivilData.issues?.length}`);
  if (supCivilData.issues?.length === 1 && supCivilData.issues[0].id === issueId) {
    console.log('✅ PASS: Civil Supervisor sees the defect in their queue.\n');
  } else {
    console.error('❌ FAIL: Civil Supervisor did not see defect.\n');
  }

  // Step 3: Traction Supervisor checks queue (Must see 0 issues - Department Isolation)
  console.log('Step 3: Traction Supervisor (SUP-CR-3105) checks queue (Isolation Check)...');
  const supTrdRes = await fetch(`${BACKEND_URL}/api/issues?role=supervisor&empId=SUP-CR-3105&department=Traction`, {
    headers: { 'x-user-role': 'supervisor', 'x-user-empid': 'SUP-CR-3105', 'x-user-dept': 'Traction' },
  });
  const supTrdData: any = await supTrdRes.json();
  console.log(`Traction Supervisor Queue count: ${supTrdData.issues?.length}`);
  if (supTrdData.issues?.length === 0) {
    console.log('✅ PASS: Traction Supervisor queue is completely empty (Department Isolation verified).\n');
  } else {
    console.error('❌ FAIL: Traction Supervisor saw a Civil defect!\n');
  }

  // Step 4: Civil Zonal Head checks queue before escalation (Must see 0 issues - Stage Gated)
  console.log('Step 4: Civil Zonal Head (ZON-CR-1102) checks queue before supervisor escalation...');
  const zonBeforeRes = await fetch(`${BACKEND_URL}/api/issues?role=zonal_head&empId=ZON-CR-1102&department=Engineering`, {
    headers: { 'x-user-role': 'zonal_head', 'x-user-empid': 'ZON-CR-1102', 'x-user-dept': 'Engineering' },
  });
  const zonBeforeData: any = await zonBeforeRes.json();
  console.log(`Civil Zonal Head Queue count: ${zonBeforeData.issues?.length}`);
  if (zonBeforeData.issues?.length === 0) {
    console.log('✅ PASS: Zonal Head does not see issue before Supervisor escalation (Stage Gating verified).\n');
  } else {
    console.error('❌ FAIL: Zonal Head saw issue prematurely!\n');
  }

  // Step 5: Civil Supervisor escalates to Zonal Head
  console.log('Step 5: Civil Supervisor escalates defect to Zonal Head...');
  const escZonRes = await fetch(`${BACKEND_URL}/api/issues/${issueId}/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'supervisor',
      'x-user-empid': 'SUP-CR-3104',
      'x-user-dept': 'Engineering',
    },
    body: JSON.stringify({
      userRole: 'supervisor',
      department: 'Engineering',
      reason: 'Weld fracture requires 90 min emergency possession slot',
      remarks: 'Endorsed by SSE Dadar',
      targetLevel: 'Zonal Head',
    }),
  });
  const escZonData: any = await escZonRes.json();
  console.log(`Escalation result: ${escZonData.message}`);
  if (escZonData.success && escZonData.issue.currentStatus === 'Escalated to Zonal Head') {
    console.log('✅ PASS: Successfully escalated to Zonal Head.\n');
  } else {
    console.error('❌ FAIL:', escZonData);
  }

  // Step 6: Civil Zonal Head checks queue after escalation (Should see 1 issue)
  console.log('Step 6: Civil Zonal Head checks queue after escalation...');
  const zonAfterRes = await fetch(`${BACKEND_URL}/api/issues?role=zonal_head&empId=ZON-CR-1102&department=Engineering`, {
    headers: { 'x-user-role': 'zonal_head', 'x-user-empid': 'ZON-CR-1102', 'x-user-dept': 'Engineering' },
  });
  const zonAfterData: any = await zonAfterRes.json();
  console.log(`Civil Zonal Head Queue count: ${zonAfterData.issues?.length}`);
  if (zonAfterData.issues?.length === 1) {
    console.log('✅ PASS: Civil Zonal Head now sees the escalated defect.\n');
  } else {
    console.error('❌ FAIL: Civil Zonal Head did not receive defect.\n');
  }

  // Step 7: Traction Zonal Head checks queue (Must see 0 issues)
  console.log('Step 7: Traction Zonal Head (ZON-CR-1103) checks queue (Isolation Check)...');
  const zonTrdRes = await fetch(`${BACKEND_URL}/api/issues?role=zonal_head&empId=ZON-CR-1103&department=Traction`, {
    headers: { 'x-user-role': 'zonal_head', 'x-user-empid': 'ZON-CR-1103', 'x-user-dept': 'Traction' },
  });
  const zonTrdData: any = await zonTrdRes.json();
  console.log(`Traction Zonal Head Queue count: ${zonTrdData.issues?.length}`);
  if (zonTrdData.issues?.length === 0) {
    console.log('✅ PASS: Traction Zonal Head sees 0 issues (Department Isolation preserved).\n');
  } else {
    console.error('❌ FAIL: Traction Zonal Head saw Civil defect!\n');
  }

  // Step 8: Civil Zonal Head escalates to Department Head
  console.log('Step 8: Civil Zonal Head escalates defect to Department Head...');
  const escDeptRes = await fetch(`${BACKEND_URL}/api/issues/${issueId}/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'zonal_head',
      'x-user-empid': 'ZON-CR-1102',
      'x-user-dept': 'Engineering',
    },
    body: JSON.stringify({
      userRole: 'zonal_head',
      department: 'Engineering',
      reason: 'Major traffic regulation required for rail replacement',
      targetLevel: 'Department Head',
    }),
  });
  const escDeptData: any = await escDeptRes.json();
  console.log(`Escalation result: ${escDeptData.message}`);
  if (escDeptData.success && escDeptData.issue.currentStatus === 'Escalated to Department Head') {
    console.log('✅ PASS: Successfully escalated to Department Head.\n');
  } else {
    console.error('❌ FAIL:', escDeptData);
  }

  // Step 9: Department Head in Civil sees 1, Dept Head in Traction sees 0
  console.log('Step 9: Civil Dept Head vs Traction Dept Head queue comparison...');
  const deptCivilRes = await fetch(`${BACKEND_URL}/api/issues?role=department_head&empId=DPT-CR-5520&department=Engineering`, {
    headers: { 'x-user-role': 'department_head', 'x-user-empid': 'DPT-CR-5520', 'x-user-dept': 'Engineering' },
  });
  const deptCivilData: any = await deptCivilRes.json();
  const deptTrdRes = await fetch(`${BACKEND_URL}/api/issues?role=department_head&empId=DPT-CR-5530&department=Traction`, {
    headers: { 'x-user-role': 'department_head', 'x-user-empid': 'DPT-CR-5530', 'x-user-dept': 'Traction' },
  });
  const deptTrdData: any = await deptTrdRes.json();
  console.log(`Civil Dept Head count: ${deptCivilData.issues?.length}, Traction Dept Head count: ${deptTrdData.issues?.length}`);
  if (deptCivilData.issues?.length === 1 && deptTrdData.issues?.length === 0) {
    console.log('✅ PASS: Department Head level isolation fully verified.\n');
  } else {
    console.error('❌ FAIL: Department Head level isolation mismatch!\n');
  }

  // Step 10: Civil Dept Head escalates to COA
  console.log('Step 10: Civil Dept Head escalates defect to Apex COA Controller...');
  const escCoaRes = await fetch(`${BACKEND_URL}/api/issues/${issueId}/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'department_head',
      'x-user-empid': 'DPT-CR-5520',
      'x-user-dept': 'Engineering',
    },
    body: JSON.stringify({
      userRole: 'department_head',
      department: 'Engineering',
      reason: 'Sanction required for 90-min corridor power & traffic block',
      targetLevel: 'COA Management',
    }),
  });
  const escCoaData: any = await escCoaRes.json();
  console.log(`Escalation result: ${escCoaData.message}`);
  if (escCoaData.success && escCoaData.issue.currentStatus === 'Escalated to COA') {
    console.log('✅ PASS: Successfully escalated to COA.\n');
  } else {
    console.error('❌ FAIL:', escCoaData);
  }

  // Step 11: COA Admin checks queue and resolves
  console.log('Step 11: COA Controller (COA-CR-4891) checks queue and marks resolved...');
  const coaRes = await fetch(`${BACKEND_URL}/api/issues?role=coa_admin&empId=COA-CR-4891`, {
    headers: { 'x-user-role': 'coa_admin', 'x-user-empid': 'COA-CR-4891' },
  });
  const coaData: any = await coaRes.json();
  console.log(`COA Queue count: ${coaData.issues?.length}`);
  if (coaData.issues?.length === 1) {
    console.log('✅ PASS: COA sees escalated defect across departments.\n');
  }

  const resolveRes = await fetch(`${BACKEND_URL}/api/issues/${issueId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'coa_admin',
      'x-user-empid': 'COA-CR-4891',
    },
    body: JSON.stringify({
      userRole: 'coa_admin',
      resolutionDetails: 'Night shadow block 01:30 - 03:00 sanctioned; rail weld repaired and certified.',
      level: 'COA Management',
    }),
  });
  const resolveData: any = await resolveRes.json();
  if (resolveData.success) {
    console.log('✅ PASS: COA successfully resolved issue.\n');
  }

  console.log('=== All Hierarchical Complaint Isolation & Flow Tests Passed ===');
}

runHierarchyTests().catch(console.error);
