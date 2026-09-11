import { supabaseAdmin } from '../config/supabase.js';

async function checkUser() {
  console.log('--- Checking for WRK-CR-746 ---');
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  const matchAuth = authUsers?.users?.filter(u => u.email?.includes('746') || (u.user_metadata as any)?.employee_id?.includes('746'));
  console.log('Matching Auth users:', matchAuth);

  const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('*');
  const matchProfile = profiles?.filter(p => p.email?.includes('746') || p.name?.includes('746'));
  console.log('Matching Profiles:', matchProfile);
  console.log('All Profiles count:', profiles?.length);
  console.log('All Profiles:', profiles?.map(p => ({ id: p.id, email: p.email, name: p.name, role: p.role })));
}

checkUser();
