import { supabaseAdmin } from '../config/supabase.js';
import { isSupabaseConfigured } from '../config/env.js';
import { coaFrontendStore } from '../db/coa-frontend-store.js';

async function purgeComplaints() {
  console.log('=== Purging All Complaints and Audit Logs from Database & Memory Store ===\n');

  if (isSupabaseConfigured()) {
    try {
      // Delete all complaint audit logs
      const { error: auditErr, count: auditCount } = await supabaseAdmin
        .from('complaint_audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (auditErr) {
        console.warn('Warning deleting audit logs:', auditErr.message);
      } else {
        console.log('✅ Cleared complaint_audit_logs table.');
      }

      // Delete all complaints
      const { error: compErr, count: compCount } = await supabaseAdmin
        .from('complaints')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (compErr) {
        console.warn('Warning deleting complaints:', compErr.message);
      } else {
        console.log('✅ Cleared complaints table.');
      }
    } catch (err) {
      console.error('Error during Supabase complaints cleanup:', err);
    }
  }

  // Clear in-memory issue store
  coaFrontendStore.hierarchicalIssues = [];
  console.log('✅ Cleared in-memory hierarchical issues store.');

  console.log('\n=== Complaints Purge Completed Successfully ===');
}

purgeComplaints().catch(console.error);
