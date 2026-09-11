import { supabaseAdmin } from '../config/supabase.js';

async function check() {
  const { data: complaints, error: cErr } = await supabaseAdmin.from('complaints').select('*');
  console.log('Total complaints in DB:', complaints?.length);
  if (complaints && complaints.length > 0) {
    complaints.forEach((c, idx) => {
      console.log(`\n=== Complaint #${idx + 1} ===`);
      console.log('ID:', c.id);
      console.log('Status:', c.status);
      console.log('Dept:', c.department);
      console.log('Description:', c.description);
      console.log('Raised By:', c.raised_by);
      console.log('Current Assignee:', c.current_assignee);
    });
  }

  const { data: reqs } = await supabaseAdmin.from('service_requests').select('*');
  console.log('\n=== Total Service Requests ===', reqs?.length);
  reqs?.forEach((r, idx) => {
    console.log(`\n--- Request #${idx + 1} ---`);
    console.log('ID:', r.id);
    console.log('Asset Section / Station:', r.asset_section);
    console.log('Dept:', r.department);
    console.log('Status:', r.status);
    console.log('Urgency:', r.urgency);
    console.log('Desc:', r.description);
    console.log('Window:', r.requested_start, 'to', r.requested_end);
  });
}

check();
