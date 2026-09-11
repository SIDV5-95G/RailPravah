import { supabaseAdmin } from '../config/supabase.js';

async function listAll() {
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('*');
  console.log('--- PROFILES TABLE ---');
  console.log(profiles);

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  console.log('--- AUTH USERS ---');
  console.log(authUsers?.users?.map(u => ({ id: u.id, email: u.email, meta: u.user_metadata })));
}

listAll();
