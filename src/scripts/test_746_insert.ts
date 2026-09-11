import { supabaseAdmin } from '../config/supabase.js';

async function testInsert() {
  const userId = '4f741439-52c9-4106-8b5f-8a26e6bdfcb9';
  const email = 'wrk-cr-746@railpravah.gov.in';
  const name = 'Ram Pawar';
  const role = 'worker';
  const department = 'signal_comm';

  // find supervisor
  const { data: sup } = await supabaseAdmin.from('profiles').select('id, name').eq('role', 'supervisor').eq('department', department).limit(1);
  console.log('Found supervisor:', sup);
  const superiorId = sup?.[0]?.id || null;

  const payload = {
    id: userId,
    email,
    name,
    role,
    department,
    reports_to: superiorId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('profiles').upsert(payload);
  console.log('Upsert result:', data, 'Error:', error);
}

testInsert();
