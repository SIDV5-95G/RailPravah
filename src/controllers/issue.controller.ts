/**
 * Issue Controller
 * Implements hierarchical issue management endpoints for the RAIL_PRAVAH_FRONTEND.
 * Ported from the frontend's monolithic server.ts.
 */
import { Request, Response } from 'express';
import { coaFrontendStore } from '../db/coa-frontend-store.js';
import { broadcastSlotApprovalNotification } from './coa-frontend.controller.js';
import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { getValidProfileId } from '../services/profile-lookup.js';
import {
  HierarchicalIssue,
  IssueLifecycleStatus,
  IssueModificationRecord,
  PriorityType,
} from '../types/coa-frontend.types.js';

import { randomUUID } from 'crypto';

// Helper to persist issue events to Supabase asynchronously
async function syncIssueToSupabase(
  action: 'created' | 'draft_edit' | 'escalated' | 'resolved' | 'remarks',
  issue: HierarchicalIssue,
  notes?: string,
  actorEmpId?: string
) {
  if (!isSupabaseConfigured()) return;
  try {
    let dept = 'civil';
    const deptStr = (issue.department || '').toLowerCase();
    if (deptStr.includes('elect') || deptStr.includes('trd')) dept = 'electrical';
    else if (deptStr.includes('sign') || deptStr.includes('s&t')) dept = 'signal_comm';

    let status = 'open_supervisor';
    if (issue.currentStatus.includes('Resolved') || issue.currentStatus.includes('Closed') || action === 'resolved') {
      status = 'closed';
    } else if (issue.currentStatus.includes('Zonal')) {
      status = 'open_zonal_head';
    } else if (issue.currentStatus.includes('Department')) {
      status = 'open_department_head';
    } else if (issue.currentStatus.includes('COA')) {
      status = 'open_coa';
    }

    const validActorId = await getValidProfileId(
      actorEmpId || issue.originalRequest?.reportedBy?.empId || (issue as any).reportedBy?.empId,
      {
        name: issue.originalRequest?.reportedBy?.name || (issue as any).reportedBy?.name,
        role: 'worker',
        department: dept,
      }
    );
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issue.id);
    const complaintId = isUuid ? issue.id : undefined;

    const photoUrl =
      issue.activeRequest?.media?.find((m: any) => m.type === 'image' || m.url)?.url ||
      issue.activeRequest?.media?.[0]?.url ||
      (issue as any).photoUrl ||
      (issue.originalRequest as any)?.photoUrl ||
      issue.originalRequest?.media?.find((m: any) => m.type === 'image' || m.url)?.url ||
      null;

    const priorityStr = issue.activeRequest?.priority || 'High';
    const estTimeStr = issue.activeRequest?.estimatedFixTimeMinutes ? `${issue.activeRequest.estimatedFixTimeMinutes}m` : '45m';

    if (action === 'created') {
      let supervisorId: string | null = null;
      try {
        const { data: workerProfile } = await supabaseAdmin
          .from('profiles')
          .select('reports_to')
          .eq('id', validActorId)
          .single();
        if (workerProfile?.reports_to) {
          supervisorId = workerProfile.reports_to;
        }
      } catch (profErr) {
        console.warn('Note querying worker supervisor:', profErr);
      }

      const payload: any = {
        raised_by: validActorId,
        department: dept as any,
        description: `[${issue.activeRequest.title}]: ${issue.activeRequest.description} (Station: ${issue.station}, Track: ${issue.activeRequest.trackSection}, Post: ${issue.activeRequest.nearestKmPost}, Line: ${issue.activeRequest.lineType}, Priority: ${priorityStr}, EstTime: ${estTimeStr})`,
        photo_url: photoUrl,
        status: status as any,
        current_assignee: supervisorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (complaintId) {
        payload.id = complaintId;
      }
      const { data: inserted, error: insErr } = await supabaseAdmin.from('complaints').insert(payload).select('id').single();
      if (insErr) {
        console.warn('Supabase complaint insert note:', insErr.message);
      } else if (inserted && inserted.id) {
        await supabaseAdmin.from('complaint_audit_logs').insert({
          complaint_id: inserted.id,
          actor_id: validActorId,
          action: 'created',
          new_status: status as any,
          notes: notes || 'Defect reported from field',
          created_at: new Date().toISOString(),
        });
      }
    } else if (complaintId) {
      if (action === 'resolved' || status === 'closed') {
        const { error: updErr } = await supabaseAdmin
          .from('complaints')
          .update({
            status: 'closed',
            resolved_by: validActorId,
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', complaintId);
        if (updErr) {
          console.warn('Supabase complaint update error on resolution:', updErr.message);
        } else {
          console.log(`Complaint ${complaintId} marked resolved/closed in Supabase.`);
          await supabaseAdmin.from('complaint_audit_logs').insert({
            complaint_id: complaintId,
            actor_id: validActorId,
            action: 'resolved',
            new_status: 'closed',
            notes: notes || `Resolved at ${issue.currentStatus}`,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        const updatePayload: any = {
          status: status as any,
          description: `[${issue.activeRequest.title}]: ${issue.activeRequest.description} (Station: ${issue.station}, Track: ${issue.activeRequest.trackSection}, Post: ${issue.activeRequest.nearestKmPost}, Line: ${issue.activeRequest.lineType}, Priority: ${priorityStr}, EstTime: ${estTimeStr})`,
          updated_at: new Date().toISOString(),
        };
        if (photoUrl) {
          updatePayload.photo_url = photoUrl;
        }
        const { error: updErr } = await supabaseAdmin.from('complaints').update(updatePayload).eq('id', complaintId);
        if (updErr) {
          console.warn('Supabase complaint update note:', updErr.message);
        } else {
          const auditAction = action === 'draft_edit' ? 'draft_edit' : action === 'escalated' ? 'escalated' : 'draft_edit';
          await supabaseAdmin.from('complaint_audit_logs').insert({
            complaint_id: complaintId,
            actor_id: validActorId,
            action: auditAction,
            new_status: status as any,
            notes: notes || `Action: ${action}`,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('Supabase syncIssue error (non-fatal):', err);
  }
}

// ─── Helper: Normalize Department Strings ──────────────────────────────────
export function normalizeDept(dept?: string | null): 'civil' | 'electrical' | 'signal_comm' {
  if (!dept) return 'civil';
  const d = dept.toLowerCase().trim();
  if (d.includes('elect') || d.includes('trd') || d.includes('tract')) return 'electrical';
  if (d.includes('sign') || d.includes('s&t') || d.includes('comm')) return 'signal_comm';
  return 'civil';
}

// ─── Helper: Determine if role and department can view issue ─────────────────
function canUserViewIssue(
  issue: HierarchicalIssue,
  userRole: string,
  userEmpId?: string,
  userDepartment?: string
): boolean {
  if (!userRole) return true;

  const role = userRole.toLowerCase();

  // 1. Apex COA Controller: can view any issue that has reached COA level across all departments
  if (role === 'coa_admin' || role === 'coa') {
    const coaAllowed: IssueLifecycleStatus[] = [
      'Escalated to COA',
      'Under COA Review',
      'Sanctioned by COA',
      'Resolved / Closed',
      'Resolved by Supervisor',
      'Resolved by Zonal Head',
      'Resolved by Department Head',
    ];
    return coaAllowed.includes(issue.currentStatus);
  }

  // 2. Field Worker: can ONLY view defects reported by themselves
  if (role === 'worker') {
    if (userEmpId && issue.originalRequest.reportedBy.empId !== userEmpId) {
      return false;
    }
    return true;
  }

  // 3. Department-scoped maintenance roles (Supervisor, Zonal Head, Dept Head):
  // MUST strictly match the issue's department!
  if (userDepartment) {
    const userDeptNorm = normalizeDept(userDepartment);
    const issueDeptNorm = normalizeDept(issue.department || (issue.activeRequest as any)?.department);
    if (userDeptNorm !== issueDeptNorm) {
      console.log(`canUserViewIssue DEPT MISMATCH: userDeptNorm=${userDeptNorm}, issueDeptNorm=${issueDeptNorm}, issue.department=${issue.department}`);
      return false;
    }
  }

  // Stage-gated lifecycle permissions within the department:
  if (role === 'supervisor') {
    // Supervisor sees everything in their department from initial worker report onwards
    return true;
  }

  if (role === 'zonal_head') {
    const zonalAllowed: IssueLifecycleStatus[] = [
      'Escalated to Zonal Head',
      'Under Zonal Review',
      'Resolved by Zonal Head',
      'Escalated to Department Head',
      'Under Department Review',
      'Resolved by Department Head',
      'Escalated to COA',
      'Under COA Review',
      'Sanctioned by COA',
      'Resolved / Closed',
    ];
    const allowed = zonalAllowed.includes(issue.currentStatus);
    if (!allowed) {
      console.log(`canUserViewIssue ZONAL STAGE REJECTED: issue.currentStatus=${issue.currentStatus}`);
    }
    return allowed;
  }

  if (role === 'department_user' || role === 'department_head' || role === 'dept_head') {
    const deptAllowed: IssueLifecycleStatus[] = [
      'Escalated to Department Head',
      'Under Department Review',
      'Resolved by Department Head',
      'Escalated to COA',
      'Under COA Review',
      'Sanctioned by COA',
      'Resolved / Closed',
    ];
    return deptAllowed.includes(issue.currentStatus);
  }

  return true;
}

// Load live complaints from Supabase into memory
async function loadComplaintsFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { data: allProfilesData } = await supabaseAdmin.from('profiles').select('*');
    const profilesList = allProfilesData || [];
    const profilesById = new Map<string, any>(profilesList.map((p: any) => [p.id, p]));

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        raised_by_profile:profiles!complaints_raised_by_fkey(id, name, role, department, email, reports_to),
        audit_logs:complaint_audit_logs(*)
      `)
      .order('created_at', { ascending: false });

    if (error || !complaints) {
      if (error) console.warn('Error querying complaints from Supabase:', error.message);
      return;
    }

    const mappedList: HierarchicalIssue[] = [];

    for (const c of complaints) {
      let status: IssueLifecycleStatus = 'Under Supervisor Review';
      const resolverProfile = c.resolved_by ? profilesById.get(c.resolved_by) : null;
      const lastResolveLog = (c.audit_logs || []).filter((l: any) => l.action === 'resolved').pop();
      const resolverFromLog = lastResolveLog?.actor_id ? profilesById.get(lastResolveLog.actor_id) : null;
      const effectiveResolver = resolverProfile || resolverFromLog;
      const logNotes = (lastResolveLog?.notes || '').toLowerCase();

      if (c.status === 'closed' || c.resolved_at || c.resolved_by) {
        if (effectiveResolver?.role === 'zonal_head' || logNotes.includes('zonal')) {
          status = 'Resolved by Zonal Head';
        } else if (
          effectiveResolver?.role === 'department_head' ||
          effectiveResolver?.role === 'department_user' ||
          logNotes.includes('department') ||
          logNotes.includes('whyslot')
        ) {
          status = 'Resolved by Department Head';
        } else if (
          effectiveResolver?.role === 'coa_admin' ||
          effectiveResolver?.role === 'coa' ||
          logNotes.includes('coa') ||
          logNotes.includes('slot assigned') ||
          logNotes.includes('sanctioned')
        ) {
          status = 'Sanctioned by COA';
        } else if (effectiveResolver?.role === 'supervisor' || logNotes.includes('supervisor')) {
          status = 'Resolved by Supervisor';
        } else {
          status = 'Resolved by Supervisor';
        }
      } else if (c.status === 'open_zonal_head') {
        status = 'Escalated to Zonal Head';
      } else if (c.status === 'open_department_head') {
        status = 'Escalated to Department Head';
      } else if (c.status === 'open_coa') {
        status = 'Escalated to COA';
      }

      const worker = c.raised_by_profile;
      const workerName = worker?.name || 'Field Worker';
      const workerEmpId = worker?.email?.split('@')[0]?.toUpperCase() || 'WRK-001';

      // Traverse hierarchy dynamically
      const supervisor =
        (worker?.reports_to ? profilesById.get(worker.reports_to) : null) ||
        profilesList.find((p: any) => p.role === 'supervisor' && p.department === c.department) ||
        profilesList.find((p: any) => p.role === 'supervisor');

      const zonalHead =
        (supervisor?.reports_to ? profilesById.get(supervisor.reports_to) : null) ||
        profilesList.find((p: any) => p.role === 'zonal_head' && p.department === c.department) ||
        profilesList.find((p: any) => p.role === 'zonal_head');

      const departmentHead =
        (zonalHead?.reports_to ? profilesById.get(zonalHead.reports_to) : null) ||
        profilesList.find((p: any) => p.role === 'department_head' && p.department === c.department) ||
        profilesList.find((p: any) => p.role === 'department_head');

      const titleMatch = (c.description || '').match(/^\[(.*?)\]:\s*(.*)$/);
      const title = titleMatch ? titleMatch[1] : 'Field Defect Report';
      const rawDesc = titleMatch ? titleMatch[2] : c.description || '';

      const stationMatch = rawDesc.match(/Station:\s*([^,\)]+)/i);
      const trackMatch = rawDesc.match(/Track:\s*([^,\)]+)/i);
      const postMatch = rawDesc.match(/Post:\s*([^,\)]+)/i);
      const lineMatch = rawDesc.match(/Line:\s*([^,\)]+)/i);
      const priorityMatch = rawDesc.match(/Priority:\s*([^,\)]+)/i);
      const estTimeMatch = rawDesc.match(/EstTime:\s*([^,\)]+)/i);

      const dynamicStation = stationMatch ? stationMatch[1].trim() : 'Dadar';
      const dynamicTrack = trackMatch ? trackMatch[1].trim() : 'DR – GC';
      const dynamicPost = postMatch ? postMatch[1].trim() : 'Km 10/4';
      const dynamicLine = (lineMatch ? lineMatch[1].trim() : 'Down Slow') as any;
      const dynamicPriority = (priorityMatch
        ? priorityMatch[1].trim()
        : c.urgency
        ? c.urgency === 'emergency'
          ? 'Emergency'
          : c.urgency === 'high'
          ? 'High'
          : c.urgency === 'low'
          ? 'Low'
          : 'Medium'
        : 'High') as PriorityType;
      const dynamicEstTime = estTimeMatch ? parseInt(estTimeMatch[1].replace(/\D/g, '')) || 45 : 45;

      const cleanDesc = rawDesc.replace(/\s*\([^\)]*Station:[^\)]*\)$/i, '').trim();

      const mediaArr = c.photo_url ? [{ id: 'photo-1', name: 'defect_photo.jpg', type: 'image', url: c.photo_url, size: '2.4 MB' }] : [];

      const mappedIssue: HierarchicalIssue = {
        id: c.id,
        ticketNo: `CR-WRK-${c.created_at ? new Date(c.created_at).getFullYear() : '2026'}-${c.id.substring(0, 4).toUpperCase()}`,
        currentStatus: status,
        station: dynamicStation,
        zone: 'Central Zone',
        department: c.department === 'civil' ? 'Civil / Track' : c.department === 'electrical' ? 'Electrical / Traction' : 'Signal & Telecom',
        supervisor: {
          name: supervisor?.name || 'Section Supervisor (SSE)',
          empId: supervisor?.email?.split('@')[0]?.toUpperCase() || 'SUP-CR-001',
          designation: supervisor?.role === 'supervisor' ? `Senior Section Engineer (SSE / ${c.department})` : 'SSE',
          phone: '+91 98201 44521',
          depot: `${c.department === 'civil' ? 'P-Way' : c.department === 'electrical' ? 'TRD' : 'S&T'} Maintenance Depot`,
        },
        zonalHead: {
          name: zonalHead?.name || 'Chief Track Engineer',
          empId: zonalHead?.email?.split('@')[0]?.toUpperCase() || 'ZON-CR-001',
          designation: `Chief Engineer (${c.department})`,
          zone: 'Central Railway Zone',
        },
        departmentHead: {
          name: departmentHead?.name || 'Sr. Divisional Engineer',
          empId: departmentHead?.email?.split('@')[0]?.toUpperCase() || 'DPT-CR-001',
          designation: `Sr. Divisional Engineer (${c.department})`,
          department: `${c.department} Department`,
        },
        originalRequest: {
          title,
          department: c.department === 'civil' ? 'Civil / Track' : c.department === 'electrical' ? 'Electrical / Traction' : 'Signal & Telecom',
          station: dynamicStation,
          trackSection: dynamicTrack,
          nearestKmPost: dynamicPost,
          lineType: dynamicLine,
          coordinates: { lat: 19.0269, lng: 72.8488 },
          description: cleanDesc,
          priority: dynamicPriority,
          estimatedFixTimeMinutes: dynamicEstTime,
          media: mediaArr,
          technicalNotes: 'Retrieved from Supabase live database',
          reportedBy: { name: workerName, empId: workerEmpId, phone: '+91 97692 31204', gangNo: 'P-Way Gang' },
          reportedAt: c.created_at?.substring(0, 16).replace('T', ' ') || '',
        },
        activeRequest: {
          title,
          department: c.department === 'civil' ? 'Civil / Track' : c.department === 'electrical' ? 'Electrical / Traction' : 'Signal & Telecom',
          station: dynamicStation,
          trackSection: dynamicTrack,
          nearestKmPost: dynamicPost,
          lineType: dynamicLine,
          coordinates: { lat: 19.0269, lng: 72.8488 },
          description: cleanDesc,
          priority: dynamicPriority,
          estimatedFixTimeMinutes: dynamicEstTime,
          media: mediaArr,
          technicalNotes: 'Retrieved from Supabase live database',
        },
        modificationHistory: (c.audit_logs || []).map((l: any, idx: number) => ({
          id: l.id || `mod-${idx}`,
          level: 'Worker',
          modifiedBy: { name: workerName, empId: workerEmpId, role: 'Field Worker' },
          dateTime: l.created_at?.substring(0, 16).replace('T', ' ') || '',
          changes: l.action,
          remarks: l.notes || '',
          actionTaken: l.action,
        })),
        resolvedAt: c.resolved_at || (c.status === 'closed' ? c.updated_at || c.created_at : undefined),
        resolvedBy: (c.status === 'closed' || c.resolved_at || c.resolved_by)
          ? {
              name: effectiveResolver?.name || (status.includes('Zonal') ? 'Chief Track Engineer' : status.includes('Department') ? 'Sr. Divisional Engineer' : status.includes('COA') ? 'COA Central Dispatch' : 'Section Supervisor (SSE)'),
              empId: effectiveResolver?.email?.split('@')[0]?.toUpperCase() || (status.includes('Zonal') ? 'ZON-CR-001' : status.includes('Department') ? 'DPT-CR-001' : status.includes('COA') ? 'COA-CR-001' : 'SUP-CR-001'),
              level: status.includes('Zonal')
                ? 'Zonal Head'
                : status.includes('Department')
                ? 'Department Head'
                : status.includes('COA')
                ? 'COA Management'
                : 'Supervisor',
            }
          : undefined,
        resolutionDetails: lastResolveLog?.notes || (status ? `Resolved and certified at ${status}` : undefined),
        createdAt: c.created_at?.substring(0, 16).replace('T', ' ') || '',
        updatedAt: c.updated_at?.substring(0, 16).replace('T', ' ') || '',
      };
      mappedList.push(mappedIssue);
    }

    // Strictly mirror Supabase table
    coaFrontendStore.hierarchicalIssues = mappedList;
  } catch (err) {
    console.warn('Error loading complaints from Supabase:', err);
  }
}

/** GET /issues — Role & Department-enforced list */
export const listIssues = async (req: Request, res: Response): Promise<void> => {
  await loadComplaintsFromSupabase();

  const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || req.query.empId || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.query.department || req.query.dept || '') as string;
  const userStation = (req.headers['x-user-station'] || req.query.station || '') as string;
  const filterStatus = (req.query.status || '') as string;

  let filtered = coaFrontendStore.hierarchicalIssues.filter((issue) =>
    canUserViewIssue(issue, userRole, userEmpId, userDept)
  );

  if (filterStatus) filtered = filtered.filter((i) => i.currentStatus === filterStatus);
  if (userStation && userStation !== 'all') {
    filtered = filtered.filter((i) => i.station.toLowerCase().includes(userStation.toLowerCase()));
  }

  res.json({ success: true, total: filtered.length, userRole, department: userDept, issues: filtered });
};

/** GET /issues/:id — Single issue with audit trail */
export const getIssueById = async (req: Request, res: Response): Promise<void> => {
  await loadComplaintsFromSupabase();

  const { id } = req.params;
  const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || req.query.empId || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.query.department || req.query.dept || '') as string;

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) { res.status(404).json({ success: false, error: 'Issue not found' }); return; }

  if (userRole && !canUserViewIssue(issue, userRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to view this issue in your department or at its current hierarchy stage.' });
    return;
  }
  res.json({ success: true, issue });
};

/** POST /issues — Worker creates a new issue */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  if (!body || !body.description) {
    res.status(400).json({ success: false, error: 'Missing required issue fields' }); return;
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  const issueId = (body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) ? body.id : randomUUID();
  const ticketNo = `CR-WRK-${new Date().getFullYear()}-${issueId.substring(0, 4).toUpperCase()}`;

  const snapshot = {
    title: body.title || 'Track & Infrastructure Defect',
    department: body.department || 'Engineering',
    station: body.station || 'Dadar',
    trackSection: body.trackSection || 'DR – GC',
    nearestKmPost: body.nearestKmPost || 'Km 11/14',
    lineType: body.lineType || 'Down Slow',
    coordinates: body.coordinates || { lat: 19.0269, lng: 72.8488 },
    description: body.description,
    voiceTranscript: body.voiceTranscript,
    priority: body.priority || 'High',
    estimatedFixTimeMinutes: Number(body.estimatedFixTimeMinutes) || 45,
    media: body.media || [],
    technicalNotes: body.technicalNotes || '',
  };

  const deptNorm = normalizeDept(snapshot.department);
  let defaultSupervisor = {
    name: 'Rajesh K. Shinde', empId: 'SUP-CR-3104', designation: 'Senior Section Engineer (SSE / P-Way Dadar)',
    phone: '+91 98201 44521', depot: 'Dadar P-Way Maintenance Depot (Km 9/12)',
  };
  let defaultZonalHead = {
    name: 'Virendra K. Meena', empId: 'ZON-CR-1102',
    designation: 'Chief Track Engineer (CTE / HQ CSMT)', zone: 'Central Railway Zone',
  };
  let defaultDeptHead = {
    name: 'Dr. Pradeep Verma', empId: 'DPT-CR-5520',
    designation: 'Sr. Divisional Engineer (Sr. DEN / Civil)', department: 'Civil Engineering Department',
  };

  if (deptNorm === 'electrical') {
    defaultSupervisor = {
      name: 'Sunil G. Gaikwad', empId: 'SUP-CR-3105', designation: 'Senior Section Engineer (SSE / TRD Kalyan)',
      phone: '+91 98201 44522', depot: 'Kalyan TRD Maintenance Depot (Km 54/02)',
    };
    defaultZonalHead = {
      name: 'A. P. Deshmukh', empId: 'ZON-CR-1103',
      designation: 'Chief Electrical Engineer (CEE / Traction)', zone: 'Central Railway Zone',
    };
    defaultDeptHead = {
      name: 'K. R. Narayanan', empId: 'DPT-CR-5530',
      designation: 'Sr. Divisional Electrical Engineer (Sr. DEE / TRD)', department: 'Traction Distribution Department',
    };
  } else if (deptNorm === 'signal_comm') {
    defaultSupervisor = {
      name: 'Deepak V. Kulkarni', empId: 'SUP-CR-3106', designation: 'Senior Section Engineer (SSE / S&T Kurla)',
      phone: '+91 98201 44523', depot: 'Kurla Signal & Telecom Depot (Km 15/08)',
    };
    defaultZonalHead = {
      name: 'M. K. Saraf', empId: 'ZON-CR-1104',
      designation: 'Chief Signal Engineer (CSTE / Signals)', zone: 'Central Railway Zone',
    };
    defaultDeptHead = {
      name: 'S. N. Radhakrishnan', empId: 'DPT-CR-5540',
      designation: 'Sr. Divisional Signal Engineer (Sr. DSTE)', department: 'Signal & Telecom Department',
    };
  }

  const workerInfo = body.reportedBy || {
    name: 'Field Worker', empId: (req.headers['x-user-empid'] as string) || 'WRK-CR-1001', phone: '+91 97692 31204', gangNo: 'Central Gang #04',
  };
  const supervisorInfo = body.supervisor || defaultSupervisor;

  const initialHistory: IssueModificationRecord = {
    id: `mod-${Date.now()}-1`,
    level: 'Worker',
    modifiedBy: { name: workerInfo.name, empId: workerInfo.empId, role: 'Field Worker', department: snapshot.department },
    dateTime: nowStr,
    changes: 'Original field defect report logged',
    remarks: body.description,
    actionTaken: 'Reported to Section Supervisor for review',
  };

  const newIssue: HierarchicalIssue = {
    id: issueId,
    ticketNo,
    currentStatus: 'Under Supervisor Review',
    station: snapshot.station,
    zone: 'Central Zone',
    department: snapshot.department,
    supervisor: supervisorInfo,
    zonalHead: defaultZonalHead,
    departmentHead: defaultDeptHead,
    originalRequest: { ...snapshot, reportedBy: workerInfo, reportedAt: nowStr },
    activeRequest: { ...snapshot },
    modificationHistory: [initialHistory],
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  coaFrontendStore.hierarchicalIssues.unshift(newIssue);
  await syncIssueToSupabase('created', newIssue, body.description, workerInfo.empId);
  res.status(201).json({ success: true, message: 'Issue logged and transmitted to Supervisor for technical verification.', issue: newIssue });
};

// ─── Helper: Verify if user role currently holds active edit custody ────────
export function isRoleAuthorizedToModify(
  issue: HierarchicalIssue,
  userRole?: string
): { authorized: boolean; reason?: string } {
  if (!userRole) return { authorized: true };
  const role = userRole.toLowerCase();
  const status = issue.currentStatus;

  if (role === 'worker') {
    return {
      authorized: false,
      reason: 'Matter Escalated: Workers cannot modify complaints once submitted to Supervisor.',
    };
  }

  if (role === 'supervisor') {
    const supervisorAllowed = ['Reported', 'Under Supervisor Review'];
    if (!supervisorAllowed.includes(status)) {
      return {
        authorized: false,
        reason: `Matter Escalated: Complaint is currently at '${status}'. Section Supervisors cannot modify issues after escalating to Zonal Head.`,
      };
    }
    return { authorized: true };
  }

  if (role === 'zonal_head') {
    const zonalAllowed = ['Escalated to Zonal Head', 'Under Zonal Review'];
    if (!zonalAllowed.includes(status)) {
      return {
        authorized: false,
        reason: `Matter Escalated: Complaint is currently at '${status}'. Zonal Heads cannot modify issues after escalating to Department Head or COA.`,
      };
    }
    return { authorized: true };
  }

  if (role === 'department_user' || role === 'department_head' || role === 'dept_head') {
    const deptAllowed = ['Escalated to Department Head', 'Under Department Review'];
    if (!deptAllowed.includes(status)) {
      return {
        authorized: false,
        reason: `Matter Escalated: Complaint is currently at '${status}'. Department Heads cannot modify issues after escalating to COA.`,
      };
    }
    return { authorized: true };
  }

  if (role === 'coa_admin' || role === 'coa') {
    const coaAllowed = ['Escalated to COA', 'Under COA Review'];
    if (!coaAllowed.includes(status)) {
      return {
        authorized: false,
        reason: `Complaint is currently at '${status}'.`,
      };
    }
    return { authorized: true };
  }

  return { authorized: true };
}

/** PUT /issues/:id/edit */
export const editIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { modifiedBy, level, changesSummary, remarks, activeRequest } = req.body;

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) { res.status(404).json({ success: false, error: 'Issue not found' }); return; }

  const reqRole = (req.headers['x-user-role'] || req.body.userRole || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.body.department || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || modifiedBy?.empId || '') as string;

  const authCheck = isRoleAuthorizedToModify(issue, reqRole);
  if (!authCheck.authorized) {
    res.status(403).json({ success: false, error: authCheck.reason || 'Matter Escalated: Editing disabled at your hierarchy level.' });
    return;
  }

  if (reqRole && !canUserViewIssue(issue, reqRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to edit issues belonging to another department.' });
    return;
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  if (activeRequest) {
    issue.activeRequest = { ...issue.activeRequest, ...activeRequest, media: activeRequest.media || issue.activeRequest.media };
    if (activeRequest.station) issue.station = activeRequest.station;
  }

  issue.modificationHistory.push({
    id: `mod-${Date.now()}`,
    level: level || 'Supervisor',
    modifiedBy: modifiedBy || { name: 'Authorized Reviewer', empId: 'OFF-001', role: level || 'Supervisor' },
    dateTime: nowStr,
    changes: changesSummary || 'Technical parameters and scope updated',
    remarks: remarks || 'Scope revised during handover inspection',
    actionTaken: 'Active request updated by ' + (level || 'Reviewer'),
  });
  issue.updatedAt = nowStr;

  await syncIssueToSupabase('draft_edit', issue, remarks || changesSummary, modifiedBy?.empId);
  res.json({ success: true, message: 'Issue active request updated successfully. Original worker submission preserved.', issue });
};

/** POST /issues/:id/escalate */
export const escalateIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userRole, modifiedBy, reason, remarks, targetLevel } = req.body;

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) { res.status(404).json({ success: false, error: 'Issue not found' }); return; }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  const effectiveRole = (req.headers['x-user-role'] || userRole || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.body.department || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || modifiedBy?.empId || '') as string;

  if (effectiveRole && !canUserViewIssue(issue, effectiveRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You cannot escalate issues belonging to another department.' });
    return;
  }

  if (issue.currentStatus === 'Reported' || issue.currentStatus === 'Under Supervisor Review') {
    if (effectiveRole !== 'supervisor' && effectiveRole !== 'coa_admin') {
      res.status(403).json({ success: false, error: 'Only the designated Supervisor can escalate this issue to Zonal Head.' }); return;
    }
    if (targetLevel === 'COA Management' || targetLevel === 'Department Head') {
      res.status(400).json({ success: false, error: 'Hierarchy Violation: Supervisor must forward to Zonal Head first.' }); return;
    }
    issue.currentStatus = 'Escalated to Zonal Head';
    issue.escalatedToZonalAt = nowStr;
    issue.zonalEscalationReason = reason || 'Escalated for Zonal Technical review';
    issue.zonalRemarks = remarks || '';
    issue.modificationHistory.push({
      id: `mod-${Date.now()}`, level: 'Supervisor',
      modifiedBy: modifiedBy || { name: issue.supervisor.name, empId: issue.supervisor.empId, role: 'SSE / Supervisor' },
      dateTime: nowStr, changes: 'Forwarded to Zonal Head with supervisory endorsement',
      remarks: remarks || reason || 'Escalated to Zonal Head', actionTaken: 'Escalated to Zonal Head',
    });
  } else if (issue.currentStatus === 'Escalated to Zonal Head' || issue.currentStatus === 'Under Zonal Review') {
    if (effectiveRole !== 'zonal_head' && effectiveRole !== 'coa_admin') {
      res.status(403).json({ success: false, error: 'Only the Zonal Head can forward this issue to Department Head.' }); return;
    }
    if (targetLevel === 'COA Management') {
      res.status(400).json({ success: false, error: 'Hierarchy Violation: Zonal Head must forward to Department Head first.' }); return;
    }
    issue.currentStatus = 'Escalated to Department Head';
    issue.escalatedToDeptAt = nowStr;
    issue.deptEscalationReason = reason || 'Escalated to Sr. Divisional Engineer';
    issue.deptRemarks = remarks || '';
    issue.modificationHistory.push({
      id: `mod-${Date.now()}`, level: 'Zonal Head',
      modifiedBy: modifiedBy || { name: issue.zonalHead?.name || 'Virendra K. Meena', empId: issue.zonalHead?.empId || 'ZON-CR-1102', role: 'Chief Track Engineer (Zonal Head)' },
      dateTime: nowStr, changes: 'Forwarded to Department Head',
      remarks: remarks || reason || 'Escalated to Department Head', actionTaken: 'Escalated to Department Head',
    });
  } else if (issue.currentStatus === 'Escalated to Department Head' || issue.currentStatus === 'Under Department Review') {
    if (effectiveRole !== 'department_user' && effectiveRole !== 'department_head' && effectiveRole !== 'dept_head' && effectiveRole !== 'coa_admin') {
      res.status(403).json({ success: false, error: 'Only the Department Head can escalate this issue to COA Management.' }); return;
    }
    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, error: 'Reason for COA escalation is mandatory.' }); return;
    }
    issue.currentStatus = 'Escalated to COA';
    issue.escalatedToCoaAt = nowStr;
    issue.coaEscalationReason = reason;
    issue.coaRemarks = remarks || '';
    issue.modificationHistory.push({
      id: `mod-${Date.now()}`, level: 'Department Head',
      modifiedBy: modifiedBy || { name: issue.departmentHead?.name || 'Dr. Pradeep Verma', empId: issue.departmentHead?.empId || 'DPT-CR-5520', role: 'Sr. Divisional Engineer' },
      dateTime: nowStr, changes: `Escalated to COA Management Authority. Reason: ${reason}`,
      remarks: remarks || reason, actionTaken: 'Escalated to COA Management',
    });
  } else {
    res.status(400).json({ success: false, error: `Issue cannot be escalated from current status '${issue.currentStatus}'` }); return;
  }

  issue.updatedAt = nowStr;
  await syncIssueToSupabase('escalated', issue, reason || remarks, modifiedBy?.empId);
  res.json({ success: true, message: `Issue successfully forwarded to ${issue.currentStatus}.`, issue });
};

/** POST /issues/:id/resolve */
export const resolveIssue = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userRole, modifiedBy, resolutionDetails, level } = req.body;

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) { res.status(404).json({ success: false, error: 'Issue not found' }); return; }

  const effectiveRole = (req.headers['x-user-role'] || userRole || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.body.department || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || modifiedBy?.empId || '') as string;

  if (effectiveRole === 'worker') {
    res.status(403).json({ success: false, error: 'Workers cannot certify issue resolution.' }); return;
  }
  if (effectiveRole && !canUserViewIssue(issue, effectiveRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You cannot resolve issues belonging to another department.' });
    return;
  }
  if (!resolutionDetails || !resolutionDetails.trim()) {
    res.status(400).json({ success: false, error: 'Detailed technical resolution summary is required.' }); return;
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  let finalStatus: IssueLifecycleStatus = 'Resolved / Closed';
  if (effectiveRole === 'supervisor') finalStatus = 'Resolved by Supervisor';
  else if (effectiveRole === 'zonal_head') finalStatus = 'Resolved by Zonal Head';
  else if (effectiveRole === 'department_user' || effectiveRole === 'department_head' || effectiveRole === 'dept_head') finalStatus = 'Resolved by Department Head';

  issue.currentStatus = finalStatus;
  issue.resolvedAt = nowStr;
  issue.resolvedBy = { name: modifiedBy?.name || 'Authorized Official', empId: modifiedBy?.empId || 'OFF-001', level: level || effectiveRole };
  issue.resolutionDetails = resolutionDetails;
  issue.modificationHistory.push({
    id: `mod-${Date.now()}`, level: (level as any) || 'COA Management',
    modifiedBy: modifiedBy || { name: 'Authorized Official', empId: 'OFF-001', role: effectiveRole },
    dateTime: nowStr, changes: `Marked resolved: ${resolutionDetails}`,
    remarks: resolutionDetails, actionTaken: `Resolved at ${level || effectiveRole} level`,
  });
  issue.updatedAt = nowStr;

  await syncIssueToSupabase('resolved', issue, resolutionDetails, modifiedBy?.empId);

  // Directly insert into coaFrontendStore.calendarBlocks and Supabase approved_blocks so the time slot is added in the central calendar visible to all roles!
  const blockDate = new Date().toISOString().split('T')[0];
  const newCalendarBlock = {
    id: `blk-res-${issue.id.substring(0, 8)}`,
    title: `[RESOLVED: ${level || effectiveRole}] ${issue.activeRequest?.title || issue.station} Maintenance`,
    station: issue.station || issue.activeRequest?.station || 'Central Line',
    department: issue.department || 'Engineering',
    date: blockDate,
    startTime: '02:00',
    endTime: '04:30',
    priority: 'High' as const,
    status: 'approved' as const,
    description: `Sanctioned maintenance possession following issue resolution at ${level || effectiveRole} level: ${resolutionDetails}`,
    isCluster: false,
    trainsAffected: 0,
  };

  const existingBlockIdx = coaFrontendStore.calendarBlocks.findIndex((b) => b.id === newCalendarBlock.id);
  if (existingBlockIdx >= 0) {
    coaFrontendStore.calendarBlocks[existingBlockIdx] = newCalendarBlock;
  } else {
    coaFrontendStore.calendarBlocks.unshift(newCalendarBlock);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseAdmin.from('approved_blocks').insert({
        asset_section: issue.station || issue.activeRequest?.station || 'Central Railway Corridor',
        department: issue.department?.toLowerCase().includes('elec') ? 'electrical' : issue.department?.toLowerCase().includes('sig') ? 'signal_comm' : 'civil',
        approved_start: new Date().toISOString(),
        approved_end: new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch (sbErr) {
      console.warn('Note inserting approved block on resolveIssue:', sbErr);
    }
  }

  // Broadcast hierarchical slot notification to all roles
  void broadcastSlotApprovalNotification({
    slotId: issue.id,
    slotCode: issue.ticketNo,
    workName: issue.activeRequest?.title || `${issue.department} Defect Resolution`,
    location: issue.station || issue.activeRequest?.station || 'Central Line',
    department: issue.department,
    timing: '02:00 – 04:30 IST',
    startTime: '02:00',
    endTime: '04:30',
    date: blockDate,
    sanctionedByRole: effectiveRole,
    sanctionedByName: modifiedBy?.name || level || effectiveRole,
    notes: resolutionDetails,
  });

  res.json({ success: true, message: `Issue resolved and certified at ${level || effectiveRole} level.`, issue });
};

/** POST /issues/:id/add-remarks */
export const addRemarks = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { modifiedBy, level, remarks } = req.body;

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) { res.status(404).json({ success: false, error: 'Issue not found' }); return; }

  const effectiveRole = (req.headers['x-user-role'] || req.body.userRole || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.body.department || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || modifiedBy?.empId || '') as string;

  if (effectiveRole && !canUserViewIssue(issue, effectiveRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You cannot add remarks to issues belonging to another department.' });
    return;
  }

  if (!remarks || !remarks.trim()) {
    res.status(400).json({ success: false, error: 'Remarks cannot be empty.' }); return;
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  issue.modificationHistory.push({
    id: `mod-${Date.now()}`, level: level || 'Supervisor',
    modifiedBy: modifiedBy || { name: 'Reviewer', empId: 'REV-01', role: level || 'Supervisor' },
    dateTime: nowStr, changes: 'Added technical remarks',
    remarks, actionTaken: 'Technical assessment logged',
  });
  issue.updatedAt = nowStr;

  await syncIssueToSupabase('remarks', issue, remarks, modifiedBy?.empId);
  res.json({ success: true, message: 'Remarks successfully recorded in issue audit history.', issue });
};

/**
 * PATCH /issues/:id/priority
 * Update priority level across all hierarchy levels (Supervisor, Zonal Head, Dept Head, COA Admin)
 */
export const updateIssuePriority = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { priority, modifiedBy, level, remarks } = req.body;

  if (!priority) {
    res.status(400).json({ success: false, error: 'Priority level is required.' });
    return;
  }

  await loadComplaintsFromSupabase();

  const issue = coaFrontendStore.hierarchicalIssues.find((i) => i.id === id || i.ticketNo === id);
  if (!issue) {
    res.status(404).json({ success: false, error: 'Issue not found' });
    return;
  }

  const reqRole = (req.headers['x-user-role'] || req.body.userRole || '') as string;
  const userDept = (req.headers['x-user-dept'] || req.body.department || '') as string;
  const userEmpId = (req.headers['x-user-empid'] || modifiedBy?.empId || '') as string;

  const authCheck = isRoleAuthorizedToModify(issue, reqRole);
  if (!authCheck.authorized) {
    res.status(403).json({ success: false, error: authCheck.reason || 'Matter Escalated: Priority modification disabled at your hierarchy level.' });
    return;
  }

  if (reqRole && !canUserViewIssue(issue, reqRole, userEmpId, userDept)) {
    res.status(403).json({ success: false, error: 'Access Denied: You do not have permission to modify issues in another department.' });
    return;
  }

  const nowStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
  const oldPriority = issue.activeRequest.priority;
  issue.activeRequest.priority = priority as PriorityType;

  const roleTitle = level || (reqRole === 'supervisor' ? 'Supervisor' : reqRole === 'zonal_head' ? 'Zonal Head' : reqRole === 'department_head' ? 'Department Head' : reqRole === 'coa_admin' ? 'COA Admin' : 'Reviewer');

  issue.modificationHistory.push({
    id: `mod-${Date.now()}`,
    level: roleTitle,
    modifiedBy: modifiedBy || { name: `${roleTitle} Reviewer`, empId: userEmpId || 'OFF-001', role: roleTitle },
    dateTime: nowStr,
    changes: `Priority changed from ${oldPriority} to ${priority}`,
    remarks: remarks || `Priority reassessed to ${priority} by ${roleTitle}`,
    actionTaken: `Priority updated to ${priority}`,
  });
  issue.updatedAt = nowStr;

  await syncIssueToSupabase('draft_edit', issue, `Priority changed from ${oldPriority} to ${priority}`, userEmpId);

  res.json({
    success: true,
    message: `Priority updated to ${priority} and synchronized across all hierarchy levels.`,
    issue,
  });
};

