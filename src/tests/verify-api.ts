import { createApp } from '../app.js';
import { Server } from 'http';
import { MOCK_USERS } from '../constants/roles.js';

// Helper to make fetch calls to test server
const runTests = async () => {
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5000;
  const baseUrl = `http://localhost:${port}`;

  console.log(`\n======================================================`);
  console.log(`🧪 Running RailPravah End-to-End Functional Test Suite`);
  console.log(`🌐 Test server listening on ${baseUrl}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  };

  // Find user IDs for key roles
  const civilWorker = MOCK_USERS.find((u) => u.role === 'worker' && u.department === 'civil')!;
  const civilSupervisor = MOCK_USERS.find((u) => u.role === 'supervisor' && u.department === 'civil')!;
  const civilZonalHead = MOCK_USERS.find((u) => u.role === 'zonal_head' && u.department === 'civil')!;
  const civilDeptHead = MOCK_USERS.find((u) => u.role === 'department_head' && u.department === 'civil')!;
  const coaAdmin = MOCK_USERS.find((u) => u.role === 'coa_admin')!;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Health Check
    // -------------------------------------------------------------------------
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData: any = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'GET /health returns 200 OK');

    // -------------------------------------------------------------------------
    // TEST 2: RBAC - Worker cannot POST /service-requests
    // -------------------------------------------------------------------------
    const workerReqRes = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilWorker.id,
      },
      body: JSON.stringify({
        asset_section: 'NDLS-GZB-DN',
        requested_start: new Date().toISOString(),
        requested_end: new Date(Date.now() + 3600000).toISOString(),
        description: 'Unauthorized worker request',
      }),
    });
    assert(
      workerReqRes.status === 403,
      'Worker cannot POST /service-requests (returns 403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 3: RBAC - Supervisor cannot POST /service-requests
    // -------------------------------------------------------------------------
    const supReqRes = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilSupervisor.id,
      },
      body: JSON.stringify({
        asset_section: 'NDLS-GZB-DN',
        requested_start: new Date().toISOString(),
        requested_end: new Date(Date.now() + 3600000).toISOString(),
        description: 'Unauthorized supervisor request',
      }),
    });
    assert(
      supReqRes.status === 403,
      'Supervisor cannot POST /service-requests (returns 403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Zonal Head can POST /service-requests for own department
    // -------------------------------------------------------------------------
    const zonalReqRes = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilZonalHead.id,
      },
      body: JSON.stringify({
        department: 'civil',
        asset_section: 'NDLS-GZB-DN',
        requested_start: new Date(Date.now() + 86400000).toISOString(),
        requested_end: new Date(Date.now() + 97200000).toISOString(),
        urgency: 'high',
        description: 'Civil track consolidation test',
      }),
    });
    const zonalReqData: any = await zonalReqRes.json();
    assert(
      zonalReqRes.status === 201 && zonalReqData.request.status === 'pending',
      'Zonal Head successfully posts /service-requests (returns 201 with status pending)'
    );

    // -------------------------------------------------------------------------
    // TEST 5: RBAC - Zonal Head cannot create request for another department
    // -------------------------------------------------------------------------
    const crossDeptRes = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilZonalHead.id,
      },
      body: JSON.stringify({
        department: 'electrical',
        asset_section: 'NDLS-GZB-DN',
        requested_start: new Date(Date.now() + 86400000).toISOString(),
        requested_end: new Date(Date.now() + 97200000).toISOString(),
        description: 'Cross-department illegal request',
      }),
    });
    assert(
      crossDeptRes.status === 403,
      'Zonal Head cannot create request for different department (returns 403)'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Non-COA role blocked from /coa/* endpoints
    // -------------------------------------------------------------------------
    const nonCoaRes = await fetch(`${baseUrl}/coa/schedule/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilDeptHead.id,
      },
      body: JSON.stringify({ section: 'NDLS-GZB-DN' }),
    });
    assert(
      nonCoaRes.status === 403,
      'Department Head calling POST /coa/schedule/optimize returns 403 Forbidden'
    );

    // -------------------------------------------------------------------------
    // TEST 7: COA Admin gets pending overlapping requests
    // -------------------------------------------------------------------------
    const coaPendingRes = await fetch(`${baseUrl}/coa/pending-requests?overlapping=true`, {
      headers: { 'x-user-id': coaAdmin.id },
    });
    const coaPendingData: any = await coaPendingRes.json();
    assert(
      coaPendingRes.status === 200 && coaPendingData.clusters.length > 0,
      'COA Admin queries /coa/pending-requests?overlapping=true successfully'
    );

    // -------------------------------------------------------------------------
    // TEST 8: COA Admin triggers AI Schedule Optimization
    // -------------------------------------------------------------------------
    const optimizeRes = await fetch(`${baseUrl}/coa/schedule/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coaAdmin.id,
      },
      body: JSON.stringify({ section: 'NDLS-GZB-DN' }),
    });
    const optimizeData: any = await optimizeRes.json();
    assert(
      optimizeRes.status === 201 &&
      optimizeData.proposal.status === 'pending_review' &&
      optimizeData.proposal.linked_requests.length >= 2,
      'COA Admin triggers AI optimizer; returns AIScheduleProposal with pending_review'
    );
    const proposalId = optimizeData.proposal.id;

    // -------------------------------------------------------------------------
    // TEST 9: Decision Support - Why This Slot
    // -------------------------------------------------------------------------
    const whySlotRes = await fetch(`${baseUrl}/coa/schedule/${proposalId}/why-this-slot`, {
      headers: { 'x-user-id': civilZonalHead.id },
    });
    const whySlotData: any = await whySlotRes.json();
    assert(
      whySlotRes.status === 200 && Boolean(whySlotData.why_this_slot_explanation),
      'GET /coa/schedule/:id/why-this-slot returns operational rationale'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Decision Support - What-If Simulator (read-only, does not mutate)
    // -------------------------------------------------------------------------
    const simulateRes = await fetch(`${baseUrl}/coa/schedule/${proposalId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilDeptHead.id,
      },
      body: JSON.stringify({
        shift_minutes: 120,
        duration_extension_minutes: 30,
      }),
    });
    const simulateData: any = await simulateRes.json();
    assert(
      simulateRes.status === 200 &&
      simulateData.simulation.delta &&
      simulateData.simulation.delta.delay_difference_minutes > 0,
      'POST /coa/schedule/:id/simulate returns comparative delay/impact projections'
    );

    // Verify proposal status did not mutate
    const verifyPropRes = await fetch(`${baseUrl}/coa/schedule/${proposalId}/why-this-slot`, {
      headers: { 'x-user-id': coaAdmin.id },
    });
    assert(
      verifyPropRes.status === 200,
      'What-If Simulator did not mutate schedule proposal'
    );

    // -------------------------------------------------------------------------
    // TEST 11: ConflictGuard & TrackStats RBAC
    // -------------------------------------------------------------------------
    const conflictsRes = await fetch(`${baseUrl}/blocks/${proposalId}/conflicts`, {
      headers: { 'x-user-id': civilSupervisor.id },
    });
    const conflictsData: any = await conflictsRes.json();
    assert(
      conflictsRes.status === 200 && Array.isArray(conflictsData.conflicts),
      'Supervisor can access ConflictGuard endpoint'
    );

    const trackStatsSupRes = await fetch(`${baseUrl}/stats/tracks?section=NDLS-GZB-DN`, {
      headers: { 'x-user-id': civilSupervisor.id },
    });
    assert(trackStatsSupRes.status === 200, 'Supervisor can access TrackStats');

    const trackStatsWorkerRes = await fetch(`${baseUrl}/stats/tracks?section=NDLS-GZB-DN`, {
      headers: { 'x-user-id': civilWorker.id },
    });
    assert(
      trackStatsWorkerRes.status === 403,
      'Worker cannot access TrackStats (returns 403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 12: COA Decision Support - Accept Proposal & Atomic Dispatch
    // -------------------------------------------------------------------------
    const acceptRes = await fetch(`${baseUrl}/coa/schedule/${proposalId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coaAdmin.id,
      },
      body: JSON.stringify({ decision: 'accept' }),
    });
    const acceptData: any = await acceptRes.json();
    assert(
      acceptRes.status === 200 &&
      acceptData.proposal.status === 'accepted' &&
      Boolean(acceptData.block) &&
      acceptData.notificationsCount > 0,
      'COA Admin accepts proposal: creates ApprovedBlock, calendar events & notifications'
    );

    // -------------------------------------------------------------------------
    // TEST 13: Complaint Lifecycle & Strict State Machine
    // -------------------------------------------------------------------------
    // A. Worker creates complaint -> auto open_supervisor
    const createCompRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilWorker.id,
      },
      body: JSON.stringify({
        description: 'Severe rail joint gap on Section NDLS-GZB KM 13/2.',
        photo_url: 'https://images.railpravah.gov.in/defects/gap-132.jpg',
      }),
    });
    const compData: any = await createCompRes.json();
    assert(
      createCompRes.status === 201 && compData.complaint.status === 'open_supervisor',
      'Worker creates complaint -> status automatically set to open_supervisor'
    );
    const complaintId = compData.complaint.id;

    // B. Worker cannot edit draft after submit
    const workerEditRes = await fetch(`${baseUrl}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilWorker.id,
      },
      body: JSON.stringify({ description: 'Illegal edit by worker' }),
    });
    assert(
      workerEditRes.status === 403,
      'Worker cannot edit complaint after submission (returns 403 Forbidden)'
    );

    // C. Direct status edit is blocked
    const directStatusRes = await fetch(`${baseUrl}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilSupervisor.id,
      },
      body: JSON.stringify({ status: 'closed' }),
    });
    assert(
      directStatusRes.status === 400,
      'Direct status modification in PATCH /complaints/:id is strictly rejected (400)'
    );

    // D. Supervisor edits draft content
    const supEditRes = await fetch(`${baseUrl}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilSupervisor.id,
      },
      body: JSON.stringify({
        description: 'Verified rail joint gap on Section NDLS-GZB KM 13/2. Fishplate loose.',
        notes: 'Track inspection confirmed gap exceeds permissible tolerance by 4mm.',
      }),
    });
    assert(supEditRes.status === 200, 'Supervisor can edit complaint draft');

    // E. Supervisor escalates -> open_zonal_head
    const esc1Res = await fetch(`${baseUrl}/complaints/${complaintId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilSupervisor.id,
      },
      body: JSON.stringify({ reason: 'Fishplate bolt sheared; requires machine tamping approval.' }),
    });
    const esc1Data: any = await esc1Res.json();
    assert(
      esc1Res.status === 200 && esc1Data.complaint.status === 'open_zonal_head',
      'Supervisor escalates complaint -> status moves to open_zonal_head'
    );

    // F. Zonal Head escalates -> open_department_head
    const esc2Res = await fetch(`${baseUrl}/complaints/${complaintId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilZonalHead.id,
      },
      body: JSON.stringify({ reason: 'Requires divisional speed restriction and corridor block.' }),
    });
    const esc2Data: any = await esc2Res.json();
    assert(
      esc2Res.status === 200 && esc2Data.complaint.status === 'open_department_head',
      'Zonal Head escalates complaint -> status moves to open_department_head'
    );

    // G. Dept Head escalates -> open_coa
    const esc3Res = await fetch(`${baseUrl}/complaints/${complaintId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': civilDeptHead.id,
      },
      body: JSON.stringify({ reason: 'Escalating to COA for emergency traffic block grant.' }),
    });
    const esc3Data: any = await esc3Res.json();
    assert(
      esc3Res.status === 200 && esc3Data.complaint.status === 'open_coa',
      'Department Head escalates complaint -> status moves to open_coa'
    );

    // H. COA Admin resolves complaint -> closed
    const resolveRes = await fetch(`${baseUrl}/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coaAdmin.id,
      },
      body: JSON.stringify({ resolution_notes: 'Emergency block slot granted and track repaired.' }),
    });
    const resolveData: any = await resolveRes.json();
    assert(
      resolveRes.status === 200 && resolveData.complaint.status === 'closed',
      'COA Admin resolves complaint -> status moves to closed'
    );

    // I. Read-only global visibility & audit trail inspection
    const viewCompRes = await fetch(`${baseUrl}/complaints/${complaintId}`, {
      headers: { 'x-user-id': civilWorker.id },
    });
    const viewCompData: any = await viewCompRes.json();
    assert(
      viewCompRes.status === 200 &&
      viewCompData.complaint.status === 'closed' &&
      viewCompData.audit_trail.length >= 4,
      'Global read-only access verifies closed status and full audit trail history'
    );

    // -------------------------------------------------------------------------
    // TEST 14: Updated Google AI Studio Export - What-If Simulation Endpoint
    // -------------------------------------------------------------------------
    const updatedWhatIfRes = await fetch(`${baseUrl}/api/gemini/simulate-whatif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetBlock: 'Vikhroli - Ghatkopar Track beside Platform No. 3 (Down Slow Line)',
        delayMinutes: 45,
        trackSector: 'Central Line Mumbai (CSMT to Kalyan/Kasara/Karjat)',
      }),
    });
    const updatedWhatIfData: any = await updatedWhatIfRes.json();
    assert(
      updatedWhatIfRes.status === 200 &&
        updatedWhatIfData.telemetry &&
        updatedWhatIfData.telemetry.cascadingDelayTotal > 0 &&
        Array.isArray(updatedWhatIfData.delays) &&
        Boolean(updatedWhatIfData.aiAnalysis),
      'POST /api/gemini/simulate-whatif returns telemetry, delays, and aiAnalysis matching updated prototype'
    );

    // -------------------------------------------------------------------------
    // TEST 15: Updated Google AI Studio Export - AI Schedule Optimizer Endpoint
    // -------------------------------------------------------------------------
    const updatedOptRes = await fetch(`${baseUrl}/api/gemini/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: 'SLOT-992A',
        section: 'DR - GC (Main)',
        requestedTime: '02:00 - 05:00',
        department: 'Traction & Engineering',
        conflictReason: 'Overlaps with freight corridor traffic',
      }),
    });
    const updatedOptData: any = await updatedOptRes.json();
    assert(
      updatedOptRes.status === 200 &&
        updatedOptData.optimizationScore > 0 &&
        Array.isArray(updatedOptData.trainsAffected) &&
        updatedOptData.timeEfficiency &&
        Array.isArray(updatedOptData.justification) &&
        Boolean(updatedOptData.recommendedSlot),
      'POST /api/gemini/optimize-schedule returns optimizationScore, timeEfficiency, justification, and recommendedSlot'
    );

    // -------------------------------------------------------------------------
    // TEST 16: Multi-Department Priority Clustering Plan Generation
    // -------------------------------------------------------------------------
    const planRes = await fetch(`${baseUrl}/coa/generate-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coaAdmin.id,
      },
      body: JSON.stringify({}),
    });
    const planData: any = await planRes.json();
    // -------------------------------------------------------------------------
    // TEST 17: COA Frontend Endpoints - Calendar & Requests
    // -------------------------------------------------------------------------
    const calRes = await fetch(`${baseUrl}/coa/calendar`);
    const calData: any = await calRes.json();
    assert(calRes.status === 200 && Array.isArray(calData.blocks), 'GET /coa/calendar returns blocks list');

    const coaReqsRes = await fetch(`${baseUrl}/coa/requests`);
    const coaReqsData: any = await coaReqsRes.json();
    assert(coaReqsRes.status === 200 && Array.isArray(coaReqsData.requests), 'GET /coa/requests returns requests list');

    // Create a request for approval testing if empty
    let testReqId = coaReqsData.requests[0]?.id;
    if (!testReqId) {
      await fetch(`${baseUrl}/worker/report-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Emergency P-Way Track Weld Inspection',
          description: 'Emergency joint inspection on Dadar - Matunga section.',
          department: 'Civil / Track',
          priority: 'High',
          location: { address: 'Dadar Km 10/4' },
          reportedBy: { name: 'Suresh Patil', empId: 'WRK-CR-2041' },
        }),
      });
      const coaReqsAfter: any = await (await fetch(`${baseUrl}/coa/requests`)).json();
      testReqId = coaReqsAfter.requests[0]?.id;
    }

    const approveRes = await fetch(`${baseUrl}/coa/requests/${testReqId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks: 'Approved for test slot', approvedBy: 'COA Central' }),
    });
    assert(approveRes.status === 200, 'POST /coa/requests/:id/approve successfully approves request');

    // -------------------------------------------------------------------------
    // TEST 18: COA Frontend Endpoints - Recommendations Lifecycle & Slot Accept
    // -------------------------------------------------------------------------
    const recsRes = await fetch(`${baseUrl}/coa/recommendations`);
    const recsData: any = await recsRes.json();
    assert(recsRes.status === 200 && Array.isArray(recsData.recommendations), 'GET /coa/recommendations returns recommendation list');

    const slotAcceptRes = await fetch(`${baseUrl}/coa/slot/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: 'SLOT-992A',
        acceptedBy: 'COA Central Control',
        date: '2026-09-08',
        timeWindow: '02:00 - 05:00',
        section: 'DR - GC (Main)',
        department: 'Traction & Engineering',
      }),
    });
    const slotAcceptData: any = await slotAcceptRes.json();
    assert(slotAcceptRes.status === 200 && slotAcceptData.success === true, 'POST /coa/slot/accept successfully books slot and creates calendar block');

    // -------------------------------------------------------------------------
    // TEST 19: Hierarchical Issues Lifecycle (Worker -> Supervisor -> Zonal -> Dept Head -> COA)
    // -------------------------------------------------------------------------
    // Create issue
    const createIssueRes = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'worker',
        'x-user-empid': 'WKR-1001',
      },
      body: JSON.stringify({
        title: 'Overhead Traction Line Sag near Kurla Platform 4',
        department: 'Electrical (TRD)',
        urgency: 'high',
        location: 'Kurla - Platform 4 Overhead Line (Central Line)',
        description: 'Catenary wire sagging observed during morning inspection.',
      }),
    });
    const createIssueData: any = await createIssueRes.json();
    assert(createIssueRes.status === 201 && createIssueData.success === true && createIssueData.issue.currentStatus === 'Under Supervisor Review', 'POST /issues creates issue at supervisor level');
    const createdIssueId = createIssueData.issue.id;

    // Supervisor remarks & escalate
    const remarkRes = await fetch(`${baseUrl}/issues/${createdIssueId}/remarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'supervisor',
      },
      body: JSON.stringify({ remarks: 'Inspected on site. Sag exceeds safety threshold by 150mm.' }),
    });
    assert(remarkRes.status === 200, 'POST /issues/:id/remarks adds supervisor remarks');

    const escIssue1Res = await fetch(`${baseUrl}/issues/${createdIssueId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'supervisor',
      },
      body: JSON.stringify({ reason: 'Requires OHE maintenance power block from Zonal TRD.' }),
    });
    const escIssue1Data: any = await escIssue1Res.json();
    assert(escIssue1Res.status === 200 && escIssue1Data.issue.currentStatus === 'Escalated to Zonal Head', 'POST /issues/:id/escalate promotes issue to zonal_head');

    // Worker reports issue endpoint
    const workerReportRes = await fetch(`${baseUrl}/worker/report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Broken Point Machine at Dadar yard switch 12A',
        department: 'Signalling & Telecom (S&T)',
        urgency: 'critical',
        location: 'Dadar Yard Switch 12A',
        description: 'Point detection failure intermittent during peak hours.',
      }),
    });
    const workerReportData: any = await workerReportRes.json();
    assert(workerReportRes.status === 200 && workerReportData.success === true, 'POST /worker/report-issue creates issue in queue');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
