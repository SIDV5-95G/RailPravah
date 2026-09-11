import {
  Complaint,
  ComplaintAuditLog,
  ComplaintStatus,
  UserProfile,
  UserRole,
} from '../types/database.types.js';
import {
  COMPLAINT_STATUS_ORDER,
  NEXT_COMPLAINT_STATUS,
  ROLE_HIERARCHY_LEVEL,
} from '../constants/roles.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { randomUUID } from 'crypto';

export class ComplaintStateMachineService {
  /**
   * Create a new complaint by a Worker
   */
  createComplaint(
    worker: UserProfile,
    description: string,
    photoUrl?: string | null
  ): Complaint {
    if (worker.role !== 'worker') {
      throw new Error('Only Workers are authorized to submit new field complaints.');
    }
    if (!worker.department) {
      throw new Error('Worker must belong to an engineering department.');
    }

    // Identify worker's supervisor
    const supervisorId = worker.reports_to;

    const complaint: Complaint = {
      id: randomUUID(),
      raised_by: worker.id,
      department: worker.department,
      description,
      photo_url: photoUrl || null,
      status: 'open_supervisor',
      current_assignee: supervisorId || null,
      last_edited_by: null,
      last_edited_at: null,
      resolved_by: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.complaints.set(complaint.id, complaint);

    // Audit log
    const audit: ComplaintAuditLog = {
      id: randomUUID(),
      complaint_id: complaint.id,
      actor_id: worker.id,
      action: 'created',
      previous_status: null,
      new_status: 'open_supervisor',
      notes: 'Initial complaint filed by field worker.',
      created_at: new Date().toISOString(),
    };
    inMemoryStore.complaintAuditLogs.push(audit);

    return complaint;
  }

  /**
   * Edit complaint draft/notes
   * Allowed for Supervisor, Zonal Head, Department Head, COA Admin
   * (Anyone at or above the current escalation level)
   * NEVER allowed for the original worker, and NEVER touches status.
   */
  editDraft(
    complaintId: string,
    editor: UserProfile,
    updates: { description?: string; photo_url?: string | null; notes?: string }
  ): Complaint {
    const complaint = inMemoryStore.complaints.get(complaintId);
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    if (complaint.status === 'closed') {
      throw new Error('Cannot edit a closed complaint.');
    }

    // Rule: Worker author can never edit after submission
    if (editor.role === 'worker' || editor.id === complaint.raised_by) {
      throw new Error('Workers cannot edit or modify complaints once submitted.');
    }

    // Rule: Editor must be at or above current escalation level
    const editorLevel = ROLE_HIERARCHY_LEVEL[editor.role];
    const currentStatusLevel = COMPLAINT_STATUS_ORDER[complaint.status];

    if (editorLevel < currentStatusLevel && editor.role !== 'coa_admin') {
      throw new Error(
        `Insufficient privilege: Your role level (${editor.role}) is below the current escalation level (${complaint.status}).`
      );
    }

    // Department check: Non-COA roles must match complaint department
    if (editor.role !== 'coa_admin' && editor.department !== complaint.department) {
      throw new Error('Cannot edit complaint from another department.');
    }

    if (updates.description !== undefined) {
      complaint.description = updates.description;
    }
    if (updates.photo_url !== undefined) {
      complaint.photo_url = updates.photo_url;
    }

    complaint.last_edited_by = editor.id;
    complaint.last_edited_at = new Date().toISOString();
    complaint.updated_at = new Date().toISOString();

    inMemoryStore.complaints.set(complaint.id, complaint);

    // Audit log
    const audit: ComplaintAuditLog = {
      id: randomUUID(),
      complaint_id: complaint.id,
      actor_id: editor.id,
      action: 'draft_edit',
      previous_status: complaint.status,
      new_status: complaint.status,
      notes: updates.notes || 'Complaint details/draft updated.',
      created_at: new Date().toISOString(),
    };
    inMemoryStore.complaintAuditLogs.push(audit);

    return complaint;
  }

  /**
   * Advance complaint to the next escalation level:
   * open_supervisor -> open_zonal_head -> open_department_head -> open_coa
   * COA Admin is terminal and cannot escalate further.
   */
  escalate(complaintId: string, actor: UserProfile, reason?: string): Complaint {
    const complaint = inMemoryStore.complaints.get(complaintId);
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    if (complaint.status === 'closed') {
      throw new Error('Cannot escalate a resolved/closed complaint.');
    }

    if (complaint.status === 'open_coa') {
      throw new Error('Complaint is already at COA Admin level (terminal). It must be resolved.');
    }

    const nextStatus = NEXT_COMPLAINT_STATUS[complaint.status];
    if (!nextStatus) {
      throw new Error(`No valid next escalation state from ${complaint.status}.`);
    }

    // Role check: Actor must be authorized for current escalation level
    const requiredRoleMap: Record<ComplaintStatus, UserRole> = {
      open_supervisor: 'supervisor',
      open_zonal_head: 'zonal_head',
      open_department_head: 'department_head',
      open_coa: 'coa_admin',
      closed: 'coa_admin',
    };

    const expectedRole = requiredRoleMap[complaint.status];
    if (actor.role !== expectedRole && actor.role !== 'coa_admin') {
      throw new Error(
        `Only the current handler (${expectedRole}) or COA Admin can escalate this complaint.`
      );
    }

    const prevStatus = complaint.status;
    complaint.status = nextStatus;
    complaint.updated_at = new Date().toISOString();

    // Find next assignee in hierarchy if available
    if (actor.reports_to) {
      complaint.current_assignee = actor.reports_to;
    } else if (nextStatus === 'open_coa') {
      // Point to COA Admin
      const coaUser = Array.from(inMemoryStore.profiles.values()).find(
        (p) => p.role === 'coa_admin'
      );
      if (coaUser) complaint.current_assignee = coaUser.id;
    }

    inMemoryStore.complaints.set(complaint.id, complaint);

    // Audit log
    const audit: ComplaintAuditLog = {
      id: randomUUID(),
      complaint_id: complaint.id,
      actor_id: actor.id,
      action: 'escalated',
      previous_status: prevStatus,
      new_status: nextStatus,
      notes: reason || `Escalated from ${prevStatus} to ${nextStatus}.`,
      created_at: new Date().toISOString(),
    };
    inMemoryStore.complaintAuditLogs.push(audit);

    return complaint;
  }

  /**
   * Resolve complaint -> Sets status to 'closed'
   * Only callable by the role currently holding the complaint
   */
  resolve(complaintId: string, actor: UserProfile, resolutionNotes?: string): Complaint {
    const complaint = inMemoryStore.complaints.get(complaintId);
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    if (complaint.status === 'closed') {
      throw new Error('Complaint is already closed.');
    }

    // Validate actor is the role currently holding the complaint
    const requiredRoleMap: Record<ComplaintStatus, UserRole> = {
      open_supervisor: 'supervisor',
      open_zonal_head: 'zonal_head',
      open_department_head: 'department_head',
      open_coa: 'coa_admin',
      closed: 'coa_admin',
    };

    const expectedRole = requiredRoleMap[complaint.status];
    if (actor.role !== expectedRole && actor.role !== 'coa_admin') {
      throw new Error(
        `Only the role currently holding this complaint (${expectedRole}) can resolve it.`
      );
    }

    if (actor.role !== 'coa_admin' && actor.department !== complaint.department) {
      throw new Error('Cannot resolve complaint from another department.');
    }

    const prevStatus = complaint.status;
    complaint.status = 'closed';
    complaint.resolved_by = actor.id;
    complaint.resolved_at = new Date().toISOString();
    complaint.updated_at = new Date().toISOString();

    inMemoryStore.complaints.set(complaint.id, complaint);

    // Audit log
    const audit: ComplaintAuditLog = {
      id: randomUUID(),
      complaint_id: complaint.id,
      actor_id: actor.id,
      action: 'resolved',
      previous_status: prevStatus,
      new_status: 'closed',
      notes: resolutionNotes || 'Complaint marked resolved and closed.',
      created_at: new Date().toISOString(),
    };
    inMemoryStore.complaintAuditLogs.push(audit);

    return complaint;
  }
}

export const complaintStateMachineService = new ComplaintStateMachineService();
