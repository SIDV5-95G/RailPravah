import { supabaseAdmin } from '../config/supabase.js';

async function seedCoaAdmin() {
  const empId = 'COA-CR-4891';
  const email = 'coa-cr-4891@railpravah.gov.in';
  const password = 'RailPravah@2026';
  const name = 'Chief COA Operations Controller';
  const role = 'coa_admin';

  console.log(`Ensuring COA Admin user (${empId} / ${email}) exists in Supabase Auth...`);

  // Check if auth user exists
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const existingAuthUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  let userId: string;

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    console.log(`Found existing auth user ID: ${userId}. Updating password...`);
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: { name, role, employee_id: empId },
    });
  } else {
    console.log(`Creating new Supabase Auth user for ${email}...`);
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, employee_id: empId },
    });

    if (createErr) {
      console.error('Failed to create auth user:', createErr);
      return;
    }
    userId = newUser.user.id;
    console.log(`Created auth user ID: ${userId}`);
  }

  // Ensure entry in profiles table
  console.log(`Upserting profile in 'profiles' table for ID: ${userId}...`);
  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: email,
    name: name,
    role: role,
    department: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (profileErr) {
    console.error('Profile upsert error:', profileErr);
  } else {
    console.log('✅ Successfully seeded COA Admin into Supabase Auth & profiles table!');
  }
}

seedCoaAdmin();
