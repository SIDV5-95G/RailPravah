import {
  AIScheduleProposal,
  ApprovedBlock,
  CalendarEvent,
  Notification,
  ServiceRequest,
  UserProfile,
} from '../types/database.types.js';
import { inMemoryStore } from '../db/in-memory-store.js';
import { randomUUID } from 'crypto';

export class NotificationAndBlockService {
  /**
   * Process acceptance of an AI schedule proposal:
   * 1. Mutates proposal status -> 'accepted'
   * 2. Resolves all role-instances in the involved departments' chains
   * 3. Creates ApprovedBlock
   * 4. Dispatches calendar events for every involved user
   * 5. Dispatches notifications
   * 6. Marks linked service requests -> 'fulfilled'
   */
  async handleProposalDecision(
    proposalId: string,
    decision: 'accept' | 'reject',
    coaAdmin: UserProfile
  ): Promise<{ proposal: AIScheduleProposal; block?: ApprovedBlock; notificationsCount?: number }> {
    if (coaAdmin.role !== 'coa_admin') {
      throw new Error('Only COA Admin can accept or reject schedule proposals.');
    }

    const proposal = inMemoryStore.scheduleProposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Schedule proposal ${proposalId} not found.`);
    }

    if (proposal.status !== 'pending_review') {
      throw new Error(`Proposal is already ${proposal.status} and cannot be decided again.`);
    }

    if (decision === 'reject') {
      proposal.status = 'rejected';
      proposal.decided_at = new Date().toISOString();
      proposal.decided_by = coaAdmin.id;
      inMemoryStore.scheduleProposals.set(proposal.id, proposal);
      return { proposal };
    }

    // --- ACCEPTANCE LOGIC (Atomic execution) ---
    proposal.status = 'accepted';
    proposal.decided_at = new Date().toISOString();
    proposal.decided_by = coaAdmin.id;
    inMemoryStore.scheduleProposals.set(proposal.id, proposal);

    // Retrieve linked requests
    const linkedRequests: ServiceRequest[] = proposal.linked_requests
      .map((id) => inMemoryStore.serviceRequests.get(id))
      .filter((r): r is ServiceRequest => Boolean(r));

    const involvedDepts = Array.from(new Set(linkedRequests.map((r) => r.department)));
    const assetSection = linkedRequests[0]?.asset_section || 'MAINLINE-SECTION';

    // Resolve all users belonging to the involved departments
    const allProfiles = Array.from(inMemoryStore.profiles.values());
    const involvedUsers = allProfiles.filter(
      (p) => p.department && involvedDepts.includes(p.department)
    );

    const involvedUserIds = involvedUsers.map((u) => u.id);

    // Generate Calendar Events
    const calendarEvents: CalendarEvent[] = [];
    const blockId = randomUUID();

    for (const user of involvedUsers) {
      const calEvent: CalendarEvent = {
        id: randomUUID(),
        user_id: user.id,
        block_id: blockId,
        title: `[RailPravah] Approved Maintenance Block: ${assetSection}`,
        start_time: proposal.proposed_start,
        end_time: proposal.proposed_end,
        created_at: new Date().toISOString(),
      };
      calendarEvents.push(calEvent);
      inMemoryStore.calendarEvents.push(calEvent);
    }

    // Generate Notifications
    const notifications: Notification[] = [];
    for (const user of involvedUsers) {
      const notif: Notification = {
        id: randomUUID(),
        user_id: user.id,
        title: `Maintenance Block Approved: ${assetSection}`,
        message: `COA has approved maintenance slot ${proposal.proposed_start} to ${proposal.proposed_end}. Unified block includes ${involvedDepts.join(', ')}.`,
        type: 'block_approved',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      notifications.push(notif);
      inMemoryStore.notifications.push(notif);
    }

    // Create Approved Block
    const approvedBlock: ApprovedBlock = {
      id: blockId,
      schedule_id: proposal.id,
      asset_section: assetSection,
      start_time: proposal.proposed_start,
      end_time: proposal.proposed_end,
      involved_users: involvedUserIds,
      calendar_event_ids: calendarEvents.map((c) => c.id),
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };
    inMemoryStore.approvedBlocks.set(approvedBlock.id, approvedBlock);

    // Mark linked requests as fulfilled
    for (const req of linkedRequests) {
      req.status = 'fulfilled';
      req.updated_at = new Date().toISOString();
      inMemoryStore.serviceRequests.set(req.id, req);
    }

    return {
      proposal,
      block: approvedBlock,
      notificationsCount: notifications.length,
    };
  }
}

export const notificationAndBlockService = new NotificationAndBlockService();
